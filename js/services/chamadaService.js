import { api } from "./api.js";
import { CONFIG } from "../config.js";


class ChamadaService {

    /* =====================================================
       OPÇÕES
    ===================================================== */

    async buscarOpcoes() {

    return await api.get(
        `${CONFIG.ROTAS.chamadas}/opcoes`
    );

}

    /* =====================================================
       CONTEXTO
    ===================================================== */

    async buscarContexto({
        secaoId = null,
        data = null
    } = {}) {

        const parametros =
            new URLSearchParams();


        if (secaoId) {

            parametros.set(
                "secaoId",
                secaoId
            );

        }


        if (data) {

            parametros.set(
                "data",
                data
            );

        }


        const query =
            parametros.toString();


        const rota =
            query
                ? `${CONFIG.ROTAS.chamadas}/contexto?${query}`
                : `${CONFIG.ROTAS.chamadas}/contexto`;


        return await api.get(
            rota
        );

    }


    /* =====================================================
       INICIAR
    ===================================================== */

    async iniciar({
        secaoId = null,
        data = null
    } = {}) {

        return await api.post(

            `${CONFIG.ROTAS.chamadas}/iniciar`,

            {
                secaoId,
                data
            }

        );

    }


    /* =====================================================
       BUSCAR CHAMADA
    ===================================================== */

    async buscarPorId(id) {

        return await api.get(

            `${CONFIG.ROTAS.chamadas}/${id}`

        );

    }


    /* =====================================================
       SALVAR
    ===================================================== */

    async salvar(
        chamadaId,
        militares
    ) {

        return await api.put(

            `${CONFIG.ROTAS.chamadas}/${chamadaId}`,

            {
                militares
            }

        );

    }


    /* =====================================================
       FINALIZAR
    ===================================================== */

    async finalizar(
        chamadaId
    ) {

        return await api.post(

            `${CONFIG.ROTAS.chamadas}/${chamadaId}/finalizar`,

            {}

        );

    }

}


export const chamadaService =
    new ChamadaService();