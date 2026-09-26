import {
    api
} from "./api.js";

import {
    CONFIG
} from "../config.js";

import {
    Militar
} from "../models/Militar.js";


class MilitarService {

    /* =====================================================
       EXCLUIR
    ===================================================== */

    async excluir(id) {

        return await api.delete(
            `${CONFIG.ROTAS.militares}/${id}`
        );

    }


    /* =====================================================
       LISTAR
    ===================================================== */

    async listar(filtros = {}) {

        const parametros =
            new URLSearchParams();


        if (
            filtros.secaoId !== undefined &&
            filtros.secaoId !== null &&
            filtros.secaoId !== ""
        ) {

            parametros.set(
                "secaoId",
                filtros.secaoId
            );

        }


        if (
            typeof filtros.ativo ===
            "boolean"
        ) {

            parametros.set(
                "ativo",
                filtros.ativo
            );

        }


        const query =
            parametros.toString();


        const rota =
            query
                ? `${CONFIG.ROTAS.militares}?${query}`
                : CONFIG.ROTAS.militares;


        const resposta =
            await api.get(
                rota
            );


        return (
            resposta.militares || []
        ).map(
            militar =>
                new Militar(militar)
        );

    }


    /* =====================================================
       BUSCAR POR ID
    ===================================================== */

    async buscarPorId(id) {

        const resposta =
            await api.get(
                `${CONFIG.ROTAS.militares}/${id}`
            );


        return new Militar(
            resposta.militar
        );

    }


    /* =====================================================
       OPÇÕES DO FORMULÁRIO
    ===================================================== */

    async buscarOpcoes() {

        return await api.get(
            `${CONFIG.ROTAS.militares}/opcoes`
        );

    }


    /* =====================================================
       CADASTRAR
    ===================================================== */

    async cadastrar(dados) {

        const resposta =
            await api.post(
                CONFIG.ROTAS.militares,
                dados
            );


        return {

            mensagem:
                resposta.mensagem,

            militar:
                new Militar(
                    resposta.militar
                )

        };

    }


    /* =====================================================
       EDITAR
    ===================================================== */

    async editar(
        id,
        dados
    ) {

        const resposta =
            await api.put(
                `${CONFIG.ROTAS.militares}/${id}`,
                dados
            );


        return {

            mensagem:
                resposta.mensagem,

            militar:
                new Militar(
                    resposta.militar
                )

        };

    }


    /* =====================================================
       ALTERAR STATUS
    ===================================================== */

    async alterarStatus(
        id,
        ativo
    ) {

        const resposta =
            await api.patch(
                `${CONFIG.ROTAS.militares}/${id}/status`,
                {
                    ativo
                }
            );


        return {

            mensagem:
                resposta.mensagem,

            militar:
                new Militar(
                    resposta.militar
                )

        };

    }

}


export const militarService =
    new MilitarService();