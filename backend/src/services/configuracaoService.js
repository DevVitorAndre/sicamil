import bcrypt from "bcrypt";

import { pool } from "../config/database.js";


/* =========================================================
   BUSCAR MINHA CONTA
========================================================= */

async function buscarMinhaConta(
    usuarioId
) {

    const resultado =
        await pool.query(
            `
                SELECT

                    u.id,
                    u.nome,
                    u.nome_guerra,
                    u.login,
                    u.email,
                    u.tipo,
                    u.ativo,
                    u.ultimo_login,

                    s.id
                        AS secao_id,

                    s.nome
                        AS secao_nome,

                    s.sigla
                        AS secao_sigla

                FROM usuarios u

                LEFT JOIN secoes s
                    ON s.id = u.secao_id

                WHERE
                    u.id = $1

                LIMIT 1
            `,
            [
                usuarioId
            ]
        );


    const usuario =
        resultado.rows[0];


    if (!usuario) {

        const erro =
            new Error(
                "Usuário não encontrado."
            );


        erro.status =
            404;


        throw erro;

    }


    return {

        id:
            usuario.id,

        nome:
            usuario.nome,

        nomeGuerra:
            usuario.nome_guerra,

        login:
            usuario.login,

        email:
            usuario.email,

        tipo:
            usuario.tipo,

        ativo:
            usuario.ativo,

        ultimoLogin:
            usuario.ultimo_login,

        secao:
            usuario.secao_id

                ? {

                    id:
                        usuario.secao_id,

                    nome:
                        usuario.secao_nome,

                    sigla:
                        usuario.secao_sigla

                }

                : null

    };

}


/* =========================================================
   ALTERAR SENHA
========================================================= */

async function alterarSenha(
    usuarioId,
    {
        senhaAtual,
        novaSenha
    }
) {

    if (
        !senhaAtual ||
        !novaSenha
    ) {

        const erro =
            new Error(
                "Informe a senha atual e a nova senha."
            );


        erro.status =
            400;


        throw erro;

    }


    if (
        novaSenha.length < 8
    ) {

        const erro =
            new Error(
                "A nova senha deve possuir pelo menos 8 caracteres."
            );


        erro.status =
            400;


        throw erro;

    }


    if (
        senhaAtual === novaSenha
    ) {

        const erro =
            new Error(
                "A nova senha deve ser diferente da senha atual."
            );


        erro.status =
            400;


        throw erro;

    }


    const resultado =
        await pool.query(
            `
                SELECT
                    id,
                    senha_hash,
                    ativo

                FROM usuarios

                WHERE
                    id = $1

                LIMIT 1
            `,
            [
                usuarioId
            ]
        );


    const usuario =
        resultado.rows[0];


    if (
        !usuario ||
        !usuario.ativo
    ) {

        const erro =
            new Error(
                "Usuário não encontrado ou inativo."
            );


        erro.status =
            403;


        throw erro;

    }


    const senhaAtualCorreta =
        await bcrypt.compare(
            senhaAtual,
            usuario.senha_hash
        );


    if (
        !senhaAtualCorreta
    ) {

        const erro =
            new Error(
                "A senha atual está incorreta."
            );


        erro.status =
            400;


        throw erro;

    }


    const novaSenhaHash =
        await bcrypt.hash(
            novaSenha,
            12
        );


    await pool.query(
        `
            UPDATE usuarios

            SET
                senha_hash = $1,
                updated_at = NOW()

            WHERE
                id = $2
        `,
        [
            novaSenhaHash,
            usuarioId
        ]
    );


    return {

        mensagem:
            "Senha alterada com sucesso."

    };

}


export {
    buscarMinhaConta,
    alterarSenha
};