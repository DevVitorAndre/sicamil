import {
    pool
} from "../config/database.js";


/* =========================================================
   LISTAR SEÇÕES
========================================================= */

export async function listarSecoes() {

    const resultado =
        await pool.query(
            `
            SELECT
                id,
                nome,
                sigla,
                ativa,
                created_at,
                updated_at

            FROM secoes

            ORDER BY
                ativa DESC,
                LOWER(sigla),
                LOWER(nome)
            `
        );


    return resultado.rows;

}


/* =========================================================
   BUSCAR SEÇÃO POR ID
========================================================= */

export async function buscarSecaoPorId(
    id
) {

    const resultado =
        await pool.query(
            `
            SELECT
                id,
                nome,
                sigla,
                ativa,
                created_at,
                updated_at

            FROM secoes

            WHERE id = $1

            LIMIT 1
            `,
            [
                id
            ]
        );


    return (
        resultado.rows[0] ||
        null
    );

}


/* =========================================================
   CRIAR SEÇÃO
========================================================= */

export async function criarSecao(
    dados
) {

    const nome =
        dados.nome.trim();

    const sigla =
        dados.sigla
            .trim()
            .toUpperCase();


    try {

        const resultado =
            await pool.query(
                `
                INSERT INTO secoes (
                    nome,
                    sigla
                )

                VALUES (
                    $1,
                    $2
                )

                RETURNING
                    id,
                    nome,
                    sigla,
                    ativa,
                    created_at,
                    updated_at
                `,
                [
                    nome,
                    sigla
                ]
            );


        return resultado.rows[0];


    } catch (erro) {

        if (
            erro.code === "23505"
        ) {

            const conflito =
                new Error(
                    "Já existe uma seção cadastrada com essa sigla."
                );


            conflito.status =
                409;


            throw conflito;

        }


        throw erro;

    }

}


/* =========================================================
   ATUALIZAR SEÇÃO
========================================================= */

export async function atualizarSecao(
    id,
    dados
) {

    const nome =
        dados.nome.trim();

    const sigla =
        dados.sigla
            .trim()
            .toUpperCase();


    try {

        const resultado =
            await pool.query(
                `
                UPDATE secoes

                SET
                    nome = $1,
                    sigla = $2

                WHERE id = $3

                RETURNING
                    id,
                    nome,
                    sigla,
                    ativa,
                    created_at,
                    updated_at
                `,
                [
                    nome,
                    sigla,
                    id
                ]
            );


        return (
            resultado.rows[0] ||
            null
        );


    } catch (erro) {

        if (
            erro.code === "23505"
        ) {

            const conflito =
                new Error(
                    "Já existe uma seção cadastrada com essa sigla."
                );


            conflito.status =
                409;


            throw conflito;

        }


        throw erro;

    }

}


/* =========================================================
   ALTERAR STATUS
========================================================= */

export async function alterarStatusSecao(
    id,
    ativa
) {

    const resultado =
        await pool.query(
            `
            UPDATE secoes

            SET
                ativa = $1

            WHERE id = $2

            RETURNING
                id,
                nome,
                sigla,
                ativa,
                created_at,
                updated_at
            `,
            [
                ativa,
                id
            ]
        );


    return (
        resultado.rows[0] ||
        null
    );

}