import { Usuario } from "../models/Usuario.js";


const CHAVE_USUARIO =
    "sicamil_usuario";


class SessionService {

    salvarUsuario(usuario) {

        if (!usuario) {
            return;
        }


        sessionStorage.setItem(

            CHAVE_USUARIO,

            JSON.stringify(usuario)

        );

    }


    obterUsuario() {

        const dados =
            sessionStorage.getItem(
                CHAVE_USUARIO
            );


        if (!dados) {
            return null;
        }


        try {

            return new Usuario(
                JSON.parse(dados)
            );

        } catch {

            this.limpar();

            return null;

        }

    }


    limpar() {

        sessionStorage.removeItem(
            CHAVE_USUARIO
        );

    }


    estaAutenticado() {

        return Boolean(
            this.obterUsuario()
        );

    }

}


export const sessionService =
    new SessionService();