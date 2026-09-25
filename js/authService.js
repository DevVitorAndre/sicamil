import { api } from "./api.js";

import { CONFIG } from "../config.js";

import { Usuario } from "../models/Usuario.js";

import { sessionService } from "./sessionService.js";


class AuthService {

    async login(
        login,
        senha
    ) {

        const resposta =
            await api.post(
                CONFIG.ROTAS.login,
                {
                    login,
                    senha
                }
            );


        if (!resposta?.usuario) {

            throw new Error(
                "Resposta de autenticação inválida."
            );

        }


        const usuario =
            new Usuario(
                resposta.usuario
            );


        sessionService
            .salvarUsuario(
                usuario
            );


        return usuario;

    }


    async usuarioAtual() {

        const resposta =
            await api.get(
                CONFIG.ROTAS.usuarioAtual
            );


        if (!resposta?.usuario) {

            return null;

        }


        const usuario =
            new Usuario(
                resposta.usuario
            );


        sessionService
            .salvarUsuario(
                usuario
            );


        return usuario;

    }


    async logout() {

        try {

            await api.post(
                CONFIG.ROTAS.logout,
                {}
            );

        } finally {

            sessionService.limpar();

        }

    }

}


export const authService =
    new AuthService();