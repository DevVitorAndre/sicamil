import {
    api
} from "./api.js";

import {
    CONFIG
} from "../config.js";

import {
    Secao
} from "../models/Secao.js";


class SecaoService {


    /* =====================================================
       LISTAR
    ===================================================== */

    async listar() {

        const resposta =
            await api.get(
                CONFIG.ROTAS.secoes
            );


        const secoes =
            resposta.secoes || [];


        return secoes.map(
            (secao) =>
                new Secao(secao)
        );

    }


    /* =====================================================
       BUSCAR POR ID
    ===================================================== */

    async buscarPorId(id) {

        const resposta =
            await api.get(
                `${CONFIG.ROTAS.secoes}/${id}`
            );


        return new Secao(
            resposta.secao
        );

    }


    /* =====================================================
       CADASTRAR
    ===================================================== */

    async cadastrar(
        nome,
        sigla
    ) {

        const resposta =
            await api.post(
                CONFIG.ROTAS.secoes,
                {
                    nome,
                    sigla
                }
            );


        return {

            mensagem:
                resposta.mensagem,

            secao:
                new Secao(
                    resposta.secao
                )

        };

    }


    /* =====================================================
       EDITAR
    ===================================================== */

    async editar(
        id,
        nome,
        sigla
    ) {

        const resposta =
            await api.put(
                `${CONFIG.ROTAS.secoes}/${id}`,
                {
                    nome,
                    sigla
                }
            );


        return {

            mensagem:
                resposta.mensagem,

            secao:
                new Secao(
                    resposta.secao
                )

        };

    }


    /* =====================================================
       ALTERAR STATUS
    ===================================================== */

    async alterarStatus(
        id,
        ativa
    ) {

        const resposta =
            await api.patch(
                `${CONFIG.ROTAS.secoes}/${id}/status`,
                {
                    ativa
                }
            );


        return {

            mensagem:
                resposta.mensagem,

            secao:
                new Secao(
                    resposta.secao
                )

        };

    }

}


export const secaoService =
    new SecaoService();