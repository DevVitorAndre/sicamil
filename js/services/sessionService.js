import { Usuario } from "../models/Usuario.js";


const CHAVE_USUARIO =
    "sicamil_usuario";


class SessionService {


    /* =====================================================
       SALVAR USUÁRIO

       Guarda apenas dados básicos do usuário no navegador.
       A autenticação verdadeira continua sendo controlada
       pelo backend através da sessão.
    ===================================================== */

    salvar(usuario) {

        if (!usuario) {

            return;

        }


        const dados = {

            id:
                usuario.id,

            nome:
                usuario.nome,

            nomeGuerra:
                usuario.nomeGuerra,

            login:
                usuario.login,

            email:
                usuario.email,

            tipo:
                usuario.tipo,

            secao:
                usuario.secao,

            permissoes:
                usuario.permissoes || [],

            ativo:
                usuario.ativo

        };


        sessionStorage.setItem(
            CHAVE_USUARIO,
            JSON.stringify(dados)
        );

    }


    /* =====================================================
       OBTER USUÁRIO
    ===================================================== */

    obter() {

        const dados =
            sessionStorage.getItem(
                CHAVE_USUARIO
            );


        if (!dados) {

            return null;

        }


        try {

            const objeto =
                JSON.parse(dados);


            return new Usuario(
                objeto
            );


        } catch (erro) {

            console.error(
                "Erro ao recuperar usuário da sessão:",
                erro
            );


            this.limpar();


            return null;

        }

    }


    /* =====================================================
       LIMPAR SESSÃO LOCAL
    ===================================================== */

    limpar() {

        sessionStorage.removeItem(
            CHAVE_USUARIO
        );

    }


    /* =====================================================
       VERIFICAR SE EXISTE USUÁRIO LOCAL

       Isso não substitui a validação do backend.
    ===================================================== */

    estaAutenticado() {

        return (
            this.obter() !== null
        );

    }

}


export const sessionService =
    new SessionService();