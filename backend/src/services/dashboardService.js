import { pool } from "../config/database.js";


/* =========================================================
   DATA OPERACIONAL

   Evita mudança de dia por UTC no servidor.
========================================================= */

const DATA_HOJE_SQL = `
    (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
`;


/* =========================================================
   PERMISSÕES / ESCOPO
========================================================= */

function possuiPermissao(
    usuario,
    codigo
) {

    const permissoes =
        Array.isArray(
            usuario?.permissoes
        )
            ? usuario.permissoes
            : [];


    return permissoes.some(
        permissao => {

            if (
                typeof permissao ===
                "string"
            ) {

                return permissao === codigo;

            }


            return (
                permissao?.codigo ===
                codigo
            );

        }
    );

}


function obterSecaoIdUsuario(
    usuario
) {

    return (
        usuario?.secao?.id ??
        usuario?.secaoId ??
        usuario?.secao_id ??
        null
    );

}


function obterEscopo(
    usuario
) {

    const visualizarTodas =
        possuiPermissao(
            usuario,
            "SECOES_VISUALIZAR_TODAS"
        );


    if (
        visualizarTodas
    ) {

        return {

            sql:
                "",

            parametros:
                []

        };

    }


    const secaoId =
        obterSecaoIdUsuario(
            usuario
        );


    if (!secaoId) {

        const erro =
            new Error(
                "O usuário não possui seção vinculada."
            );


        erro.status =
            403;


        throw erro;

    }


    return {

        sql:
            "AND s.id = $1",

        parametros:
            [
                secaoId
            ]

    };

}


/* =========================================================
   DASHBOARD
========================================================= */

async function buscarDashboard({
    usuario
}) {

    if (!usuario) {

        const erro =
            new Error(
                "Usuário não autenticado."
            );


        erro.status =
            401;


        throw erro;

    }


    const escopo =
        obterEscopo(
            usuario
        );


    /* =====================================================
       EFETIVO POR SEÇÃO
    ===================================================== */

    const consultaEfetivo =
        pool.query(
            `
                SELECT
                    s.id,
                    s.sigla,
                    s.nome,

                    COUNT(
                        m.id
                    )::int AS total

                FROM secoes s

                LEFT JOIN militares m
                    ON m.secao_id = s.id
                    AND m.ativo = TRUE

                WHERE
                    s.ativa = TRUE

                    ${escopo.sql}

                GROUP BY
                    s.id,
                    s.sigla,
                    s.nome

                ORDER BY
                    s.sigla ASC
            `,
            escopo.parametros
        );


    /* =====================================================
       DISPONÍVEIS / INDISPONÍVEIS HOJE
    ===================================================== */

    const consultaDisponibilidade =
        pool.query(
            `
                SELECT

                    COUNT(*) FILTER (
                        WHERE sit.disponivel = TRUE
                    )::int
                        AS disponiveis,

                    COUNT(*) FILTER (
                        WHERE sit.disponivel = FALSE
                    )::int
                        AS indisponiveis

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id = cm.chamada_id

                INNER JOIN secoes s
                    ON s.id = c.secao_id

                INNER JOIN situacoes sit
                    ON sit.id = cm.situacao_id

                WHERE
                    c.data = ${DATA_HOJE_SQL}

                    ${escopo.sql}
            `,
            escopo.parametros
        );


    /* =====================================================
       SITUAÇÕES DO DIA
    ===================================================== */

    const consultaSituacoes =
        pool.query(
            `
                SELECT
                    sit.id,
                    sit.codigo,
                    sit.nome,
                    sit.disponivel,
                    sit.ordem,

                    COUNT(*)::int
                        AS total

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id = cm.chamada_id

                INNER JOIN secoes s
                    ON s.id = c.secao_id

                INNER JOIN situacoes sit
                    ON sit.id = cm.situacao_id

                WHERE
                    c.data = ${DATA_HOJE_SQL}

                    ${escopo.sql}

                GROUP BY
                    sit.id,
                    sit.codigo,
                    sit.nome,
                    sit.disponivel,
                    sit.ordem

                ORDER BY
                    sit.ordem ASC
            `,
            escopo.parametros
        );


    /* =====================================================
       STATUS DAS SEÇÕES

       Sem chamada = PENDENTE
       EM_ANDAMENTO = ainda pendente de conclusão
       REALIZADA = concluída
    ===================================================== */

    const consultaChamadas =
        pool.query(
            `
                SELECT
                    c.id,

                    COALESCE(
                        c.data,
                        ${DATA_HOJE_SQL}
                    ) AS data,

                    c.data_hora_inicio,
                    c.data_hora_conclusao,

                    COALESCE(
                        c.status,
                        'PENDENTE'
                    ) AS status,

                    s.id
                        AS secao_id,

                    s.sigla
                        AS secao_sigla,

                    s.nome
                        AS secao_nome,

                    u.id
                        AS responsavel_id,

                    u.nome
                        AS responsavel_nome,

                    u.nome_guerra
                        AS responsavel_nome_guerra,

                    u.login
                        AS responsavel_login

                FROM secoes s

                LEFT JOIN chamadas c
                    ON c.secao_id = s.id
                    AND c.data = ${DATA_HOJE_SQL}

                LEFT JOIN usuarios u
                    ON u.id =
                        c.responsavel_usuario_id

                WHERE
                    s.ativa = TRUE

                    ${escopo.sql}

                ORDER BY
                    s.sigla ASC
            `,
            escopo.parametros
        );


    /* =====================================================
       MILITARES DISPONÍVEIS HOJE
    ===================================================== */

    const consultaMilitaresDisponiveis =
        pool.query(
            `
                SELECT
                    m.id,

                    m.nome_completo,
                    m.nome_guerra,
                    m.saram,

                    pg.id
                        AS posto_id,

                    pg.sigla
                        AS posto_sigla,

                    pg.nome
                        AS posto_nome,

                    pg.ordem
                        AS posto_ordem,

                    s.id
                        AS secao_id,

                    s.sigla
                        AS secao_sigla,

                    s.nome
                        AS secao_nome,

                    sit.id
                        AS situacao_id,

                    sit.codigo
                        AS situacao_codigo,

                    sit.nome
                        AS situacao_nome,

                    sit.disponivel
                        AS situacao_disponivel

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id = cm.chamada_id

                INNER JOIN militares m
                    ON m.id = cm.militar_id

                INNER JOIN postos_graduacoes pg
                    ON pg.id =
                        m.posto_graduacao_id

                INNER JOIN secoes s
                    ON s.id = c.secao_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                WHERE
                    c.data = ${DATA_HOJE_SQL}

                    AND sit.disponivel = TRUE

                    ${escopo.sql}

                ORDER BY
                    pg.ordem ASC,
                    m.nome_guerra ASC
            `,
            escopo.parametros
        );


    const [
        efetivoResultado,
        disponibilidadeResultado,
        situacoesResultado,
        chamadasResultado,
        militaresResultado
    ] =
        await Promise.all([

            consultaEfetivo,

            consultaDisponibilidade,

            consultaSituacoes,

            consultaChamadas,

            consultaMilitaresDisponiveis

        ]);


    /* =====================================================
       EFETIVO
    ===================================================== */

    const efetivoPorSecao =
        efetivoResultado.rows.map(
            item => ({

                id:
                    item.id,

                sigla:
                    item.sigla,

                nome:
                    item.nome,

                total:
                    Number(
                        item.total
                    )

            })
        );


    const efetivoTotal =
        efetivoPorSecao.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.total
                ),
            0
        );


    /* =====================================================
       DISPONIBILIDADE
    ===================================================== */

    const disponibilidade =
        disponibilidadeResultado
            .rows[0] || {};


    const disponiveisHoje =
        Number(
            disponibilidade
                .disponiveis ||
            0
        );


    const indisponiveisHoje =
        Number(
            disponibilidade
                .indisponiveis ||
            0
        );


    /* =====================================================
       SITUAÇÕES
    ===================================================== */

    const situacoes =
        situacoesResultado.rows.map(
            item => ({

                id:
                    item.id,

                codigo:
                    item.codigo,

                nome:
                    item.nome,

                disponivel:
                    item.disponivel,

                ordem:
                    item.ordem,

                total:
                    Number(
                        item.total
                    )

            })
        );


    /* =====================================================
       CHAMADAS
    ===================================================== */

    const chamadas =
        chamadasResultado.rows.map(
            item => ({

                id:
                    item.id,

                data:
                    item.data,

                dataHora:
                    item.data_hora_conclusao ??
                    item.data_hora_inicio ??
                    null,

                status:
                    item.status,

                secao: {

                    id:
                        item.secao_id,

                    sigla:
                        item.secao_sigla,

                    nome:
                        item.secao_nome

                },

                responsavel:
                    item.responsavel_id

                        ? {

                            id:
                                item.responsavel_id,

                            nome:
                                item.responsavel_nome,

                            nomeGuerra:
                                item
                                    .responsavel_nome_guerra,

                            login:
                                item.responsavel_login

                        }

                        : null

            })
        );


    const secoesConcluidas =
        chamadas.filter(
            chamada =>
                chamada.status ===
                "REALIZADA"
        ).length;


    const secoesPendentes =
        chamadas.length -
        secoesConcluidas;


    /* =====================================================
       MILITARES DISPONÍVEIS
    ===================================================== */

    const militaresDisponiveis =
        militaresResultado.rows.map(
            item => ({

                id:
                    item.id,

                nomeCompleto:
                    item.nome_completo,

                nomeGuerra:
                    item.nome_guerra,

                saram:
                    item.saram,

                postoGraduacao: {

                    id:
                        item.posto_id,

                    sigla:
                        item.posto_sigla,

                    nome:
                        item.posto_nome,

                    ordem:
                        item.posto_ordem

                },

                secao: {

                    id:
                        item.secao_id,

                    sigla:
                        item.secao_sigla,

                    nome:
                        item.secao_nome

                },

                situacao: {

                    id:
                        item.situacao_id,

                    codigo:
                        item.situacao_codigo,

                    nome:
                        item.situacao_nome,

                    disponivel:
                        item
                            .situacao_disponivel

                }

            })
        );


    /* =====================================================
       RESPOSTA
    ===================================================== */

    return {

        usuario,

        resumo: {

            efetivoTotal,

            disponiveisHoje,

            indisponiveisHoje,

            secoesPendentes,

            secoesConcluidas

        },

        efetivoPorSecao,

        situacoes,

        chamadas,

        militaresDisponiveis

    };

}


export {
    buscarDashboard
};