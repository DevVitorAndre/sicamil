import {
    api
} from "./api.js";

import {
    CONFIG
} from "../config.js";


class RelatorioService {

/* =====================================================
   MONTAR PARÂMETROS
===================================================== */

montarParametros({

    dataInicio = null,
    dataFim = null,
    secaoId = null,
    situacaoId = null

} = {}) {

    const parametros =
        new URLSearchParams();


    if (dataInicio) {

        parametros.set(
            "dataInicio",
            dataInicio
        );

    }


    if (dataFim) {

        parametros.set(
            "dataFim",
            dataFim
        );

    }


    if (secaoId) {

        parametros.set(
            "secaoId",
            secaoId
        );

    }


    if (situacaoId) {

        parametros.set(
            "situacaoId",
            situacaoId
        );

    }


    return parametros;

}


/* =====================================================
   BAIXAR ARQUIVO
===================================================== */

async baixarArquivo(
    tipo,
    filtros = {}
) {

    const parametros =
        this.montarParametros(
            filtros
        );


    const query =
        parametros.toString();


    const rota =
        tipo === "pdf"
            ? "/exportar/pdf"
            : "/exportar/xlsx";


    const url =
        `${CONFIG.API_URL}${CONFIG.ROTAS.relatorios}${rota}${
            query
                ? `?${query}`
                : ""
        }`;


    const resposta =
        await fetch(
            url,
            {
                method:
                    "GET",

                credentials:
                    "include"
            }
        );


    if (!resposta.ok) {

        let mensagem =
            "Não foi possível exportar o relatório.";


        try {

            const erro =
                await resposta.json();


            mensagem =
                erro.mensagem ||
                erro.message ||
                mensagem;

        } catch {

            // mantém mensagem padrão

        }


        throw new Error(
            mensagem
        );

    }


    const arquivo =
        await resposta.blob();


    const disposicao =
        resposta.headers.get(
            "Content-Disposition"
        );


    let nomeArquivo =
        tipo === "pdf"
            ? "sicamil-relatorio.pdf"
            : "sicamil-relatorio.xlsx";


    const correspondencia =
        disposicao?.match(
            /filename="?([^"]+)"?/i
        );


    if (
        correspondencia?.[1]
    ) {

        nomeArquivo =
            correspondencia[1];

    }


    const endereco =
        URL.createObjectURL(
            arquivo
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        endereco;


    link.download =
        nomeArquivo;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        endereco
    );

}


    /* =====================================================
       OPÇÕES
    ===================================================== */

    async buscarOpcoes() {

        return await api.get(
            `${CONFIG.ROTAS.relatorios}/opcoes`
        );

    }


    /* =====================================================
       GERAR RELATÓRIO
    ===================================================== */

    async gerar({

        dataInicio = null,

        dataFim = null,

        secaoId = null,

        situacaoId = null

    } = {}) {


        const parametros =
            new URLSearchParams();


        if (dataInicio) {

            parametros.set(
                "dataInicio",
                dataInicio
            );

        }


        if (dataFim) {

            parametros.set(
                "dataFim",
                dataFim
            );

        }


        if (secaoId) {

            parametros.set(
                "secaoId",
                secaoId
            );

        }


        if (situacaoId) {

            parametros.set(
                "situacaoId",
                situacaoId
            );

        }


        const query =
            parametros.toString();


        const rota =
            query
                ? `${CONFIG.ROTAS.relatorios}?${query}`
                : CONFIG.ROTAS.relatorios;


        return await api.get(
            rota
        );

    }

}


export const relatorioService =
    new RelatorioService();