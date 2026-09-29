import { pool } from "../config/database.js";


/* =========================================================
   ERROS
========================================================= */

function criarErro(status, mensagem) {

    const erro = new Error(mensagem);

    erro.status = status;

    return erro;

}


/* =========================================================
   USUÁRIO
========================================================= */

function obterSecaoUsuario(usuario) {

    return (
        usuario?.secao?.id ??
        usuario?.secaoId ??
        usuario?.secao_id ??
        null
    );

}


function possuiPermissao(usuario, codigo) {

    const permissoes =
        usuario?.permissoes || [];


    return permissoes.some(
        permissao => {

            if (
                typeof permissao === "string"
            ) {

                return permissao === codigo;

            }


            return (
                permissao?.codigo === codigo
            );

        }
    );

}


function podeVisualizarTodasSecoes(usuario) {

    return possuiPermissao(
        usuario,
        "SECOES_VISUALIZAR_TODAS"
    );

}


/* =========================================================
   PAGINAÇÃO
========================================================= */

function resolverPaginacao(
    pagina,
    limite
) {

    const paginaNumerica =
        Math.max(
            Number.parseInt(
                pagina,
                10
            ) || 1,
            1
        );


    const limiteNumerico =
        Math.min(
            Math.max(
                Number.parseInt(
                    limite,
                    10
                ) || 20,
                1
            ),
            100
        );


    return {

        pagina:
            paginaNumerica,

        limite:
            limiteNumerico,

        offset:
            (
                paginaNumerica - 1
            ) * limiteNumerico

    };

}


/* =========================================================
   FILTROS
========================================================= */

function montarFiltros({
    usuario,
    dataInicio,
    dataFim,
    secaoId,
    status
}) {

    const condicoes = [];

    const valores = [];


    function adicionar(
        condicao,
        valor
    ) {

        valores.push(valor);

        condicoes.push(
            condicao.replace(
                "?",
                `$${valores.length}`
            )
        );

    }


    /*
        USUÁRIO OPERACIONAL
        SEMPRE FICA RESTRITO À PRÓPRIA SEÇÃO
    */

    if (
        !podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        const secaoUsuario =
            obterSecaoUsuario(
                usuario
            );


        if (!secaoUsuario) {

            throw criarErro(
                403,
                "O usuário não possui uma seção vinculada."
            );

        }


        adicionar(
            "c.secao_id = ?",
            secaoUsuario
        );

    } else if (secaoId) {

        adicionar(
            "c.secao_id = ?",
            secaoId
        );

    }


    if (dataInicio) {

        adicionar(
            "c.data >= ?",
            dataInicio
        );

    }


    if (dataFim) {

        adicionar(
            "c.data <= ?",
            dataFim
        );

    }


    if (status) {

        const statusPermitidos = [
            "PENDENTE",
            "EM_ANDAMENTO",
            "REALIZADA"
        ];


        if (
            !statusPermitidos.includes(
                status
            )
        ) {

            throw criarErro(
                400,
                "Status de chamada inválido."
            );

        }


        adicionar(
            "c.status = ?",
            status
        );

    }


    return {

        where:
            condicoes.length
                ? `WHERE ${condicoes.join(
                    " AND "
                )}`
                : "",

        valores

    };

}

/* =========================================================
   OPÇÕES DOS REGISTROS
========================================================= */

async function buscarOpcoes({
    usuario
}) {

    if (!usuario) {

        throw criarErro(
            401,
            "Usuário não autenticado."
        );

    }


    let resultado;


    if (
        podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        resultado =
            await pool.query(
                `
                    SELECT
                        id,
                        sigla,
                        nome

                    FROM secoes

                    WHERE ativa = TRUE

                    ORDER BY sigla ASC
                `
            );

    } else {

        const secaoUsuario =
            obterSecaoUsuario(
                usuario
            );


        if (!secaoUsuario) {

            throw criarErro(
                403,
                "O usuário não possui uma seção vinculada."
            );

        }


        resultado =
            await pool.query(
                `
                    SELECT
                        id,
                        sigla,
                        nome

                    FROM secoes

                    WHERE
                        id = $1
                        AND ativa = TRUE

                    LIMIT 1
                `,
                [
                    secaoUsuario
                ]
            );

    }


    return {

        secoes:
            resultado.rows.map(
                secao => ({

                    id:
                        String(
                            secao.id
                        ),

                    sigla:
                        secao.sigla,

                    nome:
                        secao.nome

                })
            )

    };

}


/* =========================================================
   LISTAR REGISTROS
========================================================= */

async function listar({
    usuario,
    dataInicio = null,
    dataFim = null,
    secaoId = null,
    status = null,
    pagina = 1,
    limite = 20
}) {

    if (!usuario) {

        throw criarErro(
            401,
            "Usuário não autenticado."
        );

    }


    const paginacao =
        resolverPaginacao(
            pagina,
            limite
        );


    const filtros =
        montarFiltros({

            usuario,

            dataInicio,

            dataFim,

            secaoId,

            status

        });


const consultaResumo =
    await pool.query(
        `
            SELECT

                COUNT(*)::INTEGER
                    AS total,

                COUNT(*) FILTER (
                    WHERE c.status = 'REALIZADA'
                )::INTEGER
                    AS realizadas,

                COUNT(*) FILTER (
                    WHERE c.status = 'EM_ANDAMENTO'
                )::INTEGER
                    AS em_andamento,

                COUNT(*) FILTER (
                    WHERE c.status = 'PENDENTE'
                )::INTEGER
                    AS pendentes

            FROM chamadas c

            ${filtros.where}
        `,
        filtros.valores
    );


    const valoresConsulta = [
        ...filtros.valores,
        paginacao.limite,
        paginacao.offset
    ];


    const indiceLimite =
        filtros.valores.length + 1;


    const indiceOffset =
        filtros.valores.length + 2;


    const resultado =
        await pool.query(
            `
                SELECT

                    c.id,

                    TO_CHAR(
                        c.data,
                        'YYYY-MM-DD'
                    ) AS data,

                    c.status,

                    c.data_hora_inicio,

                    c.data_hora_conclusao,

                    s.id AS secao_id,

                    s.sigla AS secao_sigla,

                    s.nome AS secao_nome,

                    u.id AS responsavel_id,

                    u.nome AS responsavel_nome,

                    COUNT(
                        cm.id
                    )::INTEGER AS registrados,

                    COUNT(
                        cm.id
                    ) FILTER (
                        WHERE sit.disponivel = TRUE
                    )::INTEGER AS disponiveis,

                    COUNT(
                        cm.id
                    ) FILTER (
                        WHERE sit.disponivel = FALSE
                    )::INTEGER AS indisponiveis

                FROM chamadas c

                INNER JOIN secoes s
                    ON s.id = c.secao_id

                LEFT JOIN usuarios u
                    ON u.id =
                        c.responsavel_usuario_id

                LEFT JOIN chamada_militares cm
                    ON cm.chamada_id = c.id

                LEFT JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                ${filtros.where}

                GROUP BY

                    c.id,

                    c.data,

                    c.status,

                    c.data_hora_inicio,

                    c.data_hora_conclusao,

                    s.id,

                    s.sigla,

                    s.nome,

                    u.id,

                    u.nome

                ORDER BY
                    c.data DESC,
                    s.sigla ASC

                LIMIT $${indiceLimite}

                OFFSET $${indiceOffset}
            `,
            valoresConsulta
        );


const resumo =
    consultaResumo.rows[0] || {};


const total =
    resumo.total || 0;


    return {

        registros:
            resultado.rows.map(
                registro => ({

                    id:
                        String(
                            registro.id
                        ),

                    data:
                        registro.data,

                    status:
                        registro.status,

                    dataHoraInicio:
                        registro.data_hora_inicio,

                    dataHoraConclusao:
                        registro.data_hora_conclusao,

                    secao: {

                        id:
                            String(
                                registro.secao_id
                            ),

                        sigla:
                            registro.secao_sigla,

                        nome:
                            registro.secao_nome

                    },

                    responsavel:
                        registro.responsavel_id
                            ? {

                                id:
                                    String(
                                        registro.responsavel_id
                                    ),

                                nome:
                                    registro.responsavel_nome

                            }
                            : null,

                    totais: {

                        registrados:
                            registro.registrados,

                        disponiveis:
                            registro.disponiveis,

                        indisponiveis:
                            registro.indisponiveis

                    }

                })
            ),
            resumo: {

    total:
        total,

    realizadas:
        resumo.realizadas || 0,

    emAndamento:
        resumo.em_andamento || 0,

    pendentes:
        resumo.pendentes || 0

},

        paginacao: {

            pagina:
                paginacao.pagina,

            limite:
                paginacao.limite,

            total,

            totalPaginas:
                Math.ceil(
                    total /
                    paginacao.limite
                )

        }

    };

}


/* =========================================================
   DETALHAR REGISTRO
========================================================= */

async function buscarPorId({
    usuario,
    chamadaId
}) {

    if (!usuario) {

        throw criarErro(
            401,
            "Usuário não autenticado."
        );

    }


    const resultadoChamada =
        await pool.query(
            `
                SELECT

                    c.id,

                    TO_CHAR(
                        c.data,
                        'YYYY-MM-DD'
                    ) AS data,

                    c.status,

                    c.secao_id,

                    c.data_hora_inicio,

                    c.data_hora_conclusao,

                    s.sigla AS secao_sigla,

                    s.nome AS secao_nome,

                    u.id AS responsavel_id,

                    u.nome AS responsavel_nome

                FROM chamadas c

                INNER JOIN secoes s
                    ON s.id = c.secao_id

                LEFT JOIN usuarios u
                    ON u.id =
                        c.responsavel_usuario_id

                WHERE c.id = $1

                LIMIT 1
            `,
            [
                chamadaId
            ]
        );


    if (
        resultadoChamada.rowCount === 0
    ) {

        throw criarErro(
            404,
            "Registro de chamada não encontrado."
        );

    }


    const chamada =
        resultadoChamada.rows[0];


    /*
        CONTROLE DE ACESSO POR SEÇÃO
    */

    if (
        !podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        const secaoUsuario =
            obterSecaoUsuario(
                usuario
            );


        if (
            String(secaoUsuario) !==
            String(chamada.secao_id)
        ) {

            throw criarErro(
                403,
                "Você não possui acesso aos registros desta seção."
            );

        }

    }


    const resultadoMilitares =
        await pool.query(
            `
                SELECT

                    m.id AS militar_id,

                    m.nome_completo,

                    m.nome_guerra,

                    m.saram,

                    pg.id AS posto_id,

                    pg.sigla AS posto_sigla,

                    pg.nome AS posto_nome,

                    pg.ordem AS posto_ordem,

                    sit.id AS situacao_id,

                    sit.codigo AS situacao_codigo,

                    sit.nome AS situacao_nome,

                    sit.disponivel,

                    cm.presente,

                    cm.observacao,

                    cm.registrado_em

                FROM chamada_militares cm

                INNER JOIN militares m
                    ON m.id = cm.militar_id

                INNER JOIN postos_graduacoes pg
                    ON pg.id =
                        m.posto_graduacao_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                WHERE
                    cm.chamada_id = $1

                ORDER BY

                    pg.ordem ASC,

                    m.nome_guerra ASC
            `,
            [
                chamadaId
            ]
        );


    const militares =
        resultadoMilitares.rows.map(
            item => ({

                militar: {

                    id:
                        String(
                            item.militar_id
                        ),

                    nomeCompleto:
                        item.nome_completo,

                    nomeGuerra:
                        item.nome_guerra,

                    saram:
                        item.saram,

                    postoGraduacao: {

                        id:
                            String(
                                item.posto_id
                            ),

                        sigla:
                            item.posto_sigla,

                        nome:
                            item.posto_nome,

                        ordem:
                            item.posto_ordem

                    }

                },

                situacao: {

                    id:
                        String(
                            item.situacao_id
                        ),

                    codigo:
                        item.situacao_codigo,

                    nome:
                        item.situacao_nome,

                    disponivel:
                        item.disponivel

                },

                presente:
                    item.presente,

                observacao:
                    item.observacao,

                registradoEm:
                    item.registrado_em

            })
        );


    return {

        chamada: {

            id:
                String(
                    chamada.id
                ),

            data:
                chamada.data,

            status:
                chamada.status,

            dataHoraInicio:
                chamada.data_hora_inicio,

            dataHoraConclusao:
                chamada.data_hora_conclusao,

            secao: {

                id:
                    String(
                        chamada.secao_id
                    ),

                sigla:
                    chamada.secao_sigla,

                nome:
                    chamada.secao_nome

            },

            responsavel:
                chamada.responsavel_id
                    ? {

                        id:
                            String(
                                chamada.responsavel_id
                            ),

                        nome:
                            chamada.responsavel_nome

                    }
                    : null

        },

        militares,

        totais: {

            registrados:
                militares.length,

            disponiveis:
                militares.filter(
                    item =>
                        item.situacao
                            .disponivel === true
                ).length,

            indisponiveis:
                militares.filter(
                    item =>
                        item.situacao
                            .disponivel === false
                ).length

        }

    };

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    buscarOpcoes,

    listar,

    buscarPorId

};