import {

    listarSecoes,
    buscarSecaoPorId,
    criarSecao,
    atualizarSecao,
    alterarStatusSecao

} from "../services/secaoService.js";


/* =========================================================
   LISTAR
========================================================= */

export async function listar(
    req,
    res,
    next
) {

    try {

        const secoes =
            await listarSecoes();


        return res
            .status(200)
            .json({

                secoes

            });


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


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "ID da seção inválido."

                });

        }


        const secao =
            await buscarSecaoPorId(
                id
            );


        if (!secao) {

            return res
                .status(404)
                .json({

                    mensagem:
                        "Seção não encontrada."

                });

        }


        return res
            .status(200)
            .json({

                secao

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

        const nome =
            req.body.nome?.trim();

        const sigla =
            req.body.sigla?.trim();


        if (
            !nome ||
            !sigla
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "Informe o nome e a sigla da seção."

                });

        }


        if (
            nome.length > 120
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "O nome da seção deve possuir no máximo 120 caracteres."

                });

        }


        if (
            sigla.length > 30
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "A sigla deve possuir no máximo 30 caracteres."

                });

        }


        const secao =
            await criarSecao({

                nome,
                sigla

            });


        return res
            .status(201)
            .json({

                mensagem:
                    "Seção cadastrada com sucesso.",

                secao

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


        const nome =
            req.body.nome?.trim();

        const sigla =
            req.body.sigla?.trim();


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "ID da seção inválido."

                });

        }


        if (
            !nome ||
            !sigla
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "Informe o nome e a sigla da seção."

                });

        }


        if (
            nome.length > 120 ||
            sigla.length > 30
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "Nome ou sigla acima do limite permitido."

                });

        }


        const secao =
            await atualizarSecao(
                id,
                {
                    nome,
                    sigla
                }
            );


        if (!secao) {

            return res
                .status(404)
                .json({

                    mensagem:
                        "Seção não encontrada."

                });

        }


        return res
            .status(200)
            .json({

                mensagem:
                    "Seção atualizada com sucesso.",

                secao

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


        const ativa =
            req.body.ativa;


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "ID da seção inválido."

                });

        }


        if (
            typeof ativa !==
            "boolean"
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "O status da seção deve ser verdadeiro ou falso."

                });

        }


        const secao =
            await alterarStatusSecao(
                id,
                ativa
            );


        if (!secao) {

            return res
                .status(404)
                .json({

                    mensagem:
                        "Seção não encontrada."

                });

        }


        return res
            .status(200)
            .json({

                mensagem:
                    ativa
                        ? "Seção ativada com sucesso."
                        : "Seção desativada com sucesso.",

                secao

            });


    } catch (erro) {

        next(erro);

    }

}