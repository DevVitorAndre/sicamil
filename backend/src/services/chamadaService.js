import { pool } from "../config/database.js";


/* =========================================================
   ERROS
========================================================= */

function criarErro(status, mensagem, detalhes = null) {

    const erro = new Error(mensagem);

    erro.status = status;

    if (detalhes) {
        erro.detalhes = detalhes;
    }

    return erro;

}


/* =========================================================
   USUÁRIO / PERMISSÕES
========================================================= */

function obterUsuarioId(usuario) {

    return (
        usuario?.id ??
        usuario?.usuarioId ??
        usuario?.usuario_id ??
        null
    );

}


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


    return permissoes.some(permissao => {

        if (typeof permissao === "string") {
            return permissao === codigo;
        }

        return permissao?.codigo === codigo;

    });

}


function podeVisualizarTodasSecoes(usuario) {

    return possuiPermissao(
        usuario,
        "SECOES_VISUALIZAR_TODAS"
    );

}


/* =========================================================
   DATA
========================================================= */

async function resolverData(data = null, client = pool) {

    if (
        data !== null &&
        data !== undefined &&
        data !== ""
    ) {

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(data)
        ) {

            throw criarErro(
                400,
                "Data da chamada inválida."
            );

        }

    }


    try {

        const resultado =
            await client.query(
                `
                    SELECT
                        TO_CHAR(
                            COALESCE(
                                $1::date,
                                CURRENT_DATE
                            ),
                            'YYYY-MM-DD'
                        ) AS data
                `,
                [
                    data || null
                ]
            );


        return resultado.rows[0].data;


    } catch (erro) {

        if (
            erro.code === "22007" ||
            erro.code === "22008"
        ) {

            throw criarErro(
                400,
                "Data da chamada inválida."
            );

        }

        throw erro;

    }

}


/* =========================================================
   SEÇÃO
========================================================= */

async function resolverSecao(
    usuario,
    secaoIdSolicitada = null,
    client = pool
) {

    const visualizaTodas =
        podeVisualizarTodasSecoes(usuario);


    const secaoUsuario =
        obterSecaoUsuario(usuario);


    let secaoId;


    /*
        GERENTE / USUÁRIO COM PERMISSÃO PARA VER TODAS

        Precisa informar qual seção deseja trabalhar.
    */

    if (visualizaTodas) {

        if (!secaoIdSolicitada) {

            throw criarErro(
                400,
                "Selecione a seção da chamada."
            );

        }

        secaoId =
            secaoIdSolicitada;

    } else {

        /*
            USUÁRIO OPERACIONAL

            A seção é determinada pelo próprio login.
        */

        if (!secaoUsuario) {

            throw criarErro(
                403,
                "O usuário não possui uma seção vinculada."
            );

        }


        if (
            secaoIdSolicitada &&
            String(secaoIdSolicitada) !==
            String(secaoUsuario)
        ) {

            throw criarErro(
                403,
                "Você não possui acesso a esta seção."
            );

        }


        secaoId =
            secaoUsuario;

    }


    const resultado =
        await client.query(
            `
                SELECT
                    id,
                    sigla,
                    nome,
                    ativa

                FROM secoes

                WHERE id = $1
            `,
            [
                secaoId
            ]
        );


    if (
        resultado.rows.length === 0
    ) {

        throw criarErro(
            404,
            "Seção não encontrada."
        );

    }


    const secao =
        resultado.rows[0];


    if (!secao.ativa) {

        throw criarErro(
            400,
            "A seção selecionada está inativa."
        );

    }


    return {

        id:
            String(secao.id),

        sigla:
            secao.sigla,

        nome:
            secao.nome

    };

}


/* =========================================================
   SITUAÇÕES
========================================================= */

async function buscarSituacoes(
    client = pool
) {

    const resultado =
        await client.query(
            `
                SELECT
                    id,
                    codigo,
                    nome,
                    disponivel,
                    ordem

                FROM situacoes

                WHERE ativa = TRUE

                ORDER BY
                    ordem ASC,
                    nome ASC
            `
        );


    return resultado.rows.map(
        situacao => ({

            id:
                String(situacao.id),

            codigo:
                situacao.codigo,

            nome:
                situacao.nome,

            disponivel:
                Boolean(
                    situacao.disponivel
                ),

            ordem:
                situacao.ordem

        })
    );

}


/* =========================================================
   MILITARES DA SEÇÃO
========================================================= */

async function buscarMilitaresSecao(
    secaoId,
    client = pool
) {

    const resultado =
        await client.query(
            `
                SELECT

                    m.id,

                    m.nome_completo,

                    m.nome_guerra,

                    m.saram,

                    pg.id
                        AS posto_graduacao_id,

                    pg.sigla
                        AS posto_graduacao_sigla,

                    pg.nome
                        AS posto_graduacao_nome,

                    pg.ordem
                        AS posto_graduacao_ordem

                FROM militares m

                INNER JOIN postos_graduacoes pg
                    ON pg.id =
                       m.posto_graduacao_id

                WHERE
                    m.secao_id = $1

                    AND m.ativo = TRUE

                ORDER BY
                    pg.ordem ASC,
                    m.nome_guerra ASC
            `,
            [
                secaoId
            ]
        );


    return resultado.rows.map(
        militar => ({

            id:
                String(militar.id),

            nomeCompleto:
                militar.nome_completo,

            nomeGuerra:
                militar.nome_guerra,

            saram:
                militar.saram,

            postoGraduacao: {

                id:
                    String(
                        militar
                            .posto_graduacao_id
                    ),

                sigla:
                    militar
                        .posto_graduacao_sigla,

                nome:
                    militar
                        .posto_graduacao_nome,

                ordem:
                    militar
                        .posto_graduacao_ordem

            }

        })
    );

}


/* =========================================================
   FORMATAR CHAMADA
========================================================= */

function formatarChamada(linha) {

    if (!linha) {
        return null;
    }


    return {

        id:
            String(linha.id),

        data:
            linha.data_formatada ??
            linha.data,

        status:
            linha.status,

        secao: {

            id:
                String(
                    linha.secao_id
                ),

            sigla:
                linha.secao_sigla,

            nome:
                linha.secao_nome

        },

        responsavel: {

            id:
                linha.responsavel_usuario_id
                    ? String(
                        linha.responsavel_usuario_id
                    )
                    : null,

            nome:
                linha.responsavel_nome ??
                null

        },

        dataHoraInicio:
            linha.data_hora_inicio,

        dataHoraConclusao:
            linha.data_hora_conclusao,

        createdAt:
            linha.created_at,

        updatedAt:
            linha.updated_at

    };

}


/* =========================================================
   BUSCAR CHAMADA
========================================================= */

async function buscarChamadaPorSecaoData(
    secaoId,
    data,
    client = pool
) {

    const resultado =
        await client.query(
            `
                SELECT

                    c.id,

                    TO_CHAR(
                        c.data,
                        'YYYY-MM-DD'
                    )
                        AS data_formatada,

                    c.status,

                    c.secao_id,

                    s.sigla
                        AS secao_sigla,

                    s.nome
                        AS secao_nome,

                    c.responsavel_usuario_id,

                    u.nome
                        AS responsavel_nome,

                    c.data_hora_inicio,

                    c.data_hora_conclusao,

                    c.created_at,

                    c.updated_at

                FROM chamadas c

                INNER JOIN secoes s
                    ON s.id =
                       c.secao_id

                LEFT JOIN usuarios u
                    ON u.id =
                       c.responsavel_usuario_id

                WHERE
                    c.secao_id = $1

                    AND c.data = $2::date

                LIMIT 1
            `,
            [
                secaoId,
                data
            ]
        );


    if (
        resultado.rows.length === 0
    ) {

        return null;

    }


    return formatarChamada(
        resultado.rows[0]
    );

}


/* =========================================================
   BUSCAR CHAMADA POR ID
========================================================= */

async function buscarChamadaBasePorId(
    chamadaId,
    client = pool
) {

    const resultado =
        await client.query(
            `
                SELECT

                    c.id,

                    TO_CHAR(
                        c.data,
                        'YYYY-MM-DD'
                    )
                        AS data_formatada,

                    c.status,

                    c.secao_id,

                    s.sigla
                        AS secao_sigla,

                    s.nome
                        AS secao_nome,

                    c.responsavel_usuario_id,

                    u.nome
                        AS responsavel_nome,

                    c.data_hora_inicio,

                    c.data_hora_conclusao,

                    c.created_at,

                    c.updated_at

                FROM chamadas c

                INNER JOIN secoes s
                    ON s.id =
                       c.secao_id

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
        resultado.rows.length === 0
    ) {

        throw criarErro(
            404,
            "Chamada não encontrada."
        );

    }


    return formatarChamada(
        resultado.rows[0]
    );

}


/* =========================================================
   VALIDAR ACESSO À CHAMADA
========================================================= */

function validarAcessoChamada(
    usuario,
    chamada
) {

    if (
        podeVisualizarTodasSecoes(usuario)
    ) {

        return;

    }


    const secaoUsuario =
        obterSecaoUsuario(usuario);


    if (
        !secaoUsuario ||
        String(secaoUsuario) !==
        String(chamada.secao.id)
    ) {

        throw criarErro(
            403,
            "Você não possui acesso a esta chamada."
        );

    }

}


/* =========================================================
   REGISTROS DOS MILITARES
========================================================= */

async function buscarRegistrosChamada(
    chamadaId,
    client = pool
) {

    const resultado =
        await client.query(
            `
                SELECT

                    cm.id,

                    cm.chamada_id,

                    cm.militar_id,

                    cm.situacao_id,

                    cm.presente,

                    cm.observacao,

                    cm.registrado_em,

                    m.nome_completo,

                    m.nome_guerra,

                    m.saram,

                    pg.id
                        AS posto_graduacao_id,

                    pg.sigla
                        AS posto_graduacao_sigla,

                    pg.nome
                        AS posto_graduacao_nome,

                    pg.ordem
                        AS posto_graduacao_ordem,

                    st.codigo
                        AS situacao_codigo,

                    st.nome
                        AS situacao_nome,

                    st.disponivel
                        AS situacao_disponivel

                FROM chamada_militares cm

                INNER JOIN militares m
                    ON m.id =
                       cm.militar_id

                INNER JOIN postos_graduacoes pg
                    ON pg.id =
                       m.posto_graduacao_id

                INNER JOIN situacoes st
                    ON st.id =
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


    return resultado.rows.map(
        registro => ({

            id:
                String(registro.id),

            militarId:
                String(
                    registro.militar_id
                ),

            nomeCompleto:
                registro.nome_completo,

            nomeGuerra:
                registro.nome_guerra,

            saram:
                registro.saram,

            postoGraduacao: {

                id:
                    String(
                        registro
                            .posto_graduacao_id
                    ),

                sigla:
                    registro
                        .posto_graduacao_sigla,

                nome:
                    registro
                        .posto_graduacao_nome,

                ordem:
                    registro
                        .posto_graduacao_ordem

            },

            situacao: {

                id:
                    String(
                        registro.situacao_id
                    ),

                codigo:
                    registro.situacao_codigo,

                nome:
                    registro.situacao_nome,

                disponivel:
                    Boolean(
                        registro
                            .situacao_disponivel
                    )

            },

            presente:
                Boolean(
                    registro.presente
                ),

            observacao:
                registro.observacao || "",

            registradoEm:
                registro.registrado_em

        })
    );

}


/* =========================================================
   CONTEXTO DA TELA
========================================================= */

async function buscarContexto({
    usuario,
    secaoId = null,
    data = null
}) {

    const secao =
        await resolverSecao(
            usuario,
            secaoId
        );


    const dataResolvida =
        await resolverData(
            data
        );


    const [
        situacoes,
        militares,
        chamada
    ] = await Promise.all([

        buscarSituacoes(),

        buscarMilitaresSecao(
            secao.id
        ),

        buscarChamadaPorSecaoData(
            secao.id,
            dataResolvida
        )

    ]);


    let registros = [];


    if (chamada) {

        registros =
            await buscarRegistrosChamada(
                chamada.id
            );

    }


    return {

        data:
            dataResolvida,

        secao,

        situacoes,

        militares,

        chamada,

        registros

    };

}


/* =========================================================
   INICIAR CHAMADA
========================================================= */

async function iniciar({
    usuario,
    secaoId = null,
    data = null
}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const usuarioId =
            obterUsuarioId(usuario);


        if (!usuarioId) {

            throw criarErro(
                401,
                "Usuário não identificado."
            );

        }


        const secao =
            await resolverSecao(
                usuario,
                secaoId,
                client
            );


        const dataResolvida =
            await resolverData(
                data,
                client
            );


        const existente =
            await buscarChamadaPorSecaoData(
                secao.id,
                dataResolvida,
                client
            );


        /*
            CHAMADA JÁ EXISTE
        */

        if (existente) {

            if (
                existente.status ===
                "REALIZADA"
            ) {

                throw criarErro(
                    409,
                    "A chamada desta seção já foi realizada nesta data."
                );

            }


            /*
                SE ESTAVA PENDENTE,
                PASSA PARA EM ANDAMENTO.
            */

            if (
                existente.status ===
                "PENDENTE"
            ) {

                await client.query(
                    `
                        UPDATE chamadas

                        SET
                            status =
                                'EM_ANDAMENTO',

                            responsavel_usuario_id =
                                $2,

                            data_hora_inicio =
                                COALESCE(
                                    data_hora_inicio,
                                    NOW()
                                ),

                            updated_at =
                                NOW()

                        WHERE id = $1
                    `,
                    [
                        existente.id,
                        usuarioId
                    ]
                );

            }


            await client.query(
                "COMMIT"
            );


            return await buscarChamadaBasePorId(
                existente.id
            );

        }


        /*
            CRIAR NOVA CHAMADA
        */

        const resultado =
            await client.query(
                `
                    INSERT INTO chamadas (

                        data,

                        secao_id,

                        responsavel_usuario_id,

                        status,

                        data_hora_inicio

                    )

                    VALUES (

                        $1::date,

                        $2,

                        $3,

                        'EM_ANDAMENTO',

                        NOW()

                    )

                    RETURNING id
                `,
                [
                    dataResolvida,
                    secao.id,
                    usuarioId
                ]
            );


        const chamadaId =
            resultado.rows[0].id;


        await client.query(
            "COMMIT"
        );


        return await buscarChamadaBasePorId(
            chamadaId
        );


    } catch (erro) {

        await client.query(
            "ROLLBACK"
        );


        /*
            CONCORRÊNCIA:
            DUAS TENTATIVAS AO MESMO TEMPO.
        */

        if (
            erro.code === "23505"
        ) {

            throw criarErro(
                409,
                "Já existe uma chamada para esta seção nesta data."
            );

        }


        throw erro;


    } finally {

        client.release();

    }

}


/* =========================================================
   SALVAR REGISTROS DA CHAMADA
========================================================= */

async function salvar({
    usuario,
    chamadaId,
    militares
}) {

    if (
        !Array.isArray(militares) ||
        militares.length === 0
    ) {

        throw criarErro(
            400,
            "Informe os militares da chamada."
        );

    }


    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const chamada =
            await buscarChamadaBasePorId(
                chamadaId,
                client
            );


        validarAcessoChamada(
            usuario,
            chamada
        );


        if (
            chamada.status ===
            "REALIZADA"
        ) {

            throw criarErro(
                409,
                "Esta chamada já foi finalizada."
            );

        }


        const militaresDuplicados =
            militares
                .map(
                    item =>
                        String(
                            item.militarId
                        )
                )
                .filter(
                    (id, indice, lista) =>
                        lista.indexOf(id) !==
                        indice
                );


        if (
            militaresDuplicados.length > 0
        ) {

            throw criarErro(
                400,
                "Existem militares duplicados na chamada."
            );

        }


        /*
            VALIDAR MILITARES DA SEÇÃO
        */

        const militarIds =
            militares.map(
                item =>
                    String(
                        item.militarId
                    )
            );


        const resultadoMilitares =
            await client.query(
                `
                    SELECT
                        id

                    FROM militares

                    WHERE
                        id = ANY(
                            $1::bigint[]
                        )

                        AND secao_id = $2

                        AND ativo = TRUE
                `,
                [
                    militarIds,
                    chamada.secao.id
                ]
            );


        const militaresValidos =
            new Set(
                resultadoMilitares.rows.map(
                    linha =>
                        String(linha.id)
                )
            );


        for (
            const item
            of militares
        ) {

            if (
                !militaresValidos.has(
                    String(
                        item.militarId
                    )
                )
            ) {

                throw criarErro(
                    400,
                    "Um dos militares não pertence à seção ou está inativo."
                );

            }

        }


        /*
            VALIDAR SITUAÇÕES

            O BACKEND DECIDE SE É PRESENTE OU NÃO.
        */

        const situacaoIds =
            [
                ...new Set(
                    militares.map(
                        item =>
                            String(
                                item.situacaoId
                            )
                    )
                )
            ];


        const resultadoSituacoes =
            await client.query(
                `
                    SELECT
                        id,
                        codigo,
                        disponivel

                    FROM situacoes

                    WHERE
                        id = ANY(
                            $1::bigint[]
                        )

                        AND ativa = TRUE
                `,
                [
                    situacaoIds
                ]
            );


        const mapaSituacoes =
            new Map();


        for (
            const situacao
            of resultadoSituacoes.rows
        ) {

            mapaSituacoes.set(

                String(
                    situacao.id
                ),

                {

                    codigo:
                        situacao.codigo,

                    disponivel:
                        Boolean(
                            situacao.disponivel
                        )

                }

            );

        }


        /*
            INSERT / UPDATE DE CADA MILITAR
        */

        for (
            const item
            of militares
        ) {

            const situacao =
                mapaSituacoes.get(
                    String(
                        item.situacaoId
                    )
                );


            if (!situacao) {

                throw criarErro(
                    400,
                    "Uma das situações informadas é inválida."
                );

            }


            /*
                IMPORTANTE:

                PRESENTE NÃO VEM DO FRONTEND.

                É CALCULADO PELO BANCO:

                PRESENTE / ESTÁGIO
                → disponivel = true

                demais
                → disponivel = false
            */

            const presente =
                situacao.disponivel;


            const observacao =
                String(
                    item.observacao ??
                    ""
                )
                    .trim();


            await client.query(
                `
                    INSERT INTO chamada_militares (

                        chamada_id,

                        militar_id,

                        situacao_id,

                        presente,

                        observacao

                    )

                    VALUES (

                        $1,

                        $2,

                        $3,

                        $4,

                        NULLIF(
                            $5,
                            ''
                        )

                    )

                    ON CONFLICT (
                        chamada_id,
                        militar_id
                    )

                    DO UPDATE SET

                        situacao_id =
                            EXCLUDED.situacao_id,

                        presente =
                            EXCLUDED.presente,

                        observacao =
                            EXCLUDED.observacao,

                        registrado_em =
                            NOW()
                `,
                [
                    chamada.id,
                    item.militarId,
                    item.situacaoId,
                    presente,
                    observacao
                ]
            );

        }


        await client.query(
            `
                UPDATE chamadas

                SET

                    status =
                        'EM_ANDAMENTO',

                    data_hora_inicio =
                        COALESCE(
                            data_hora_inicio,
                            NOW()
                        ),

                    updated_at =
                        NOW()

                WHERE id = $1
            `,
            [
                chamada.id
            ]
        );


        await client.query(
            "COMMIT"
        );


        return {

            mensagem:
                "Chamada salva com sucesso.",

            chamada:
                await buscarChamadaBasePorId(
                    chamada.id
                ),

            registros:
                await buscarRegistrosChamada(
                    chamada.id
                )

        };


    } catch (erro) {

        await client.query(
            "ROLLBACK"
        );

        throw erro;


    } finally {

        client.release();

    }

}


/* =========================================================
   FINALIZAR CHAMADA
========================================================= */

async function finalizar({
    usuario,
    chamadaId
}) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const chamada =
            await buscarChamadaBasePorId(
                chamadaId,
                client
            );


        validarAcessoChamada(
            usuario,
            chamada
        );


        if (
            chamada.status ===
            "REALIZADA"
        ) {

            throw criarErro(
                409,
                "Esta chamada já foi realizada."
            );

        }


        /*
            DESCOBRIR MILITARES ATIVOS
            QUE AINDA NÃO POSSUEM SITUAÇÃO.
        */

        const faltantes =
            await client.query(
                `
                    SELECT

                        m.id,

                        m.nome_guerra

                    FROM militares m

                    LEFT JOIN chamada_militares cm

                        ON cm.militar_id =
                           m.id

                        AND cm.chamada_id =
                            $1

                    WHERE

                        m.secao_id =
                            $2

                        AND m.ativo =
                            TRUE

                        AND cm.id
                            IS NULL

                    ORDER BY
                        m.nome_guerra ASC
                `,
                [
                    chamada.id,
                    chamada.secao.id
                ]
            );


        if (
            faltantes.rows.length > 0
        ) {

            throw criarErro(
                400,

                `Existem ${faltantes.rows.length} militar(es) sem situação registrada.`,

                faltantes.rows.map(
                    militar => ({

                        id:
                            String(
                                militar.id
                            ),

                        nomeGuerra:
                            militar.nome_guerra

                    })
                )
            );

        }


        await client.query(
            `
                UPDATE chamadas

                SET

                    status =
                        'REALIZADA',

                    data_hora_inicio =
                        COALESCE(
                            data_hora_inicio,
                            NOW()
                        ),

                    data_hora_conclusao =
                        NOW(),

                    updated_at =
                        NOW()

                WHERE id = $1
            `,
            [
                chamada.id
            ]
        );


        await client.query(
            "COMMIT"
        );


        return {

            mensagem:
                "Chamada realizada com sucesso.",

            chamada:
                await buscarChamadaBasePorId(
                    chamada.id
                ),

            registros:
                await buscarRegistrosChamada(
                    chamada.id
                )

        };


    } catch (erro) {

        await client.query(
            "ROLLBACK"
        );

        throw erro;


    } finally {

        client.release();

    }

}


/* =========================================================
   BUSCAR POR ID
========================================================= */

async function buscarPorId({
    usuario,
    chamadaId
}) {

    const chamada =
        await buscarChamadaBasePorId(
            chamadaId
        );


    validarAcessoChamada(
        usuario,
        chamada
    );


    const registros =
        await buscarRegistrosChamada(
            chamada.id
        );


    return {

        chamada,

        registros

    };

}

/* =========================================================
   OPÇÕES DA CHAMADA
========================================================= */

async function buscarOpcoes({
    usuario
}) {

    let secoes;


    if (
        podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        const resultado =
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


        secoes =
            resultado.rows.map(
                secao => ({

                    id:
                        String(secao.id),

                    sigla:
                        secao.sigla,

                    nome:
                        secao.nome

                })
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


        const resultado =
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


        secoes =
            resultado.rows.map(
                secao => ({

                    id:
                        String(secao.id),

                    sigla:
                        secao.sigla,

                    nome:
                        secao.nome

                })
            );

    }


    const situacoes =
        await buscarSituacoes();


    return {

        secoes,

        situacoes

    };

}

/* =========================================================
   EXPORTS
========================================================= */

export {

    buscarOpcoes,

    buscarContexto,

    iniciar,

    salvar,

    finalizar,

    buscarPorId

};