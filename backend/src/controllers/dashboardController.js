import {
    buscarDashboard
} from "../services/dashboardService.js";


function obterUsuario(
    req
) {

    return (
        req.usuario ??
        req.user ??
        req.session?.usuario ??
        null
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

async function buscar(
    req,
    res,
    next
) {

    try {

        const dashboard =
            await buscarDashboard({

                usuario:
                    obterUsuario(req)

            });


        return res.json(
            dashboard
        );


    } catch (erro) {

        next(erro);

    }

}


export {
    buscar
};