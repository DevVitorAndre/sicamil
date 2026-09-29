import {
    buscarOpcoes,
    gerar,
    gerarPlanilha,
    gerarPdf
} from "../services/relatorioService.js";


function obterUsuario(req) {

    return (
        req.usuario ??
        req.user ??
        req.session?.usuario ??
        null
    );

}


/* =========================================================
   EXPORTAR PLANILHA
========================================================= */

async function exportarPlanilha(
    req,
    res,
    next
) {

    try {

        const arquivo =
            await gerarPlanilha({

                usuario:
                    obterUsuario(req),

                dataInicio:
                    req.query.dataInicio ??
                    null,

                dataFim:
                    req.query.dataFim ??
                    null,

                secaoId:
                    req.query.secaoId ??
                    null,

                situacaoId:
                    req.query.situacaoId ??
                    null

            });


        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="${arquivo.nomeArquivo}"`

        );


        return res.send(
            arquivo.buffer
        );


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   EXPORTAR PDF
========================================================= */

async function exportarPdf(
    req,
    res,
    next
) {

    try {

        const arquivo =
            await gerarPdf({

                usuario:
                    obterUsuario(req),

                dataInicio:
                    req.query.dataInicio ??
                    null,

                dataFim:
                    req.query.dataFim ??
                    null,

                secaoId:
                    req.query.secaoId ??
                    null,

                situacaoId:
                    req.query.situacaoId ??
                    null

            });


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="${arquivo.nomeArquivo}"`

        );


        return res.send(
            arquivo.buffer
        );


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   OPÇÕES
========================================================= */

async function opcoes(
    req,
    res,
    next
) {

    try {

        const resposta =
            await buscarOpcoes({

                usuario:
                    obterUsuario(req)

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   GERAR RELATÓRIO
========================================================= */

async function gerarRelatorio(
    req,
    res,
    next
) {

    try {

        const resposta =
            await gerar({

                usuario:
                    obterUsuario(req),

                dataInicio:
                    req.query.dataInicio ??
                    null,

                dataFim:
                    req.query.dataFim ??
                    null,

                secaoId:
                    req.query.secaoId ??
                    null,

                situacaoId:
                    req.query.situacaoId ??
                    null

            });


        return res
            .status(200)
            .json(resposta);


    } catch (erro) {

        next(erro);

    }

}


export {

    opcoes,

    gerarRelatorio,

    exportarPlanilha,

    exportarPdf

};