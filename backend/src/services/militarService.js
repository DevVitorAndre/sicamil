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
   PERMISSÕES / SEÇÃO DO USUÁRIO
========================================================= */

function possuiPermissao(usuario, codigo) {

    if (!Array.isArray(usuario?.permissoes)) {
        return false;
    }

    return usuario.permissoes.some(permissao => {

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


function obterSecaoUsuario(usuario) {

    return (
        usuario?.secao?.id ??
        usuario?.secaoId ??
        usuario?.secao_id ??
        null
    );

}


function validarAcessoSecao(usuario, secaoId) {

    if (podeVisualizarTodasSecoes(usuario)) {
        return;
    }

    const secaoUsuario =
        Number(obterSecaoUsuario(usuario));

    if (
        !secaoUsuario ||
        secaoUsuario !== Number(secaoId)
    ) {

        throw criarErro(
            403,
            "Você não possui permissão para acessar militares desta seção."
        );

    }

}


/* =========================================================
   FORMATAR MILITAR
========================================================= */

function formatarMilitar(linha) {

    if (!linha) {
        return null;
    }

    return {

        id: linha.id,

        nomeCompleto:
            linha.nome_completo,

        nomeGuerra:
            linha.nome_guerra,

        saram:
            linha.saram,

        postoGraduacao: {

            id:
                linha.posto_graduacao_id,

            sigla:
                linha.posto_sigla,

            nome:
                linha.posto_nome,

            ordem:
                linha.posto_ordem

        },

        secao: {

            id:
                linha.secao_id,

            sigla:
                linha.secao_sigla,

            nome:
                linha.secao_nome

        },

        ativo:
            linha.ativo,

        createdAt:
            linha.created_at,

        updatedAt:
            linha.updated_at

    };

}


/* =========================================================
   SELECT BASE
========================================================= */

const SELECT_MILITAR = `

    SELECT

        m.id,
        m.posto_graduacao_id,
        m.nome_completo,
        m.nome_guerra,
        m.saram,
        m.secao_id,
        m.ativo,
        m.created_at,
        m.updated_at,

        pg.sigla AS posto_sigla,
        pg.nome AS posto_nome,
        pg.ordem AS posto_ordem,

        s.sigla AS secao_sigla,
        s.nome AS secao_nome

    FROM militares m

    INNER JOIN postos_graduacoes pg
        ON pg.id = m.posto_graduacao_id

    INNER JOIN secoes s
        ON s.id = m.secao_id

`;


/* =========================================================
   LISTAR MILITARES
========================================================= */

async function listarMilitares(
    usuario,
    filtros = {}
) {

    const parametros = [];

    const condicoes = [];

    const {
        secaoId = null,
        ativo = null
    } = filtros;


    /*
        USUÁRIO QUE NÃO PODE VER TODAS AS SEÇÕES
        FICA PRESO À PRÓPRIA SEÇÃO.
    */

    if (!podeVisualizarTodasSecoes(usuario)) {

        const secaoUsuario =
            obterSecaoUsuario(usuario);


        if (!secaoUsuario) {
            return [];
        }


        parametros.push(
            Number(secaoUsuario)
        );


        condicoes.push(
            `m.secao_id = $${parametros.length}`
        );

    }


    /*
        FILTRO POR SEÇÃO
    */

    if (
        secaoId !== null &&
        secaoId !== undefined &&
        secaoId !== ""
    ) {

        validarAcessoSecao(
            usuario,
            secaoId
        );


        parametros.push(
            Number(secaoId)
        );


        condicoes.push(
            `m.secao_id = $${parametros.length}`
        );

    }


    /*
        FILTRO POR STATUS
    */

    if (
        ativo !== null &&
        ativo !== undefined
    ) {

        parametros.push(
            Boolean(ativo)
        );


        condicoes.push(
            `m.ativo = $${parametros.length}`
        );

    }


    const where =
        condicoes.length > 0
            ? `WHERE ${condicoes.join(" AND ")}`
            : "";


    const resultado =
        await pool.query(

            `

            ${SELECT_MILITAR}

            ${where}

            ORDER BY
                pg.ordem ASC,
                m.nome_guerra ASC

            `,

            parametros

        );


    return resultado.rows.map(
        formatarMilitar
    );

}


/* =========================================================
   BUSCAR POR ID
========================================================= */

async function buscarMilitarPorId(
    id,
    usuario
) {

    const militarId =
        Number(id);


    if (!Number.isInteger(militarId)) {

        throw criarErro(
            400,
            "ID do militar inválido."
        );

    }


    const resultado =
        await pool.query(

            `

            ${SELECT_MILITAR}

            WHERE m.id = $1

            `,

            [militarId]

        );


    if (resultado.rowCount === 0) {
        return null;
    }


    const militar =
        formatarMilitar(
            resultado.rows[0]
        );


    validarAcessoSecao(
        usuario,
        militar.secao.id
    );


    return militar;

}


/* =========================================================
   OPÇÕES PARA CADASTRO
========================================================= */

async function listarOpcoes(usuario) {

    const postosPromise =
        pool.query(`

            SELECT
                id,
                sigla,
                nome,
                ordem

            FROM postos_graduacoes

            WHERE ativo = TRUE

            ORDER BY ordem ASC

        `);


    let secoesPromise;


    if (podeVisualizarTodasSecoes(usuario)) {

        secoesPromise =
            pool.query(`

                SELECT
                    id,
                    sigla,
                    nome

                FROM secoes

                WHERE ativa = TRUE

                ORDER BY sigla ASC

            `);

    } else {

        const secaoUsuario =
            obterSecaoUsuario(usuario);


        if (!secaoUsuario) {

            secoesPromise =
                Promise.resolve({
                    rows: []
                });

        } else {

            secoesPromise =
                pool.query(

                    `

                    SELECT
                        id,
                        sigla,
                        nome

                    FROM secoes

                    WHERE
                        id = $1
                        AND ativa = TRUE

                    `,

                    [
                        Number(secaoUsuario)
                    ]

                );

        }

    }


    const [
        postos,
        secoes
    ] = await Promise.all([

        postosPromise,
        secoesPromise

    ]);


    return {

        postosGraduacoes:
            postos.rows,

        secoes:
            secoes.rows

    };

}


/* =========================================================
   VALIDAR PT/GRAD E SEÇÃO
========================================================= */

async function validarReferencias({

    postoGraduacaoId,
    secaoId,
    usuario

}) {

    const postoId =
        Number(postoGraduacaoId);

    const secao =
        Number(secaoId);


    if (!Number.isInteger(postoId)) {

        throw criarErro(
            400,
            "PT/GRAD inválido."
        );

    }


    if (!Number.isInteger(secao)) {

        throw criarErro(
            400,
            "Seção inválida."
        );

    }


    validarAcessoSecao(
        usuario,
        secao
    );


    const [
        postoResultado,
        secaoResultado
    ] = await Promise.all([

        pool.query(

            `

            SELECT id

            FROM postos_graduacoes

            WHERE
                id = $1
                AND ativo = TRUE

            `,

            [postoId]

        ),

        pool.query(

            `

            SELECT id

            FROM secoes

            WHERE
                id = $1
                AND ativa = TRUE

            `,

            [secao]

        )

    ]);


    if (postoResultado.rowCount === 0) {

        throw criarErro(
            400,
            "O PT/GRAD informado não existe ou está inativo."
        );

    }


    if (secaoResultado.rowCount === 0) {

        throw criarErro(
            400,
            "A seção informada não existe ou está inativa."
        );

    }

}


/* =========================================================
   VALIDAR DADOS DO MILITAR
========================================================= */

function validarDadosMilitar(dados) {

    const nomeCompleto =
        String(
            dados.nomeCompleto ?? ""
        )
            .trim()
            .toUpperCase();


    const nomeGuerra =
        String(
            dados.nomeGuerra ?? ""
        )
            .trim()
            .toUpperCase();


    const saram =
        String(
            dados.saram ?? ""
        )
            .trim();


    if (!nomeCompleto) {

        throw criarErro(
            400,
            "Informe o Nome Completo."
        );

    }


    if (!nomeGuerra) {

        throw criarErro(
            400,
            "Informe o Nome de Guerra."
        );

    }


    if (!saram) {

        throw criarErro(
            400,
            "Informe o SARAM."
        );

    }


    /*
        O SARAM É ARMAZENADO COMO TEXTO,
        MAS DEVE POSSUIR SOMENTE NÚMEROS.
    */

    if (!/^\d+$/.test(saram)) {

        throw criarErro(
            400,
            "O SARAM deve conter somente números."
        );

    }


    if (nomeCompleto.length > 150) {

        throw criarErro(
            400,
            "O Nome Completo deve possuir no máximo 150 caracteres."
        );

    }


    if (nomeGuerra.length > 100) {

        throw criarErro(
            400,
            "O Nome de Guerra deve possuir no máximo 100 caracteres."
        );

    }


    if (saram.length > 20) {

        throw criarErro(
            400,
            "O SARAM deve possuir no máximo 20 caracteres."
        );

    }


    return {

        nomeCompleto,
        nomeGuerra,
        saram

    };

}


/* =========================================================
   VALIDAR SARAM ÚNICO
========================================================= */

async function validarSaramUnico(
    saram,
    ignorarId = null
) {

    const parametros = [
        saram
    ];


    let sql = `

        SELECT id

        FROM militares

        WHERE saram = $1

    `;


    if (ignorarId !== null) {

        parametros.push(
            Number(ignorarId)
        );


        sql += `

            AND id <> $2

        `;

    }


    const resultado =
        await pool.query(
            sql,
            parametros
        );


    if (resultado.rowCount > 0) {

        throw criarErro(
            409,
            "Já existe um militar cadastrado com este SARAM."
        );

    }

}


/* =========================================================
   CRIAR MILITAR
========================================================= */

async function criarMilitar(
    dados,
    usuario
) {

    const {

        nomeCompleto,
        nomeGuerra,
        saram

    } = validarDadosMilitar(dados);


    await validarReferencias({

        postoGraduacaoId:
            dados.postoGraduacaoId,

        secaoId:
            dados.secaoId,

        usuario

    });


    await validarSaramUnico(
        saram
    );


    try {

        const resultado =
            await pool.query(

                `

                INSERT INTO militares (

                    posto_graduacao_id,
                    nome_completo,
                    nome_guerra,
                    saram,
                    secao_id,
                    ativo

                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    TRUE
                )

                RETURNING id

                `,

                [
                    Number(
                        dados.postoGraduacaoId
                    ),

                    nomeCompleto,

                    nomeGuerra,

                    saram,

                    Number(
                        dados.secaoId
                    )
                ]

            );


        return buscarMilitarPorId(
            resultado.rows[0].id,
            usuario
        );


    } catch (erro) {

        if (erro.code === "23505") {

            throw criarErro(
                409,
                "Já existe um militar cadastrado com este SARAM."
            );

        }


        throw erro;

    }

}


/* =========================================================
   EDITAR MILITAR
========================================================= */

async function atualizarMilitar(
    id,
    dados,
    usuario
) {

    const militarAtual =
        await buscarMilitarPorId(
            id,
            usuario
        );


    if (!militarAtual) {
        return null;
    }


    const {

        nomeCompleto,
        nomeGuerra,
        saram

    } = validarDadosMilitar(dados);


    await validarReferencias({

        postoGraduacaoId:
            dados.postoGraduacaoId,

        secaoId:
            dados.secaoId,

        usuario

    });


    await validarSaramUnico(
        saram,
        id
    );


    try {

        await pool.query(

            `

            UPDATE militares

            SET
                posto_graduacao_id = $1,
                nome_completo = $2,
                nome_guerra = $3,
                saram = $4,
                secao_id = $5,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $6

            `,

            [
                Number(
                    dados.postoGraduacaoId
                ),

                nomeCompleto,

                nomeGuerra,

                saram,

                Number(
                    dados.secaoId
                ),

                Number(id)
            ]

        );


        return buscarMilitarPorId(
            id,
            usuario
        );


    } catch (erro) {

        if (erro.code === "23505") {

            throw criarErro(
                409,
                "Já existe um militar cadastrado com este SARAM."
            );

        }


        throw erro;

    }

}


/* =========================================================
   ATIVAR / DESATIVAR
========================================================= */

async function alterarStatusMilitar(
    id,
    ativo,
    usuario
) {

    const militar =
        await buscarMilitarPorId(
            id,
            usuario
        );


    if (!militar) {
        return null;
    }


    await pool.query(

        `

        UPDATE militares

        SET
            ativo = $1,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        `,

        [
            Boolean(ativo),
            Number(id)
        ]

    );


    return buscarMilitarPorId(
        id,
        usuario
    );

}


/* =========================================================
   EXCLUIR MILITAR
========================================================= */

async function excluirMilitar(
    id,
    usuario
) {

    const militar =
        await buscarMilitarPorId(
            id,
            usuario
        );


    if (!militar) {
        return null;
    }


    /*
        VERIFICA SE O MILITAR JÁ POSSUI
        HISTÓRICO DE CHAMADAS.
    */

    const historico =
        await pool.query(

            `

            SELECT EXISTS (

                SELECT 1

                FROM chamada_militares

                WHERE militar_id = $1

            ) AS possui_historico

            `,

            [
                Number(id)
            ]

        );


    if (
        historico.rows[0]
            ?.possui_historico
    ) {

        throw criarErro(
            409,
            "Este militar possui histórico de chamadas e não pode ser excluído. Desative-o para preservar o histórico."
        );

    }


    try {

        const resultado =
            await pool.query(

                `

                DELETE FROM militares

                WHERE id = $1

                RETURNING id

                `,

                [
                    Number(id)
                ]

            );


        if (resultado.rowCount === 0) {
            return null;
        }


        return {

            id:
                resultado.rows[0].id

        };


    } catch (erro) {

        if (erro.code === "23503") {

            throw criarErro(
                409,
                "Este militar possui registros vinculados e não pode ser excluído. Desative-o para preservar o histórico."
            );

        }


        throw erro;

    }

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    listarMilitares,
    buscarMilitarPorId,
    listarOpcoes,
    criarMilitar,
    atualizarMilitar,
    alterarStatusMilitar,
    excluirMilitar

};

