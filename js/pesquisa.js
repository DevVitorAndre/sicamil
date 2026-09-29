import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    pesquisaService
} from "./services/pesquisaService.js";


/* =========================================================
   ESTADO
========================================================= */

let usuarioLogado = null;

let secoes = [];

let situacoes = [];

let resultados = [];

let paginaAtual = 1;

let totalPaginas = 1;

let totalResultados = 0;

let pesquisaRealizada = false;


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
                "PESQUISA_REALIZAR"
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
            "Erro ao iniciar Pesquisa:",
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
            "Não foi possível carregar a página de pesquisa.",

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
            "pesquisaMensagem"
        );


    elementos.totalResultados =
        document.getElementById(
            "totalResultados"
        );


    elementos.termo =
        document.getElementById(
            "termoPesquisa"
        );


    elementos.data =
        document.getElementById(
            "filtroData"
        );


    elementos.secao =
        document.getElementById(
            "filtroSecao"
        );


    elementos.situacao =
        document.getElementById(
            "filtroSituacao"
        );


    elementos.btnPesquisar =
        document.getElementById(
            "btnPesquisar"
        );


    elementos.btnLimpar =
        document.getElementById(
            "btnLimparPesquisa"
        );


    elementos.limitePagina =
        document.getElementById(
            "limitePagina"
        );


    elementos.tabela =
        document.getElementById(
            "tabelaPesquisa"
        );


    elementos.paginaAtual =
        document.getElementById(
            "paginaAtual"
        );


    elementos.totalPaginas =
        document.getElementById(
            "totalPaginas"
        );


    elementos.btnAnterior =
        document.getElementById(
            "btnPaginaAnterior"
        );


    elementos.btnProxima =
        document.getElementById(
            "btnProximaPagina"
        );

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnPesquisar
        ?.addEventListener(
            "click",
            executarPesquisa
        );


    elementos.btnLimpar
        ?.addEventListener(
            "click",
            limparPesquisa
        );


    /*
        ENTER NO CAMPO DE PESQUISA
    */

    elementos.termo
        ?.addEventListener(
            "keydown",
            async evento => {

                if (
                    evento.key === "Enter"
                ) {

                    evento.preventDefault();

                    await executarPesquisa();

                }

            }
        );


    /*
        ALTERAR QUANTIDADE POR PÁGINA
    */

    elementos.limitePagina
        ?.addEventListener(
            "change",
            async () => {

                if (
                    !pesquisaRealizada
                ) {

                    return;

                }


                paginaAtual = 1;


                await pesquisar();

            }
        );


    /*
        PÁGINA ANTERIOR
    */

    elementos.btnAnterior
        ?.addEventListener(
            "click",
            async () => {

                if (
                    paginaAtual <= 1
                ) {

                    return;

                }


                paginaAtual--;


                await pesquisar();

            }
        );


    /*
        PRÓXIMA PÁGINA
    */

    elementos.btnProxima
        ?.addEventListener(
            "click",
            async () => {

                if (
                    paginaAtual >=
                    totalPaginas
                ) {

                    return;

                }


                paginaAtual++;


                await pesquisar();

            }
        );

}


/* =========================================================
   CARREGAR OPÇÕES
========================================================= */

async function carregarOpcoes() {

    const resposta =
        await pesquisaService.buscarOpcoes();


    secoes =
        resposta.secoes || [];


    situacoes =
        resposta.situacoes || [];


    renderizarSecoes();

    renderizarSituacoes();


    /*
        USUÁRIO COM APENAS UMA SEÇÃO DISPONÍVEL
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
   EXECUTAR PESQUISA
========================================================= */

async function executarPesquisa() {

    paginaAtual = 1;

    pesquisaRealizada = true;


    await pesquisar();

}


/* =========================================================
   PESQUISAR
========================================================= */

async function pesquisar() {

    try {

        definirCarregamento(
            true
        );


        ocultarMensagem();


        const resposta =
            await pesquisaService.pesquisar({

                termo:
                    elementos.termo.value
                        .trim() ||
                    null,

                data:
                    elementos.data.value ||
                    null,

                secaoId:
                    elementos.secao.value ||
                    null,

                situacaoId:
                    elementos.situacao.value ||
                    null,

                pagina:
                    paginaAtual,

                limite:
                    Number(
                        elementos
                            .limitePagina
                            .value
                    ) || 20

            });


        resultados =
            resposta.resultados || [];


        paginaAtual =
            resposta.paginacao?.pagina ||
            1;


        totalResultados =
            resposta.paginacao?.total ||
            0;


        totalPaginas =
            resposta.paginacao
                ?.totalPaginas || 1;


        renderizarResultados();

        atualizarPaginacao();


        elementos.totalResultados
            .textContent =
                String(
                    totalResultados
                );


    } catch (erro) {

        console.error(
            "Erro na pesquisa:",
            erro
        );


        resultados = [];

        totalResultados = 0;

        totalPaginas = 1;


        elementos.totalResultados
            .textContent =
                "0";


        renderizarResultados();

        atualizarPaginacao();


        exibirMensagem(

            erro.message ||
            "Não foi possível realizar a pesquisa.",

            "error"

        );


    } finally {

        definirCarregamento(
            false
        );

    }

}


/* =========================================================
   RENDERIZAR RESULTADOS
========================================================= */

function renderizarResultados() {

    if (
        resultados.length === 0
    ) {

        elementos.tabela.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="table-empty"
                >
                    Nenhum resultado encontrado.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabela.innerHTML =
        resultados
            .map(
                resultado => {

                    const disponivel =
                        resultado
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


                            <!-- DATA -->

                            <td>

                                <span class="search-date">

                                    ${formatarData(
                                        resultado
                                            .chamada
                                            ?.data
                                    )}

                                </span>

                            </td>


                            <!-- PT / GRAD -->

                            <td>

                                <span class="search-rank">

                                    ${escaparHTML(
                                        resultado
                                            .militar
                                            ?.postoGraduacao
                                            ?.sigla ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <!-- MILITAR -->

                            <td>

                                <div class="search-military">

                                    <strong>

                                        ${escaparHTML(
                                            resultado
                                                .militar
                                                ?.nomeGuerra ||
                                            "—"
                                        )}

                                    </strong>


                                    <small>

                                        ${escaparHTML(
                                            resultado
                                                .militar
                                                ?.nomeCompleto ||
                                            ""
                                        )}

                                    </small>

                                </div>

                            </td>


                            <!-- SARAM -->

                            <td>

                                <span class="search-saram">

                                    ${escaparHTML(
                                        resultado
                                            .militar
                                            ?.saram ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <!-- SEÇÃO -->

                            <td>

                                <span class="search-section">

                                    ${escaparHTML(
                                        resultado
                                            .secao
                                            ?.sigla ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <!-- SITUAÇÃO -->

                            <td>

                                <span class="situation-badge">

                                    ${escaparHTML(
                                        resultado
                                            .situacao
                                            ?.nome ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <!-- CONDIÇÃO -->

                            <td>

                                ${gerarCondicao(
                                    disponivel
                                )}

                            </td>


                            <!-- OBSERVAÇÃO -->

                            <td>

                                <span class="search-observation">

                                    ${escaparHTML(
                                        resultado
                                            .observacao ||
                                        "—"
                                    )}

                                </span>

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
   LIMPAR
========================================================= */

function limparPesquisa() {

    elementos.termo.value =
        "";


    elementos.data.value =
        "";


    elementos.situacao.value =
        "";


    /*
        Se estiver bloqueado,
        mantém a seção do usuário.
    */

    if (
        !elementos.secao.disabled
    ) {

        elementos.secao.value =
            "";

    }


    resultados = [];

    paginaAtual = 1;

    totalPaginas = 1;

    totalResultados = 0;

    pesquisaRealizada = false;


    elementos.totalResultados
        .textContent =
            "0";


    elementos.paginaAtual
        .textContent =
            "1";


    elementos.totalPaginas
        .textContent =
            "1";


    elementos.btnAnterior.disabled =
        true;


    elementos.btnProxima.disabled =
        true;


    elementos.tabela.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="table-empty"
            >
                Utilize os filtros acima para consultar o efetivo.
            </td>

        </tr>

    `;


    ocultarMensagem();


    elementos.termo.focus();

}


/* =========================================================
   PAGINAÇÃO
========================================================= */

function atualizarPaginacao() {

    const paginas =
        Math.max(
            totalPaginas,
            1
        );


    elementos.paginaAtual
        .textContent =
            String(
                paginaAtual
            );


    elementos.totalPaginas
        .textContent =
            String(
                paginas
            );


    elementos.btnAnterior.disabled =
        paginaAtual <= 1;


    elementos.btnProxima.disabled =
        paginaAtual >= paginas;

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function definirCarregamento(
    carregando
) {

    elementos.btnPesquisar.disabled =
        carregando;


    elementos.btnLimpar.disabled =
        carregando;


    elementos.limitePagina.disabled =
        carregando;


    if (carregando) {

        elementos.btnPesquisar
            .textContent =
                "Pesquisando...";

    } else {

        elementos.btnPesquisar
            .textContent =
                "Pesquisar";

    }

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
        `pesquisa-message ${tipo}`;


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
   DATA
========================================================= */

function formatarData(
    data
) {

    if (!data) {

        return "—";

    }


    const partes =
        String(data)
            .split("-");


    if (
        partes.length !== 3
    ) {

        return data;

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