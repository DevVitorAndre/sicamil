import {
    api
} from "./api.js";

import {
    CONFIG
} from "../config.js";

import {
    Usuario
} from "../models/Usuario.js";


class UsuarioService {

    /* =====================================================
        EXCLUIR
    ===================================================== */

async excluir(id) {

    return await api.delete(
        `${CONFIG.ROTAS.usuarios}/${id}`
    );

}


    /* =====================================================
       LISTAR
    ===================================================== */

    async listar() {

        const resposta =
            await api.get(
                CONFIG.ROTAS.usuarios
            );


        return (
            resposta.usuarios || []
        ).map(
            usuario =>
                new Usuario(usuario)
        );

    }


    /* =====================================================
       BUSCAR POR ID
    ===================================================== */

    async buscarPorId(id) {

        const resposta =
            await api.get(
                `${CONFIG.ROTAS.usuarios}/${id}`
            );


        return new Usuario(
            resposta.usuario
        );

    }


    /* =====================================================
       OPÇÕES DO FORMULÁRIO
    ===================================================== */

    async buscarOpcoes() {

        return await api.get(
            `${CONFIG.ROTAS.usuarios}/opcoes`
        );

    }


    /* =====================================================
       CADASTRAR
    ===================================================== */

    async cadastrar(dados) {

        const resposta =
            await api.post(
                CONFIG.ROTAS.usuarios,
                dados
            );


        return {
            mensagem:
                resposta.mensagem,

            usuario:
                new Usuario(
                    resposta.usuario
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
                `${CONFIG.ROTAS.usuarios}/${id}`,
                dados
            );


        return {
            mensagem:
                resposta.mensagem,

            usuario:
                new Usuario(
                    resposta.usuario
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
                `${CONFIG.ROTAS.usuarios}/${id}/status`,
                {
                    ativo
                }
            );


        return {
            mensagem:
                resposta.mensagem,

            usuario:
                new Usuario(
                    resposta.usuario
                )
        };

    }


    /* =====================================================
       ALTERAR PERMISSÕES
    ===================================================== */

    async alterarPermissoes(
        id,
        permissoes
    ) {

        const resposta =
            await api.put(
                `${CONFIG.ROTAS.usuarios}/${id}/permissoes`,
                {
                    permissoes
                }
            );


        return {
            mensagem:
                resposta.mensagem,

            usuario:
                new Usuario(
                    resposta.usuario
                )
        };

    }

}


export const usuarioService =
    new UsuarioService();