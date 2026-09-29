import bcrypt from "bcrypt";

import { pool } from "../config/database.js";


/* =========================================================
   BUSCAR USUÁRIO PELO LOGIN
========================================================= */

async function buscarUsuarioPorLogin(
    login
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
                u.senha_hash,
                u.tipo,
                u.ativo,
                u.militar_id,

                s.id
                    AS secao_id,

                s.nome
                    AS secao_nome,

                s.sigla
                    AS secao_sigla,

                s.ativa
                    AS secao_ativa,


                m.id
                    AS militar_id_real,

                m.nome_completo
                    AS militar_nome_completo,

                m.nome_guerra
                    AS militar_nome_guerra,

                m.saram
                    AS militar_saram,


                pg.id
                    AS posto_graduacao_id,

                pg.sigla
                    AS posto_graduacao_sigla,

                pg.nome
                    AS posto_graduacao_nome,

                pg.ordem
                    AS posto_graduacao_ordem,


                COALESCE(
                    ARRAY_AGG(
                        p.codigo
                        ORDER BY p.codigo
                    )
                    FILTER (
                        WHERE p.id IS NOT NULL
                    ),
                    '{}'
                ) AS permissoes


            FROM usuarios u


            LEFT JOIN secoes s
                ON s.id = u.secao_id


            LEFT JOIN militares m
                ON m.id = u.militar_id


            LEFT JOIN postos_graduacoes pg
                ON pg.id = m.posto_graduacao_id


            LEFT JOIN usuario_permissoes up
                ON up.usuario_id = u.id


            LEFT JOIN permissoes p
                ON p.id = up.permissao_id


            WHERE
                LOWER(u.login) =
                LOWER($1)


            GROUP BY
                u.id,
                s.id,
                m.id,
                pg.id


            LIMIT 1
            `,
            [
                login
            ]
        );


    return (
        resultado.rows[0] ||
        null
    );

}


/* =========================================================
   BUSCAR USUÁRIO PELO ID
========================================================= */

export async function buscarUsuarioPorId(
    id
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
                u.militar_id,

                s.id
                    AS secao_id,

                s.nome
                    AS secao_nome,

                s.sigla
                    AS secao_sigla,

                s.ativa
                    AS secao_ativa,


                m.id
                    AS militar_id_real,

                m.nome_completo
                    AS militar_nome_completo,

                m.nome_guerra
                    AS militar_nome_guerra,

                m.saram
                    AS militar_saram,


                pg.id
                    AS posto_graduacao_id,

                pg.sigla
                    AS posto_graduacao_sigla,

                pg.nome
                    AS posto_graduacao_nome,

                pg.ordem
                    AS posto_graduacao_ordem,


                COALESCE(
                    ARRAY_AGG(
                        p.codigo
                        ORDER BY p.codigo
                    )
                    FILTER (
                        WHERE p.id IS NOT NULL
                    ),
                    '{}'
                ) AS permissoes


            FROM usuarios u


            LEFT JOIN secoes s
                ON s.id = u.secao_id


            LEFT JOIN militares m
                ON m.id = u.militar_id


            LEFT JOIN postos_graduacoes pg
                ON pg.id = m.posto_graduacao_id


            LEFT JOIN usuario_permissoes up
                ON up.usuario_id = u.id


            LEFT JOIN permissoes p
                ON p.id = up.permissao_id


            WHERE
                u.id = $1


            GROUP BY
                u.id,
                s.id,
                m.id,
                pg.id


            LIMIT 1
            `,
            [
                id
            ]
        );


    const usuario =
        resultado.rows[0];


    if (!usuario) {

        return null;

    }


    return formatarUsuario(
        usuario
    );

}


/* =========================================================
   AUTENTICAR
========================================================= */

export async function autenticarUsuario(
    login,
    senha
) {

    const usuario =
        await buscarUsuarioPorLogin(
            login
        );


    if (
        !usuario ||
        !usuario.ativo
    ) {

        return null;

    }


    const senhaCorreta =
        await bcrypt.compare(
            senha,
            usuario.senha_hash
        );


    if (!senhaCorreta) {

        return null;

    }


    await pool.query(
        `
        UPDATE usuarios

        SET
            ultimo_login = NOW()

        WHERE
            id = $1
        `,
        [
            usuario.id
        ]
    );


    return formatarUsuario(
        usuario
    );

}


/* =========================================================
   FORMATAR USUÁRIO PARA O FRONTEND

   senha_hash nunca sai daqui.
========================================================= */

function formatarUsuario(
    usuario
) {

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


        secao:
            usuario.secao_id
                ? {

                    id:
                        usuario.secao_id,

                    nome:
                        usuario.secao_nome,

                    sigla:
                        usuario.secao_sigla,

                    ativa:
                        usuario.secao_ativa

                }
                : null,


        militar:
            usuario.militar_id_real
                ? {

                    id:
                        usuario.militar_id_real,

                    nomeCompleto:
                        usuario.militar_nome_completo,

                    nomeGuerra:
                        usuario.militar_nome_guerra,

                    saram:
                        usuario.militar_saram

                }
                : null,


        postoGraduacao:
            usuario.posto_graduacao_id
                ? {

                    id:
                        usuario.posto_graduacao_id,

                    sigla:
                        usuario.posto_graduacao_sigla,

                    nome:
                        usuario.posto_graduacao_nome,

                    ordem:
                        usuario.posto_graduacao_ordem

                }
                : null,


        permissoes:
            usuario.permissoes ||
            []

    };

}