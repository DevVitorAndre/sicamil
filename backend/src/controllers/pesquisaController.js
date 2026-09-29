import {
    buscarOpcoes,
    pesquisar
} from "../services/pesquisaService.js";


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
   PESQUISAR
========================================================= */

async function pesquisarRegistros(
    req,
    res,
    next
) {

    try {

        const resposta =
            await pesquisar({

                usuario:
                    obterUsuario(req),

                termo:
                    req.query.termo ??
                    null,

                data:
                    req.query.data ??
                    null,

                secaoId:
                    req.query.secaoId ??
                    null,

                situacaoId:
                    req.query.situacaoId ??
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


export {

    opcoes,

    pesquisarRegistros

};