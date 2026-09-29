import {
    buscarOpcoes,
    listar,
    buscarPorId
} from "../services/registroService.js";


function obterUsuario(req) {

    return (
        req.usuario ??
        req.user ??
        req.session?.usuario ??
        null
    );

}


/* =========================================================
   OPÇÕES
========================================================= */

async function opcoes(
    req,
    res,
    next
) {

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
   LISTAR REGISTROS
========================================================= */

async function listarRegistros(
    req,
    res,
    next
) {

    try {

        const resposta =
            await listar({

                usuario:
                    obterUsuario(req),

                dataInicio:
                    req.query.dataInicio ??
                    null,

                dataFim:
                    req.query.dataFim ??
                    null,

                secaoId:
                    req.query.secaoId ??
                    null,

                status:
                    req.query.status ??
                    null,

                pagina:
                    req.query.pagina ??
                    1,

                limite:
                    req.query.limite ??
                    20

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   DETALHAR REGISTRO
========================================================= */

async function buscarRegistro(
    req,
    res,
    next
) {

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


export {

    opcoes,

    listarRegistros,

    buscarRegistro

};