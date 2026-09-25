import bcrypt from "bcrypt";

import { pool } from "../config/database.js";


const PERMISSOES = [

    {
        codigo: "DASHBOARD_VISUALIZAR",
        nome: "Visualizar Dashboard"
    },

    {
        codigo: "CHAMADA_REALIZAR",
        nome: "Fazer Chamada"
    },

    {
        codigo: "REGISTROS_VISUALIZAR",
        nome: "Ver Registros"
    },

    {
        codigo: "PESQUISA_REALIZAR",
        nome: "Pesquisar"
    },

    {
        codigo: "USUARIOS_GERENCIAR",
        nome: "Gerenciar Usuários"
    },

    {
        codigo: "SECOES_GERENCIAR",
        nome: "Gerenciar Seções"
    },

    {
        codigo: "MILITARES_GERENCIAR",
        nome: "Gerenciar Militares"
    },

    {
        codigo: "RELATORIOS_EXPORTAR",
        nome: "Exportar Relatórios"
    },

    {
        codigo: "SECOES_VISUALIZAR_TODAS",
        nome: "Ver Todas as Seções"
    }

];


async function validarConfiguracao() {

    const obrigatorias = [

        "ADMIN_NOME",
        "ADMIN_NOME_GUERRA",
        "ADMIN_LOGIN",
        "ADMIN_EMAIL",
        "ADMIN_PASSWORD"

    ];


    const faltando =
        obrigatorias.filter(
            (campo) =>
                !process.env[campo]?.trim()
        );


    if (faltando.length > 0) {

        throw new Error(
            `Variáveis ausentes no .env: ${faltando.join(", ")}`
        );

    }

}


async function cadastrarPermissoes(cliente) {

    console.log("");
    console.log("Cadastrando permissões...");


    for (const permissao of PERMISSOES) {

        const existente =
            await cliente.query(
                `
                SELECT id
                FROM permissoes
                WHERE LOWER(codigo) = LOWER($1)
                `,
                [
                    permissao.codigo
                ]
            );


        if (existente.rowCount === 0) {

            await cliente.query(
                `
                INSERT INTO permissoes (
                    codigo,
                    nome
                )
                VALUES ($1, $2)
                `,
                [
                    permissao.codigo,
                    permissao.nome
                ]
            );


            console.log(
                `+ ${permissao.nome}`
            );

        } else {

            console.log(
                `= ${permissao.nome} já existe`
            );

        }

    }

}


async function cadastrarGerente(cliente) {

    console.log("");
    console.log("Configurando primeiro gerente...");


    const login =
        process.env.ADMIN_LOGIN.trim();


    const email =
        process.env.ADMIN_EMAIL.trim();


    const existente =
        await cliente.query(
            `
            SELECT id
            FROM usuarios
            WHERE
                LOWER(login) = LOWER($1)
                OR LOWER(email) = LOWER($2)
            LIMIT 1
            `,
            [
                login,
                email
            ]
        );


    let usuarioId;


    if (existente.rowCount > 0) {

        usuarioId =
            existente.rows[0].id;


        console.log(
            "Gerente já existe. Nenhum novo usuário foi criado."
        );

    } else {

        const senhaHash =
            await bcrypt.hash(
                process.env.ADMIN_PASSWORD,
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
                    'GERENTE',
                    NULL,
                    TRUE
                )
                RETURNING id
                `,
                [
                    process.env.ADMIN_NOME.trim(),
                    process.env.ADMIN_NOME_GUERRA.trim(),
                    login,
                    email,
                    senhaHash
                ]
            );


        usuarioId =
            resultado.rows[0].id;


        console.log(
            "Primeiro gerente criado com sucesso."
        );

    }


    const permissoes =
        await cliente.query(
            `
            SELECT id
            FROM permissoes
            `
        );


    for (const permissao of permissoes.rows) {

        await cliente.query(
            `
            INSERT INTO usuario_permissoes (
                usuario_id,
                permissao_id
            )
            VALUES ($1, $2)

            ON CONFLICT (
                usuario_id,
                permissao_id
            )
            DO NOTHING
            `,
            [
                usuarioId,
                permissao.id
            ]
        );

    }


    console.log(
        "Todas as permissões foram atribuídas ao gerente."
    );

}


async function executarSeed() {

    let cliente;


    try {

        validarConfiguracao();


        cliente =
            await pool.connect();


        await cliente.query(
            "BEGIN"
        );


        console.log("");
        console.log(
            "================================"
        );

        console.log(
            " SICAMIL - SEED INICIAL"
        );

        console.log(
            "================================"
        );


        await cadastrarPermissoes(
            cliente
        );


        await cadastrarGerente(
            cliente
        );


        await cliente.query(
            "COMMIT"
        );


        console.log("");
        console.log(
            "SEED CONCLUÍDO COM SUCESSO ✅"
        );

        console.log("");


    } catch (erro) {

        if (cliente) {

            await cliente.query(
                "ROLLBACK"
            );

        }


        console.error("");
        console.error(
            "ERRO AO EXECUTAR SEED:"
        );

        console.error(
            erro.message
        );

        console.error("");


        process.exitCode = 1;


    } finally {

        if (cliente) {

            cliente.release();

        }


        await pool.end();

    }

}


executarSeed();