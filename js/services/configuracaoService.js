import {
    api
} from "./api.js";


import {
    CONFIG
} from "../config.js";


class ConfiguracaoService {


    buscarConta() {

        return api.get(
            `${CONFIG.ROTAS.configuracoes}/conta`
        );

    }


    alterarSenha(
        senhaAtual,
        novaSenha
    ) {

        return api.put(
            `${CONFIG.ROTAS.configuracoes}/senha`,
            {

                senhaAtual,
                novaSenha

            }
        );

    }

}


export const configuracaoService =
    new ConfiguracaoService();