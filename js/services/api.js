import { CONFIG } from "../config.js";


class ApiService {

    async request(
        endpoint,
        options = {}
    ) {

        const url =
            `${CONFIG.API_URL}${endpoint}`;


        const configuracao = {

            method:
                options.method || "GET",

            credentials:
                "include",

            headers: {

                "Content-Type":
                    "application/json",

                ...options.headers

            }

        };


        if (options.body !== undefined) {

            configuracao.body =
                JSON.stringify(
                    options.body
                );

        }


        let resposta;


        try {

            resposta =
                await fetch(
                    url,
                    configuracao
                );

        } catch (erro) {

            throw new Error(
                "Não foi possível conectar ao servidor."
            );

        }


        let dados = null;


        const tipoConteudo =
            resposta.headers.get(
                "content-type"
            );


        if (
            tipoConteudo &&
            tipoConteudo.includes(
                "application/json"
            )
        ) {

            dados =
                await resposta.json();

        }


        if (!resposta.ok) {

            const mensagem =

                dados?.mensagem ||

                dados?.message ||

                "Ocorreu um erro na solicitação.";


            const erro =
                new Error(mensagem);


            erro.status =
                resposta.status;


            throw erro;

        }


        return dados;

    }


    get(endpoint) {

        return this.request(
            endpoint,
            {
                method: "GET"
            }
        );

    }


    post(endpoint, body) {

        return this.request(
            endpoint,
            {
                method: "POST",
                body
            }
        );

    }


    put(endpoint, body) {

        return this.request(
            endpoint,
            {
                method: "PUT",
                body
            }
        );

    }


    patch(endpoint, body) {

        return this.request(
            endpoint,
            {
                method: "PATCH",
                body
            }
        );

    }


    delete(endpoint) {

        return this.request(
            endpoint,
            {
                method: "DELETE"
            }
        );

    }

}


export const api =
    new ApiService();