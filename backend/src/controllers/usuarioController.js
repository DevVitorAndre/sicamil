import {
    listarUsuarios,
    buscarUsuarioPorIdGerenciamento,
    listarOpcoesUsuarios,
    criarUsuario,
    atualizarUsuario,
    alterarStatusUsuario,
    atualizarPermissoesUsuario,
    excluirUsuario
} from "../services/usuarioService.js";


/* =========================================================
   AUXILIARES
========================================================= */

function idValido(id) {

    return (
        Number.isInteger(id) &&
        id > 0
    );

}


function emailValido(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


function normalizarSecaoId(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    const id =
        Number(valor);


    return idValido(id)
        ? id
        : NaN;

}


/* =========================================================
   LISTAR
========================================================= */

export async function listar(
    req,
    res,
    next
) {

    try {

        const usuarios =
            await listarUsuarios();


        return res
            .status(200)
            .json({
                usuarios
            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   OPÇÕES
========================================================= */

export async function opcoes(
    req,
    res,
    next
) {

    try {

        const dados =
            await listarOpcoesUsuarios();


        return res
            .status(200)
            .json(dados);


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   BUSCAR POR ID
========================================================= */

export async function buscarPorId(
    req,
    res,
    next
) {

    try {

        const id =
            Number(
                req.params.id
            );


        if (!idValido(id)) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "ID do usuário inválido."
                });

        }


        const usuario =
            await buscarUsuarioPorIdGerenciamento(
                id
            );


        if (!usuario) {

            return res
                .status(404)
                .json({
                    mensagem:
                        "Usuário não encontrado."
                });

        }


        return res
            .status(200)
            .json({
                usuario
            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   CADASTRAR
========================================================= */

export async function cadastrar(
    req,
    res,
    next
) {

    try {

        const {
            nome,
            nomeGuerra,
            login,
            email,
            senha,
            tipo,
            permissoes = []
        } = req.body;


        const secaoId =
            normalizarSecaoId(
                req.body.secaoId
            );


        if (
            !nome?.trim() ||
            !nomeGuerra?.trim() ||
            !login?.trim() ||
            !email?.trim() ||
            !senha
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Preencha todos os campos obrigatórios."
                });

        }


        if (
            !emailValido(
                email.trim()
            )
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Informe um e-mail válido."
                });

        }


        if (
            senha.length < 8
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "A senha inicial deve possuir pelo menos 8 caracteres."
                });

        }


        if (
            tipo !== "GERENTE" &&
            tipo !== "OPERACIONAL"
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Tipo de usuário inválido."
                });

        }


        if (
            Number.isNaN(secaoId)
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Seção inválida."
                });

        }


        if (
            tipo === "OPERACIONAL" &&
            !secaoId
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Usuário operacional deve estar vinculado a uma seção."
                });

        }


        if (
            !Array.isArray(permissoes)
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Permissões inválidas."
                });

        }


        const usuario =
            await criarUsuario({
                nome,
                nomeGuerra,
                login,
                email,
                senha,
                tipo,
                secaoId,
                permissoes
            });


        return res
            .status(201)
            .json({
                mensagem:
                    "Usuário cadastrado com sucesso.",

                usuario
            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   EDITAR
========================================================= */

export async function editar(
    req,
    res,
    next
) {

    try {

        const id =
            Number(
                req.params.id
            );


        if (!idValido(id)) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "ID do usuário inválido."
                });

        }


        const {
            nome,
            nomeGuerra,
            login,
            email,
            tipo
        } = req.body;


        const secaoId =
            normalizarSecaoId(
                req.body.secaoId
            );


        if (
            !nome?.trim() ||
            !nomeGuerra?.trim() ||
            !login?.trim() ||
            !email?.trim()
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Preencha todos os campos obrigatórios."
                });

        }


        if (
            !emailValido(
                email.trim()
            )
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Informe um e-mail válido."
                });

        }


        if (
            tipo !== "GERENTE" &&
            tipo !== "OPERACIONAL"
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Tipo de usuário inválido."
                });

        }


        if (
            Number.isNaN(secaoId)
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Seção inválida."
                });

        }


        if (
            tipo === "OPERACIONAL" &&
            !secaoId
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Usuário operacional deve estar vinculado a uma seção."
                });

        }


        /*
         * Proteção:
         * o usuário autenticado não pode transformar
         * a própria conta de gerente em operacional.
         */
        if (
            String(
                req.session.usuarioId
            ) === String(id) &&
            tipo !== "GERENTE"
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Você não pode alterar o tipo da sua própria conta."
                });

        }


        const usuario =
            await atualizarUsuario(
                id,
                {
                    nome,
                    nomeGuerra,
                    login,
                    email,
                    tipo,
                    secaoId
                }
            );


        return res
            .status(200)
            .json({
                mensagem:
                    "Usuário atualizado com sucesso.",

                usuario
            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   ALTERAR STATUS
========================================================= */

export async function alterarStatus(
    req,
    res,
    next
) {

    try {

        const id =
            Number(
                req.params.id
            );


        const ativo =
            req.body.ativo;


        if (!idValido(id)) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "ID do usuário inválido."
                });

        }


        if (
            typeof ativo !==
            "boolean"
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "O status deve ser verdadeiro ou falso."
                });

        }


        /*
         * Evita o gerente desativar
         * a própria conta por acidente.
         */
        if (
            String(
                req.session.usuarioId
            ) === String(id) &&
            ativo === false
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Você não pode desativar sua própria conta."
                });

        }


        const usuario =
            await alterarStatusUsuario(
                id,
                ativo
            );


        if (!usuario) {

            return res
                .status(404)
                .json({
                    mensagem:
                        "Usuário não encontrado."
                });

        }


        return res
            .status(200)
            .json({
                mensagem:
                    ativo
                        ? "Usuário ativado com sucesso."
                        : "Usuário desativado com sucesso.",

                usuario
            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   ALTERAR PERMISSÕES
========================================================= */

export async function alterarPermissoes(
    req,
    res,
    next
) {

    try {

        const id =
            Number(
                req.params.id
            );


        const permissoes =
            req.body.permissoes;


        if (!idValido(id)) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "ID do usuário inválido."
                });

        }


        if (
            !Array.isArray(
                permissoes
            )
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Informe a lista de permissões."
                });

        }


        /*
         * Proteção para não remover de si mesmo
         * o acesso ao gerenciamento de usuários.
         */
        if (
            String(
                req.session.usuarioId
            ) === String(id) &&
            !permissoes.includes(
                "USUARIOS_GERENCIAR"
            )
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Você não pode remover de sua própria conta a permissão de gerenciar usuários."
                });

        }


        const usuario =
            await atualizarPermissoesUsuario(
                id,
                permissoes
            );


        return res
            .status(200)
            .json({
                mensagem:
                    "Permissões atualizadas com sucesso.",

                usuario
            });


    } catch (erro) {

        next(erro);

    }

}
/* =========================================================
   EXCLUIR USUÁRIO
========================================================= */

export async function excluir(
    req,
    res,
    next
) {

    try {

        const id =
            Number(
                req.params.id
            );


        if (!idValido(id)) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "ID do usuário inválido."
                });

        }


        /*
         * Não permite excluir a própria conta.
         */
        if (
            String(
                req.session.usuarioId
            ) === String(id)
        ) {

            return res
                .status(400)
                .json({
                    mensagem:
                        "Você não pode excluir sua própria conta."
                });

        }


        const usuario =
            await excluirUsuario(
                id
            );


        if (!usuario) {

            return res
                .status(404)
                .json({
                    mensagem:
                        "Usuário não encontrado."
                });

        }


        return res
            .status(200)
            .json({
                mensagem:
                    "Usuário excluído com sucesso."
            });


    } catch (erro) {

        next(erro);

    }

}