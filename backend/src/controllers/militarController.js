import {

    listarMilitares,
    buscarMilitarPorId,
    listarOpcoes,
    criarMilitar,
    atualizarMilitar,
    alterarStatusMilitar,
    excluirMilitar

} from "../services/militarService.js";


/* =========================================================
   CONVERTER FILTRO DE STATUS
========================================================= */

function converterAtivo(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }


    const texto =
        String(valor)
            .trim()
            .toLowerCase();


    if (
        texto === "true" ||
        texto === "1" ||
        texto === "ativo" ||
        texto === "ativos"
    ) {
        return true;
    }


    if (
        texto === "false" ||
        texto === "0" ||
        texto === "inativo" ||
        texto === "inativos"
    ) {
        return false;
    }


    const erro =
        new Error(
            "Filtro de status inválido."
        );

    erro.status = 400;

    throw erro;

}


/* =========================================================
   LISTAR MILITARES
========================================================= */

async function listar(
    req,
    res,
    next
) {

    try {

        const filtros = {

            secaoId:
                req.query.secaoId || null,

            ativo:
                converterAtivo(
                    req.query.ativo
                )

        };


        const militares =
            await listarMilitares(
                req.usuario,
                filtros
            );


        return res.status(200).json({

            militares,

            total:
                militares.length

        });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   BUSCAR MILITAR
========================================================= */

async function buscarPorId(
    req,
    res,
    next
) {

    try {

        const militar =
            await buscarMilitarPorId(
                req.params.id,
                req.usuario
            );


        if (!militar) {

            return res.status(404).json({

                mensagem:
                    "Militar não encontrado."

            });

        }


        return res.status(200).json({

            militar

        });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   OPÇÕES DO FORMULÁRIO
========================================================= */

async function opcoes(
    req,
    res,
    next
) {

    try {

        const resultado =
            await listarOpcoes(
                req.usuario
            );


        return res.status(200).json(
            resultado
        );


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   CRIAR MILITAR
========================================================= */

async function criar(
    req,
    res,
    next
) {

    try {

        const militar =
            await criarMilitar(
                req.body,
                req.usuario
            );


        return res.status(201).json({

            mensagem:
                "Militar cadastrado com sucesso.",

            militar

        });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   ATUALIZAR MILITAR
========================================================= */

async function atualizar(
    req,
    res,
    next
) {

    try {

        const militar =
            await atualizarMilitar(

                req.params.id,

                req.body,

                req.usuario

            );


        if (!militar) {

            return res.status(404).json({

                mensagem:
                    "Militar não encontrado."

            });

        }


        return res.status(200).json({

            mensagem:
                "Militar atualizado com sucesso.",

            militar

        });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   ATIVAR / DESATIVAR
========================================================= */

async function alterarStatus(
    req,
    res,
    next
) {

    try {

        /*
            IMPORTANTE:

            Não usamos Boolean(req.body.ativo),
            porque Boolean("false") seria TRUE.

            Aqui exigimos booleano real.
        */

        if (
            typeof req.body.ativo !==
            "boolean"
        ) {

            return res.status(400).json({

                mensagem:
                    "Informe o status ativo como true ou false."

            });

        }


        const militar =
            await alterarStatusMilitar(

                req.params.id,

                req.body.ativo,

                req.usuario

            );


        if (!militar) {

            return res.status(404).json({

                mensagem:
                    "Militar não encontrado."

            });

        }


        return res.status(200).json({

            mensagem:
                militar.ativo
                    ? "Militar ativado com sucesso."
                    : "Militar desativado com sucesso.",

            militar

        });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   EXCLUIR MILITAR
========================================================= */

async function excluir(
    req,
    res,
    next
) {

    try {

        const resultado =
            await excluirMilitar(

                req.params.id,

                req.usuario

            );


        if (!resultado) {

            return res.status(404).json({

                mensagem:
                    "Militar não encontrado."

            });

        }


        return res.status(200).json({

            mensagem:
                "Militar excluído com sucesso.",

            id:
                resultado.id

        });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    listar,
    buscarPorId,
    opcoes,
    criar,
    atualizar,
    alterarStatus,
    excluir

};