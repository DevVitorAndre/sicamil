import {
    api
} from "./api.js";

import {
    CONFIG
} from "../config.js";


class RegistroService {

    /* =====================================================
         OPÇÕES
    ===================================================== */
    
    async buscarOpcoes() {

    return await api.get(
        `${CONFIG.ROTAS.registros}/opcoes`
    );

}


    /* =====================================================
       LISTAR REGISTROS
    ===================================================== */

    async listar({

        dataInicio = null,

        dataFim = null,

        secaoId = null,

        status = null,

        pagina = 1,

        limite = 20

    } = {}) {


        const parametros =
            new URLSearchParams();


        if (dataInicio) {

            parametros.set(
                "dataInicio",
                dataInicio
            );

        }


        if (dataFim) {

            parametros.set(
                "dataFim",
                dataFim
            );

        }


        if (secaoId) {

            parametros.set(
                "secaoId",
                secaoId
            );

        }


        if (status) {

            parametros.set(
                "status",
                status
            );

        }


        parametros.set(
            "pagina",
            pagina
        );


        parametros.set(
            "limite",
            limite
        );


        return await api.get(

            `${CONFIG.ROTAS.registros}?${parametros.toString()}`

        );

    }


    /* =====================================================
       BUSCAR DETALHES
    ===================================================== */

    async buscarPorId(id) {

        return await api.get(

            `${CONFIG.ROTAS.registros}/${id}`

        );

    }

}


export const registroService =
    new RegistroService();