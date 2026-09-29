import {
    api
} from "./api.js";

import {
    CONFIG
} from "../config.js";


class PesquisaService {


    /* =====================================================
       OPÇÕES
    ===================================================== */

    async buscarOpcoes() {

        return await api.get(
            `${CONFIG.ROTAS.pesquisa}/opcoes`
        );

    }


    /* =====================================================
       PESQUISAR
    ===================================================== */

    async pesquisar({

        termo = null,

        data = null,

        secaoId = null,

        situacaoId = null,

        pagina = 1,

        limite = 20

    } = {}) {


        const parametros =
            new URLSearchParams();


        if (termo) {

            parametros.set(
                "termo",
                termo
            );

        }


        if (data) {

            parametros.set(
                "data",
                data
            );

        }


        if (secaoId) {

            parametros.set(
                "secaoId",
                secaoId
            );

        }


        if (situacaoId) {

            parametros.set(
                "situacaoId",
                situacaoId
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

            `${CONFIG.ROTAS.pesquisa}?${parametros.toString()}`

        );

    }

}


export const pesquisaService =
    new PesquisaService();