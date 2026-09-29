/* =========================================================
   AMBIENTE
========================================================= */

const ambienteLocal =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

export const CONFIG = {

    /*
        DESENVOLVIMENTO:

        Frontend:
        http://127.0.0.1:5500

        Backend:
        http://127.0.0.1:3000


        PRODUÇÃO:

        O SICAMIL utilizará o mesmo endereço
        fornecido pela infraestrutura da TI.

        Exemplo:

        https://endereco-interno/sicamil
        https://endereco-interno/api
    */

    API_URL:
        ambienteLocal
            ? "http://127.0.0.1:3000/api"
            : `${window.location.origin}/api`,


    ROTAS: {

        login:
            "/auth/login",

        logout:
            "/auth/logout",

        usuarioAtual:
            "/auth/me",

        dashboard:
            "/dashboard",

        secoes:
            "/secoes",

        usuarios:
            "/usuarios",

        militares:
            "/militares",

        chamadas:
            "/chamadas",

        registros:
            "/registros",

        pesquisa:
            "/pesquisa",

        relatorios:
            "/relatorios",

        configuracoes:
            "/configuracoes"

    }

};