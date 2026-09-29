import { pool } from "../config/database.js";


/* =========================================================
   ERROS
========================================================= */

function criarErro(status, mensagem) {

    const erro =
        new Error(mensagem);

    erro.status =
        status;

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


function possuiPermissao(
    usuario,
    codigo
) {

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


function podeVisualizarTodasSecoes(
    usuario
) {

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
   OPÇÕES
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


    let resultadoSecoes;


    if (
        podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        resultadoSecoes =
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


        resultadoSecoes =
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


    const resultadoSituacoes =
        await pool.query(
            `
                SELECT
                    id,
                    codigo,
                    nome,
                    disponivel,
                    ordem

                FROM situacoes

                WHERE ativa = TRUE

                ORDER BY ordem ASC
            `
        );


    return {

        secoes:
            resultadoSecoes.rows.map(
                secao => ({

                    id:
                        String(secao.id),

                    sigla:
                        secao.sigla,

                    nome:
                        secao.nome

                })
            ),

        situacoes:
            resultadoSituacoes.rows.map(
                situacao => ({

                    id:
                        String(situacao.id),

                    codigo:
                        situacao.codigo,

                    nome:
                        situacao.nome,

                    disponivel:
                        situacao.disponivel,

                    ordem:
                        situacao.ordem

                })
            )

    };

}


/* =========================================================
   PESQUISAR
========================================================= */

async function pesquisar({

    usuario,

    termo = null,

    data = null,

    secaoId = null,

    situacaoId = null,

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


    const condicoes = [];

    const valores = [];


    function adicionarValor(
        valor
    ) {

        valores.push(valor);

        return `$${valores.length}`;

    }


    /* =====================================================
       CONTROLE DE SEÇÃO
    ===================================================== */

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


        const parametro =
            adicionarValor(
                secaoUsuario
            );


        condicoes.push(
            `c.secao_id = ${parametro}`
        );

    } else if (secaoId) {

        const parametro =
            adicionarValor(
                secaoId
            );


        condicoes.push(
            `c.secao_id = ${parametro}`
        );

    }


    /* =====================================================
       TERMO
    ===================================================== */

    const termoLimpo =
        String(
            termo ?? ""
        ).trim();


    if (termoLimpo) {

        const parametro =
            adicionarValor(
                `%${termoLimpo}%`
            );


        condicoes.push(
            `
                (
                    m.nome_guerra
                        ILIKE ${parametro}

                    OR m.nome_completo
                        ILIKE ${parametro}

                    OR m.saram
                        ILIKE ${parametro}
                )
            `
        );

    }


    /* =====================================================
       DATA
    ===================================================== */

    if (data) {

        const parametro =
            adicionarValor(
                data
            );


        condicoes.push(
            `c.data = ${parametro}`
        );

    }


    /* =====================================================
       SITUAÇÃO
    ===================================================== */

    if (situacaoId) {

        const parametro =
            adicionarValor(
                situacaoId
            );


        condicoes.push(
            `cm.situacao_id = ${parametro}`
        );

    }


    const where =
        condicoes.length
            ? `WHERE ${condicoes.join(
                " AND "
            )}`
            : "";


    /* =====================================================
       TOTAL
    ===================================================== */

    const resultadoTotal =
        await pool.query(
            `
                SELECT
                    COUNT(*)::INTEGER AS total

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id =
                        cm.chamada_id

                INNER JOIN militares m
                    ON m.id =
                        cm.militar_id

                ${where}
            `,
            valores
        );


    const total =
        resultadoTotal.rows[0]?.total ||
        0;


    /* =====================================================
       CONSULTA
    ===================================================== */

    const valoresConsulta = [
        ...valores,
        paginacao.limite,
        paginacao.offset
    ];


    const parametroLimite =
        valores.length + 1;


    const parametroOffset =
        valores.length + 2;


    const resultado =
        await pool.query(
            `
                SELECT

                    cm.id,

                    cm.presente,

                    cm.observacao,

                    cm.registrado_em,

                    c.id AS chamada_id,

                    TO_CHAR(
                        c.data,
                        'YYYY-MM-DD'
                    ) AS data,

                    c.status AS chamada_status,

                    s.id AS secao_id,

                    s.sigla AS secao_sigla,

                    s.nome AS secao_nome,

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

                    sit.disponivel

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id =
                        cm.chamada_id

                INNER JOIN secoes s
                    ON s.id =
                        c.secao_id

                INNER JOIN militares m
                    ON m.id =
                        cm.militar_id

                INNER JOIN postos_graduacoes pg
                    ON pg.id =
                        m.posto_graduacao_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                ${where}

                ORDER BY

                    c.data DESC,

                    pg.ordem ASC,

                    m.nome_guerra ASC

                LIMIT $${parametroLimite}

                OFFSET $${parametroOffset}
            `,
            valoresConsulta
        );


    return {

        resultados:
            resultado.rows.map(
                item => ({

                    id:
                        String(item.id),

                    chamada: {

                        id:
                            String(
                                item.chamada_id
                            ),

                        data:
                            item.data,

                        status:
                            item.chamada_status

                    },

                    secao: {

                        id:
                            String(
                                item.secao_id
                            ),

                        sigla:
                            item.secao_sigla,

                        nome:
                            item.secao_nome

                    },

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
            ),

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
   EXPORTS
========================================================= */

export {

    buscarOpcoes,

    pesquisar

};