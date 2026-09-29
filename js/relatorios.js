import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    relatorioService
} from "./services/relatorioService.js";


/* =========================================================
   ESTADO
========================================================= */

let usuarioLogado = null;

let secoes = [];

let situacoes = [];

let relatorioAtual = null;


const elementos = {};


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


async function iniciar() {

    try {

        usuarioLogado =
            await authService.usuarioAtual();


        if (
            !usuarioLogado.possuiPermissao(
                "RELATORIOS_EXPORTAR"
            )
        ) {

            window.location.href =
                "dashboard.html";

            return;

        }


        await carregarComponentes();


        mapearElementos();

        registrarEventos();


        await carregarOpcoes();


    } catch (erro) {

        console.error(
            "Erro ao iniciar Relatórios:",
            erro
        );


        if (
            erro.status === 401
        ) {

            window.location.href =
                "index.html";

            return;

        }


        exibirMensagem(

            erro.message ||
            "Não foi possível carregar a página de relatórios.",

            "error"

        );

    }

}


/* =========================================================
   ELEMENTOS
========================================================= */

function mapearElementos() {

    elementos.mensagem =
        document.getElementById(
            "relatorioMensagem"
        );


    elementos.dataInicio =
        document.getElementById(
            "dataInicio"
        );


    elementos.dataFim =
        document.getElementById(
            "dataFim"
        );


    elementos.secao =
        document.getElementById(
            "filtroSecao"
        );


    elementos.situacao =
        document.getElementById(
            "filtroSituacao"
        );


    elementos.btnLimpar =
        document.getElementById(
            "btnLimpar"
        );


    elementos.btnGerar =
        document.getElementById(
            "btnGerarRelatorio"
        );


    elementos.btnPdf =
        document.getElementById(
            "btnExportarPdf"
        );


    elementos.btnPlanilha =
        document.getElementById(
            "btnExportarPlanilha"
        );


    /* INDICADORES */

    elementos.totalRegistros =
        document.getElementById(
            "totalRegistros"
        );


    elementos.militaresDistintos =
        document.getElementById(
            "militaresDistintos"
        );


    elementos.totalDisponiveis =
        document.getElementById(
            "totalDisponiveis"
        );


    elementos.totalIndisponiveis =
        document.getElementById(
            "totalIndisponiveis"
        );


    elementos.totalChamadas =
        document.getElementById(
            "totalChamadas"
        );


    elementos.totalSecoes =
        document.getElementById(
            "totalSecoes"
        );


    elementos.totalNominal =
        document.getElementById(
            "totalNominal"
        );


    /* TABELAS */

    elementos.tabelaSecoes =
        document.getElementById(
            "tabelaSecoes"
        );


    elementos.tabelaSituacoes =
        document.getElementById(
            "tabelaSituacoes"
        );


    elementos.tabelaMilitares =
        document.getElementById(
            "tabelaMilitares"
        );

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnGerar
        ?.addEventListener(
            "click",
            gerarRelatorio
        );


    elementos.btnLimpar
        ?.addEventListener(
            "click",
            limparRelatorio
        );


elementos.btnPdf
    ?.addEventListener(
        "click",
        () => exportarRelatorio(
            "pdf"
        )
    );


elementos.btnPlanilha
    ?.addEventListener(
        "click",
        () => exportarRelatorio(
            "xlsx"
        )
    );

}

/* =========================================================
   EXPORTAÇÃO
========================================================= */

async function exportarRelatorio(
    tipo
) {

    if (!relatorioAtual) {

        exibirMensagem(
            "Gere um relatório antes de exportar.",
            "warning"
        );

        return;

    }


    const botao =
        tipo === "pdf"
            ? elementos.btnPdf
            : elementos.btnPlanilha;


    const textoOriginal =
        botao.textContent;


    try {

        botao.disabled =
            true;


        botao.textContent =
            tipo === "pdf"
                ? "Gerando PDF..."
                : "Gerando Planilha...";


        await relatorioService
            .baixarArquivo(

                tipo,

                {
                    dataInicio:
                        elementos
                            .dataInicio
                            .value ||
                        null,

                    dataFim:
                        elementos
                            .dataFim
                            .value ||
                        null,

                    secaoId:
                        elementos
                            .secao
                            .value ||
                        null,

                    situacaoId:
                        elementos
                            .situacao
                            .value ||
                        null
                }

            );


        exibirMensagem(

            tipo === "pdf"
                ? "PDF exportado com sucesso."
                : "Planilha exportada com sucesso.",

            "success"

        );


    } catch (erro) {

        console.error(
            "Erro na exportação:",
            erro
        );


        exibirMensagem(

            erro.message ||
            "Não foi possível exportar o relatório.",

            "error"

        );


    } finally {

        botao.textContent =
            textoOriginal;


        atualizarBotoesExportacao();

    }

}


/* =========================================================
   CARREGAR OPÇÕES
========================================================= */

async function carregarOpcoes() {

    const resposta =
        await relatorioService.buscarOpcoes();


    secoes =
        resposta.secoes || [];


    situacoes =
        resposta.situacoes || [];


    renderizarSecoes();

    renderizarSituacoes();


    /*
        USUÁRIO RESTRITO A UMA ÚNICA SEÇÃO
    */

    if (
        secoes.length === 1
    ) {

        elementos.secao.value =
            String(
                secoes[0].id
            );


        elementos.secao.disabled =
            true;

    }

}


/* =========================================================
   SEÇÕES
========================================================= */

function renderizarSecoes() {

    elementos.secao.innerHTML = `

        <option value="">
            Todas as seções
        </option>

        ${
            secoes
                .map(
                    secao => `

                        <option
                            value="${secao.id}"
                        >
                            ${escaparHTML(
                                secao.sigla
                            )}
                            -
                            ${escaparHTML(
                                secao.nome
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   SITUAÇÕES
========================================================= */

function renderizarSituacoes() {

    elementos.situacao.innerHTML = `

        <option value="">
            Todas as situações
        </option>

        ${
            situacoes
                .map(
                    situacao => `

                        <option
                            value="${situacao.id}"
                        >
                            ${escaparHTML(
                                situacao.nome
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   GERAR RELATÓRIO
========================================================= */

async function gerarRelatorio() {

    const dataInicio =
        elementos.dataInicio.value;


    const dataFim =
        elementos.dataFim.value;


    if (
        dataInicio &&
        dataFim &&
        dataInicio > dataFim
    ) {

        exibirMensagem(
            "A data inicial não pode ser maior que a data final.",
            "warning"
        );

        return;

    }


    try {

        definirCarregamento(
            true
        );


        ocultarMensagem();


        const resposta =
            await relatorioService.gerar({

                dataInicio:
                    dataInicio || null,

                dataFim:
                    dataFim || null,

                secaoId:
                    elementos.secao.value ||
                    null,

                situacaoId:
                    elementos.situacao.value ||
                    null

            });


        relatorioAtual =
            resposta;


        renderizarRelatorio();


        exibirMensagem(
            "Relatório gerado com sucesso.",
            "success"
        );


    } catch (erro) {

        console.error(
            "Erro ao gerar relatório:",
            erro
        );


        relatorioAtual =
            null;


        limparResultados();


        exibirMensagem(

            erro.message ||
            "Não foi possível gerar o relatório.",

            "error"

        );


    } finally {

        definirCarregamento(
            false
        );

    }

}


/* =========================================================
   RENDERIZAR RELATÓRIO
========================================================= */

function renderizarRelatorio() {

    if (!relatorioAtual) {

        return;

    }


    atualizarIndicadores();


    renderizarConsolidadoSecoes();


    renderizarConsolidadoSituacoes();


    renderizarRelacaoNominal();


    atualizarBotoesExportacao();

}


/* =========================================================
   INDICADORES
========================================================= */

function atualizarIndicadores() {

    const resumo =
        relatorioAtual?.resumo || {};


    elementos.totalRegistros.textContent =
        resumo.totalRegistros ?? 0;


    elementos.militaresDistintos.textContent =
        resumo.militaresDistintos ?? 0;


    elementos.totalDisponiveis.textContent =
        resumo.disponiveis ?? 0;


    elementos.totalIndisponiveis.textContent =
        resumo.indisponiveis ?? 0;


    elementos.totalChamadas.textContent =
        resumo.chamadas ?? 0;


    elementos.totalSecoes.textContent =
        resumo.secoes ?? 0;

}


/* =========================================================
   CONSOLIDADO POR SEÇÃO
========================================================= */

function renderizarConsolidadoSecoes() {

    const dados =
        relatorioAtual?.porSecao || [];


    if (
        dados.length === 0
    ) {

        elementos.tabelaSecoes.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="table-empty"
                >
                    Nenhum registro encontrado para as seções selecionadas.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabelaSecoes.innerHTML =
        dados
            .map(
                item => `

                    <tr>

                        <td>

                            <strong class="report-section">

                                ${escaparHTML(
                                    item
                                        .secao
                                        ?.sigla ||
                                    "—"
                                )}

                            </strong>

                            <br>

                            <small>

                                ${escaparHTML(
                                    item
                                        .secao
                                        ?.nome ||
                                    ""
                                )}

                            </small>

                        </td>


                        <td>

                            <span class="report-number">

                                ${item.total ?? 0}

                            </span>

                        </td>


                        <td>

                            <span class="value-available">

                                ${item.disponiveis ?? 0}

                            </span>

                        </td>


                        <td>

                            <span class="value-unavailable">

                                ${item.indisponiveis ?? 0}

                            </span>

                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   CONSOLIDADO POR SITUAÇÃO
========================================================= */

function renderizarConsolidadoSituacoes() {

    const dados =
        relatorioAtual?.porSituacao || [];


    if (
        dados.length === 0
    ) {

        elementos.tabelaSituacoes.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="table-empty"
                >
                    Nenhuma situação encontrada.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabelaSituacoes.innerHTML =
        dados
            .map(
                item => `

                    <tr>

                        <td>

                            <span class="situation-badge">

                                ${escaparHTML(
                                    item
                                        .situacao
                                        ?.nome ||
                                    "—"
                                )}

                            </span>

                        </td>


                        <td>

                            ${gerarCondicao(
                                item
                                    .situacao
                                    ?.disponivel ===
                                    true
                            )}

                        </td>


                        <td>

                            <strong class="report-number">

                                ${item.total ?? 0}

                            </strong>

                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   RELAÇÃO NOMINAL
========================================================= */

function renderizarRelacaoNominal() {

    const militares =
        relatorioAtual?.militares || [];


    elementos.totalNominal.textContent =
        String(
            militares.length
        );


    if (
        militares.length === 0
    ) {

        elementos.tabelaMilitares.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="table-empty"
                >
                    Nenhum militar encontrado para os filtros selecionados.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabelaMilitares.innerHTML =
        militares
            .map(
                item => {

                    const disponivel =
                        item
                            .situacao
                            ?.disponivel === true;


                    return `

                        <tr
                            class="${
                                disponivel
                                    ? "result-disponivel"
                                    : "result-indisponivel"
                            }"
                        >

                            <td>

                                <span class="report-date">

                                    ${formatarData(
                                        item.data
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="report-rank">

                                    ${escaparHTML(
                                        item
                                            .militar
                                            ?.postoGraduacao
                                            ?.sigla ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <td>

                                <div class="report-military">

                                    <strong>

                                        ${escaparHTML(
                                            item
                                                .militar
                                                ?.nomeGuerra ||
                                            "—"
                                        )}

                                    </strong>

                                    <small>

                                        ${escaparHTML(
                                            item
                                                .militar
                                                ?.nomeCompleto ||
                                            ""
                                        )}

                                    </small>

                                </div>

                            </td>


                            <td>

                                ${escaparHTML(
                                    item
                                        .militar
                                        ?.saram ||
                                    "—"
                                )}

                            </td>


                            <td>

                                <span class="report-section">

                                    ${escaparHTML(
                                        item
                                            .secao
                                            ?.sigla ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="situation-badge">

                                    ${escaparHTML(
                                        item
                                            .situacao
                                            ?.nome ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <td>

                                ${gerarCondicao(
                                    disponivel
                                )}

                            </td>


                            <td>

                                ${escaparHTML(
                                    item.observacao ||
                                    "—"
                                )}

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   CONDIÇÃO
========================================================= */

function gerarCondicao(
    disponivel
) {

    if (disponivel) {

        return `

            <span class="condition-badge disponivel">
                Disponível
            </span>

        `;

    }


    return `

        <span class="condition-badge indisponivel">
            Indisponível
        </span>

    `;

}


/* =========================================================
   BOTÕES DE EXPORTAÇÃO
========================================================= */

function atualizarBotoesExportacao() {

    const possuiDados =
        Boolean(
            relatorioAtual
        ) &&
        (
            relatorioAtual
                ?.militares
                ?.length ?? 0
        ) > 0;


    elementos.btnPdf.disabled =
        !possuiDados;


    elementos.btnPlanilha.disabled =
        !possuiDados;

}


/* =========================================================
   LIMPAR
========================================================= */

function limparRelatorio() {

    elementos.dataInicio.value =
        "";


    elementos.dataFim.value =
        "";


    elementos.situacao.value =
        "";


    if (
        !elementos.secao.disabled
    ) {

        elementos.secao.value =
            "";

    }


    relatorioAtual =
        null;


    limparResultados();


    ocultarMensagem();

}


/* =========================================================
   LIMPAR RESULTADOS
========================================================= */

function limparResultados() {

    elementos.totalRegistros.textContent =
        "0";


    elementos.militaresDistintos.textContent =
        "0";


    elementos.totalDisponiveis.textContent =
        "0";


    elementos.totalIndisponiveis.textContent =
        "0";


    elementos.totalChamadas.textContent =
        "0";


    elementos.totalSecoes.textContent =
        "0";


    elementos.totalNominal.textContent =
        "0";


    elementos.tabelaSecoes.innerHTML = `

        <tr>

            <td
                colspan="4"
                class="table-empty"
            >
                Gere um relatório para visualizar os dados.
            </td>

        </tr>

    `;


    elementos.tabelaSituacoes.innerHTML = `

        <tr>

            <td
                colspan="3"
                class="table-empty"
            >
                Gere um relatório para visualizar os dados.
            </td>

        </tr>

    `;


    elementos.tabelaMilitares.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="table-empty"
            >
                Gere um relatório para visualizar a relação nominal.
            </td>

        </tr>

    `;


    elementos.btnPdf.disabled =
        true;


    elementos.btnPlanilha.disabled =
        true;

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function definirCarregamento(
    carregando
) {

    elementos.btnGerar.disabled =
        carregando;


    elementos.btnLimpar.disabled =
        carregando;


    elementos.dataInicio.disabled =
        carregando;


    elementos.dataFim.disabled =
        carregando;


    elementos.situacao.disabled =
        carregando;


    /*
        Não desbloqueia seção que já esteja
        restrita ao usuário.
    */

    if (
        !(
            secoes.length === 1
        )
    ) {

        elementos.secao.disabled =
            carregando;

    }


    elementos.btnGerar.textContent =
        carregando
            ? "Gerando..."
            : "Gerar Relatório";

}


/* =========================================================
   MENSAGENS
========================================================= */

function exibirMensagem(
    mensagem,
    tipo = "success"
) {

    elementos.mensagem.textContent =
        mensagem;


    elementos.mensagem.className =
        `relatorio-message ${tipo}`;


    elementos.mensagem.hidden =
        false;

}


function ocultarMensagem() {

    elementos.mensagem.hidden =
        true;


    elementos.mensagem.textContent =
        "";

}


/* =========================================================
   FORMATAR DATA
========================================================= */

function formatarData(
    valor
) {

    if (!valor) {

        return "—";

    }


    const partes =
        String(valor)
            .split("-");


    if (
        partes.length !== 3
    ) {

        return valor;

    }


    const [
        ano,
        mes,
        dia
    ] = partes;


    return `${dia}/${mes}/${ano}`;

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(
    valor
) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}