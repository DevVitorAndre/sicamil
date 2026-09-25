import { api } from "./api.js";
import { CONFIG } from "../config.js";
import { Usuario } from "../models/Usuario.js";
import { sessionService } from "./sessionService.js";


class AuthService {

    /* =====================================================
       LOGIN
    ===================================================== */

    async login(login, senha) {

        const resposta =
            await api.post(
                CONFIG.ROTAS.login,
                {
                    login,
                    senha
                }
            );


        if (!resposta.usuario) {

            throw new Error(
                "O servidor não retornou os dados do usuário."
            );

        }


        const usuario =
            new Usuario(
                resposta.usuario
            );


        sessionService.salvar(
            usuario
        );


        return usuario;

    }


    /* =====================================================
       USUÁRIO ATUAL

       O backend é a fonte oficial da sessão.
    ===================================================== */

    async usuarioAtual() {

        const resposta =
            await api.get(
                CONFIG.ROTAS.usuarioAtual
            );


        if (!resposta.usuario) {

            throw new Error(
                "Sessão inválida."
            );

        }


        const usuario =
            new Usuario(
                resposta.usuario
            );


        sessionService.salvar(
            usuario
        );


        return usuario;

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async logout() {

        try {

            await api.post(
                CONFIG.ROTAS.logout
            );

        } finally {

            sessionService.limpar();

        }

    }

}


export const authService =
    new AuthService();