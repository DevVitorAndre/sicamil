import bcrypt from "bcrypt";
import { pool } from "../config/database.js";


/* =========================================================
   FORMATAR USUÁRIO
========================================================= */

function formatarUsuario(usuario) {

    if (!usuario) {
        return null;
    }

    return {
        id: usuario.id,
        nome: usuario.nome,
        nomeGuerra: usuario.nome_guerra,
        login: usuario.login,
        email: usuario.email,
        tipo: usuario.tipo,
        ativo: usuario.ativo,
        ultimoLogin: usuario.ultimo_login,

        secao: usuario.secao_id
            ? {
                id: usuario.secao_id,
                nome: usuario.secao_nome,
                sigla: usuario.secao_sigla
            }
            : null,

        permissoes:
            usuario.permissoes || [],

        createdAt:
            usuario.created_at,

        updatedAt:
            usuario.updated_at
    };

}


/* =========================================================
   CONSULTA BASE
========================================================= */

const CONSULTA_USUARIO = `
    SELECT
        u.id,
        u.nome,
        u.nome_guerra,
        u.login,
        u.email,
        u.tipo,
        u.ativo,
        u.ultimo_login,
        u.created_at,
        u.updated_at,

        s.id AS secao_id,
        s.nome AS secao_nome,
        s.sigla AS secao_sigla,

        COALESCE(
            ARRAY(
                SELECT p.codigo
                FROM usuario_permissoes up
                INNER JOIN permissoes p
                    ON p.id = up.permissao_id
                WHERE up.usuario_id = u.id
                ORDER BY p.codigo
            ),
            ARRAY[]::VARCHAR[]
        ) AS permissoes

    FROM usuarios u

    LEFT JOIN secoes s
        ON s.id = u.secao_id
`;


/* =========================================================
   LISTAR USUÁRIOS
========================================================= */

export async function listarUsuarios() {

    const resultado =
        await pool.query(`
            ${CONSULTA_USUARIO}

            ORDER BY
                u.ativo DESC,
                LOWER(
                    COALESCE(
                        u.nome_guerra,
                        u.nome
                    )
                )
        `);


    return resultado.rows.map(
        formatarUsuario
    );

}


/* =========================================================
   BUSCAR POR ID
========================================================= */

export async function buscarUsuarioPorIdGerenciamento(id) {

    const resultado =
        await pool.query(
            `
            ${CONSULTA_USUARIO}

            WHERE u.id = $1

            LIMIT 1
            `,
            [id]
        );


    return formatarUsuario(
        resultado.rows[0]
    );

}


/* =========================================================
   OPÇÕES DO FORMULÁRIO
========================================================= */

export async function listarOpcoesUsuarios() {

    const [
        secoesResultado,
        permissoesResultado
    ] = await Promise.all([

        pool.query(`
            SELECT
                id,
                nome,
                sigla
            FROM secoes
            WHERE ativa = TRUE
            ORDER BY
                LOWER(sigla),
                LOWER(nome)
        `),

        pool.query(`
            SELECT
                id,
                codigo,
                nome,
                descricao
            FROM permissoes
            ORDER BY nome
        `)

    ]);


    return {
        secoes:
            secoesResultado.rows,

        permissoes:
            permissoesResultado.rows
    };

}


/* =========================================================
   VALIDAR SEÇÃO
========================================================= */

async function validarSecao(
    cliente,
    secaoId
) {

    if (!secaoId) {
        return;
    }


    const resultado =
        await cliente.query(
            `
            SELECT id
            FROM secoes
            WHERE
                id = $1
                AND ativa = TRUE
            LIMIT 1
            `,
            [secaoId]
        );


    if (resultado.rowCount === 0) {

        const erro =
            new Error(
                "A seção informada não existe ou está inativa."
            );

        erro.status = 400;

        throw erro;

    }

}


/* =========================================================
   NORMALIZAR PERMISSÕES
========================================================= */

function normalizarPermissoes(permissoes) {

    if (!Array.isArray(permissoes)) {
        return [];
    }


    return [
        ...new Set(
            permissoes
                .filter(Boolean)
                .map(
                    codigo =>
                        String(codigo)
                            .trim()
                            .toUpperCase()
                )
        )
    ];

}


/* =========================================================
   VALIDAR PERMISSÕES
========================================================= */

async function validarPermissoes(
    cliente,
    permissoes
) {

    const codigos =
        normalizarPermissoes(
            permissoes
        );


    if (codigos.length === 0) {
        return [];
    }


    const resultado =
        await cliente.query(
            `
            SELECT
                id,
                codigo
            FROM permissoes
            WHERE codigo = ANY($1::VARCHAR[])
            `,
            [codigos]
        );


    if (
        resultado.rows.length !==
        codigos.length
    ) {

        const encontrados =
            resultado.rows.map(
                item => item.codigo
            );


        const invalidos =
            codigos.filter(
                codigo =>
                    !encontrados.includes(
                        codigo
                    )
            );


        const erro =
            new Error(
                `Permissão inválida: ${invalidos.join(", ")}.`
            );

        erro.status = 400;

        throw erro;

    }


    return codigos;

}


/* =========================================================
   VERIFICAR LOGIN / E-MAIL
========================================================= */

async function verificarDuplicidade(
    cliente,
    login,
    email,
    ignorarUsuarioId = null
) {

    const resultado =
        await cliente.query(
            `
            SELECT
                id,
                login,
                email
            FROM usuarios
            WHERE
                (
                    LOWER(login) = LOWER($1)
                    OR
                    LOWER(email) = LOWER($2)
                )
                AND (
                    $3::BIGINT IS NULL
                    OR id <> $3
                )
            LIMIT 1
            `,
            [
                login,
                email,
                ignorarUsuarioId
            ]
        );


    const existente =
        resultado.rows[0];


    if (!existente) {
        return;
    }


    if (
        existente.login.toLowerCase() ===
        login.toLowerCase()
    ) {

        const erro =
            new Error(
                "Já existe um usuário com esse login."
            );

        erro.status = 409;

        throw erro;

    }


    const erro =
        new Error(
            "Já existe um usuário com esse e-mail."
        );

    erro.status = 409;

    throw erro;

}


/* =========================================================
   CADASTRAR USUÁRIO
========================================================= */

export async function criarUsuario(dados) {

    const cliente =
        await pool.connect();


    try {

        await cliente.query(
            "BEGIN"
        );


        const login =
            dados.login
                .trim()
                .toLowerCase();


        const email =
            dados.email
                .trim()
                .toLowerCase();


        await verificarDuplicidade(
            cliente,
            login,
            email
        );


        if (
            dados.tipo === "OPERACIONAL"
        ) {

            await validarSecao(
                cliente,
                dados.secaoId
            );

        } else if (dados.secaoId) {

            await validarSecao(
                cliente,
                dados.secaoId
            );

        }


        const permissoes =
            await validarPermissoes(
                cliente,
                dados.permissoes
            );


        const senhaHash =
            await bcrypt.hash(
                dados.senha,
                12
            );


        const resultado =
            await cliente.query(
                `
                INSERT INTO usuarios (
                    nome,
                    nome_guerra,
                    login,
                    email,
                    senha_hash,
                    tipo,
                    secao_id,
                    ativo
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    TRUE
                )

                RETURNING id
                `,
                [
                    dados.nome.trim(),
                    dados.nomeGuerra.trim(),
                    login,
                    email,
                    senhaHash,
                    dados.tipo,
                    dados.secaoId || null
                ]
            );


        const usuarioId =
            resultado.rows[0].id;


        if (
            permissoes.length > 0
        ) {

            await cliente.query(
                `
                INSERT INTO usuario_permissoes (
                    usuario_id,
                    permissao_id
                )

                SELECT
                    $1,
                    p.id

                FROM permissoes p

                WHERE
                    p.codigo =
                    ANY($2::VARCHAR[])
                `,
                [
                    usuarioId,
                    permissoes
                ]
            );

        }


        await cliente.query(
            "COMMIT"
        );


        return await buscarUsuarioPorIdGerenciamento(
            usuarioId
        );


    } catch (erro) {

        await cliente.query(
            "ROLLBACK"
        );


        if (
            erro.code === "23505"
        ) {

            const conflito =
                new Error(
                    "Já existe um usuário com esse login ou e-mail."
                );

            conflito.status = 409;

            throw conflito;

        }


        throw erro;


    } finally {

        cliente.release();

    }

}


/* =========================================================
   EDITAR USUÁRIO
========================================================= */

export async function atualizarUsuario(
    id,
    dados
) {

    const cliente =
        await pool.connect();


    try {

        await cliente.query(
            "BEGIN"
        );


        const login =
            dados.login
                .trim()
                .toLowerCase();


        const email =
            dados.email
                .trim()
                .toLowerCase();


        await verificarDuplicidade(
            cliente,
            login,
            email,
            id
        );


        if (dados.secaoId) {

            await validarSecao(
                cliente,
                dados.secaoId
            );

        }


        const resultado =
            await cliente.query(
                `
                UPDATE usuarios

                SET
                    nome = $1,
                    nome_guerra = $2,
                    login = $3,
                    email = $4,
                    tipo = $5,
                    secao_id = $6

                WHERE id = $7

                RETURNING id
                `,
                [
                    dados.nome.trim(),
                    dados.nomeGuerra.trim(),
                    login,
                    email,
                    dados.tipo,
                    dados.secaoId || null,
                    id
                ]
            );


        if (
            resultado.rowCount === 0
        ) {

            const erro =
                new Error(
                    "Usuário não encontrado."
                );

            erro.status = 404;

            throw erro;

        }


        await cliente.query(
            "COMMIT"
        );


        return await buscarUsuarioPorIdGerenciamento(
            id
        );


    } catch (erro) {

        await cliente.query(
            "ROLLBACK"
        );

        throw erro;


    } finally {

        cliente.release();

    }

}


/* =========================================================
   ALTERAR STATUS
========================================================= */

export async function alterarStatusUsuario(
    id,
    ativo
) {

    const resultado =
        await pool.query(
            `
            UPDATE usuarios

            SET ativo = $1

            WHERE id = $2

            RETURNING id
            `,
            [
                ativo,
                id
            ]
        );


    if (
        resultado.rowCount === 0
    ) {

        return null;

    }


    return await buscarUsuarioPorIdGerenciamento(
        id
    );

}


/* =========================================================
   ALTERAR PERMISSÕES
========================================================= */

export async function atualizarPermissoesUsuario(
    id,
    permissoes
) {

    const cliente =
        await pool.connect();


    try {

        await cliente.query(
            "BEGIN"
        );


        const usuario =
            await cliente.query(
                `
                SELECT id
                FROM usuarios
                WHERE id = $1
                LIMIT 1
                `,
                [id]
            );


        if (
            usuario.rowCount === 0
        ) {

            const erro =
                new Error(
                    "Usuário não encontrado."
                );

            erro.status = 404;

            throw erro;

        }


        const codigos =
            await validarPermissoes(
                cliente,
                permissoes
            );


        await cliente.query(
            `
            DELETE FROM usuario_permissoes
            WHERE usuario_id = $1
            `,
            [id]
        );


        if (
            codigos.length > 0
        ) {

            await cliente.query(
                `
                INSERT INTO usuario_permissoes (
                    usuario_id,
                    permissao_id
                )

                SELECT
                    $1,
                    p.id

                FROM permissoes p

                WHERE
                    p.codigo =
                    ANY($2::VARCHAR[])
                `,
                [
                    id,
                    codigos
                ]
            );

        }


        await cliente.query(
            "COMMIT"
        );


        return await buscarUsuarioPorIdGerenciamento(
            id
        );


    } catch (erro) {

        await cliente.query(
            "ROLLBACK"
        );

        throw erro;


    } finally {

        cliente.release();

    }

}
/* =========================================================
   EXCLUIR USUÁRIO
========================================================= */

export async function excluirUsuario(id) {

    try {

        const resultado =
            await pool.query(
                `
                DELETE FROM usuarios

                WHERE id = $1

                RETURNING
                    id,
                    nome,
                    nome_guerra,
                    login
                `,
                [id]
            );


        return (
            resultado.rows[0] ||
            null
        );


    } catch (erro) {

        /*
         * 23503 = usuário possui registro relacionado
         * protegido por chave estrangeira.
         */
        if (
            erro.code === "23503"
        ) {

            const conflito =
                new Error(
                    "Este usuário possui registros vinculados e não pode ser excluído. Desative a conta para preservar o histórico."
                );

            conflito.status = 409;

            throw conflito;

        }


        throw erro;

    }

}