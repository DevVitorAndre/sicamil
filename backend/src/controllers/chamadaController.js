import {
    buscarOpcoes,
    buscarContexto,
    iniciar,
    salvar,
    finalizar,
    buscarPorId
} from "../services/chamadaService.js";


/* =========================================================
   USUÁRIO AUTENTICADO
========================================================= */

function obterUsuario(req) {

    return (
        req.usuario ??
        req.user ??
        req.session?.usuario ??
        null
    );

}


/* =========================================================
   CONTEXTO DA CHAMADA
========================================================= */

async function contexto(req, res, next) {

    try {

        const resposta =
            await buscarContexto({

                usuario:
                    obterUsuario(req),

                secaoId:
                    req.query.secaoId ?? null,

                data:
                    req.query.data ?? null

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   INICIAR
========================================================= */

async function iniciarChamada(req, res, next) {

    try {

        const chamada =
            await iniciar({

                usuario:
                    obterUsuario(req),

                secaoId:
                    req.body.secaoId ?? null,

                data:
                    req.body.data ?? null

            });


        return res
            .status(200)
            .json({

                mensagem:
                    "Chamada iniciada com sucesso.",

                chamada

            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   BUSCAR POR ID
========================================================= */

async function buscar(req, res, next) {

    try {

        const resposta =
            await buscarPorId({

                usuario:
                    obterUsuario(req),

                chamadaId:
                    req.params.id

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   SALVAR
========================================================= */

async function salvarChamada(req, res, next) {

    try {

        const resposta =
            await salvar({

                usuario:
                    obterUsuario(req),

                chamadaId:
                    req.params.id,

                militares:
                    req.body.militares

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}

/* =========================================================
   OPÇÕES
========================================================= */

async function opcoes(req, res, next) {

    try {

        const resposta =
            await buscarOpcoes({

                usuario:
                    obterUsuario(req)

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   FINALIZAR
========================================================= */

async function finalizarChamada(req, res, next) {

    try {

        const resposta =
            await finalizar({

                usuario:
                    obterUsuario(req),

                chamadaId:
                    req.params.id

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


export {

    opcoes,

    contexto,

    iniciarChamada,

    buscar,

    salvarChamada,

    finalizarChamada

};