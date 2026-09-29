import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    registroService
} from "./services/registroService.js";


/* =========================================================
   ESTADO
========================================================= */

let usuarioLogado = null;

let registros = [];

let secoes = [];

let paginaAtual = 1;

let totalPaginas = 1;

let totalRegistros = 0;


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
                "REGISTROS_VISUALIZAR"
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

        await carregarRegistros();


    } catch (erro) {

        console.error(
            "Erro ao iniciar Registros:",
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
            "Não foi possível carregar os registros.",

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
            "registroMensagem"
        );


    elementos.totalRegistros =
        document.getElementById(
            "totalRegistros"
        );


    elementos.dataInicio =
        document.getElementById(
            "filtroDataInicio"
        );


    elementos.dataFim =
        document.getElementById(
            "filtroDataFim"
        );


    elementos.secao =
        document.getElementById(
            "filtroSecao"
        );


    elementos.grupoSecao =
        document.getElementById(
            "grupoFiltroSecao"
        );


    elementos.status =
        document.getElementById(
            "filtroStatus"
        );


    elementos.btnFiltrar =
        document.getElementById(
            "btnFiltrar"
        );


    elementos.btnLimpar =
        document.getElementById(
            "btnLimparFiltros"
        );


    elementos.limitePagina =
        document.getElementById(
            "limitePagina"
        );


    elementos.tabela =
        document.getElementById(
            "tabelaRegistros"
        );


    elementos.indicadorTotal =
        document.getElementById(
            "indicadorTotal"
        );


    elementos.indicadorRealizadas =
        document.getElementById(
            "indicadorRealizadas"
        );


    elementos.indicadorAndamento =
        document.getElementById(
            "indicadorAndamento"
        );


    elementos.indicadorPendentes =
        document.getElementById(
            "indicadorPendentes"
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


    /* MODAL */

    elementos.modal =
        document.getElementById(
            "modalRegistro"
        );


    elementos.btnFecharModal =
        document.getElementById(
            "btnFecharModal"
        );


    elementos.btnFecharModalRodape =
        document.getElementById(
            "btnFecharModalRodape"
        );


    elementos.tituloModal =
        document.getElementById(
            "tituloModalRegistro"
        );


    elementos.subtituloModal =
        document.getElementById(
            "subtituloModalRegistro"
        );


    elementos.detalheData =
        document.getElementById(
            "detalheData"
        );


    elementos.detalheSecao =
        document.getElementById(
            "detalheSecao"
        );


    elementos.detalheResponsavel =
        document.getElementById(
            "detalheResponsavel"
        );


    elementos.detalheStatus =
        document.getElementById(
            "detalheStatus"
        );


    elementos.detalheRegistrados =
        document.getElementById(
            "detalheRegistrados"
        );


    elementos.detalheDisponiveis =
        document.getElementById(
            "detalheDisponiveis"
        );


    elementos.detalheIndisponiveis =
        document.getElementById(
            "detalheIndisponiveis"
        );


    elementos.detalheInicio =
        document.getElementById(
            "detalheInicio"
        );


    elementos.detalheConclusao =
        document.getElementById(
            "detalheConclusao"
        );


    elementos.tabelaDetalhes =
        document.getElementById(
            "tabelaDetalhes"
        );

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnFiltrar
        ?.addEventListener(
            "click",
            aplicarFiltros
        );


    elementos.btnLimpar
        ?.addEventListener(
            "click",
            limparFiltros
        );


    elementos.limitePagina
        ?.addEventListener(
            "change",
            async () => {

                paginaAtual = 1;

                await carregarRegistros();

            }
        );


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


                await carregarRegistros();

            }
        );


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


                await carregarRegistros();

            }
        );


    elementos.tabela
        ?.addEventListener(
            "click",
            tratarCliqueTabela
        );


    elementos.btnFecharModal
        ?.addEventListener(
            "click",
            fecharModal
        );


    elementos.btnFecharModalRodape
        ?.addEventListener(
            "click",
            fecharModal
        );


    elementos.modal
        ?.addEventListener(
            "click",
            evento => {

                if (
                    evento.target ===
                    elementos.modal
                ) {

                    fecharModal();

                }

            }
        );


    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape" &&
                !elementos.modal.hidden
            ) {

                fecharModal();

            }

        }
    );

}


/* =========================================================
   OPÇÕES
========================================================= */

async function carregarOpcoes() {

    const resposta =
        await registroService.buscarOpcoes();


    secoes =
        resposta.secoes || [];


    renderizarSecoes();


    /*
        Se o usuário só puder visualizar
        uma seção, deixamos ela selecionada
        e bloqueada.
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
   CARREGAR REGISTROS
========================================================= */

async function carregarRegistros() {

    try {

        definirCarregamento(
            true
        );


        ocultarMensagem();


        const resposta =
            await registroService.listar({

                dataInicio:
                    elementos.dataInicio.value ||
                    null,

                dataFim:
                    elementos.dataFim.value ||
                    null,

                secaoId:
                    elementos.secao.value ||
                    null,

                status:
                    elementos.status.value ||
                    null,

                pagina:
                    paginaAtual,

                limite:
                    Number(
                        elementos.limitePagina.value
                    ) || 20

            });


        registros =
            resposta.registros || [];


        paginaAtual =
            resposta.paginacao?.pagina ||
            1;


        totalPaginas =
            resposta.paginacao
                ?.totalPaginas || 1;


        totalRegistros =
            resposta.paginacao?.total || 0;


        renderizarRegistros();


        atualizarResumo(
            resposta.resumo
        );


        atualizarPaginacao();


    } catch (erro) {

        console.error(
            "Erro ao carregar registros:",
            erro
        );


        registros = [];


        renderizarRegistros();


        zerarIndicadores();


        exibirMensagem(

            erro.message ||
            "Não foi possível carregar os registros.",

            "error"

        );


    } finally {

        definirCarregamento(
            false
        );

    }

}


/* =========================================================
   RENDERIZAR TABELA
========================================================= */

function renderizarRegistros() {

    if (
        registros.length === 0
    ) {

        elementos.tabela.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="table-empty"
                >
                    Nenhum registro de chamada encontrado.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabela.innerHTML =
        registros
            .map(
                registro => `

                    <tr>

                        <td>

                            <span class="record-date">

                                ${formatarData(
                                    registro.data
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="record-section">

                                ${escaparHTML(
                                    registro
                                        .secao
                                        ?.sigla ||
                                    "—"
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="record-responsible">

                                ${escaparHTML(
                                    obterNomeResponsavel(
                                        registro
                                            .responsavel
                                            ?.nome
                                    )
                                )}

                            </span>

                        </td>


                        <td>

                            ${gerarBadgeStatus(
                                registro.status
                            )}

                        </td>


                        <td>

                            <span class="record-number">

                                ${registro
                                    .totais
                                    ?.registrados ?? 0}

                            </span>

                        </td>


                        <td>

                            <span class="value-available">

                                ${registro
                                    .totais
                                    ?.disponiveis ?? 0}

                            </span>

                        </td>


                        <td>

                            <span class="value-unavailable">

                                ${registro
                                    .totais
                                    ?.indisponiveis ?? 0}

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="btn-details"
                                data-acao="detalhar"
                                data-id="${registro.id}"
                            >
                                Ver detalhes
                            </button>

                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   FILTROS
========================================================= */

async function aplicarFiltros() {

    const inicio =
        elementos.dataInicio.value;


    const fim =
        elementos.dataFim.value;


    if (
        inicio &&
        fim &&
        inicio > fim
    ) {

        exibirMensagem(
            "A data inicial não pode ser maior que a data final.",
            "warning"
        );

        return;

    }


    paginaAtual = 1;


    await carregarRegistros();

}


async function limparFiltros() {

    elementos.dataInicio.value =
        "";


    elementos.dataFim.value =
        "";


    elementos.status.value =
        "";


    /*
        Só limpa seção quando ela não
        estiver bloqueada para o usuário.
    */

    if (
        !elementos.secao.disabled
    ) {

        elementos.secao.value =
            "";

    }


    paginaAtual = 1;


    await carregarRegistros();

}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumo(
    resumo = {}
) {

    elementos.totalRegistros.textContent =
        resumo.total ??
        totalRegistros;


    elementos.indicadorTotal.textContent =
        resumo.total ??
        totalRegistros;


    elementos.indicadorRealizadas.textContent =
        resumo.realizadas ?? 0;


    elementos.indicadorAndamento.textContent =
        resumo.emAndamento ?? 0;


    elementos.indicadorPendentes.textContent =
        resumo.pendentes ?? 0;

}


function zerarIndicadores() {

    elementos.totalRegistros.textContent =
        "0";


    elementos.indicadorTotal.textContent =
        "0";


    elementos.indicadorRealizadas.textContent =
        "0";


    elementos.indicadorAndamento.textContent =
        "0";


    elementos.indicadorPendentes.textContent =
        "0";

}


/* =========================================================
   PAGINAÇÃO
========================================================= */

function atualizarPaginacao() {

    /*
        Banco vazio = visualmente página 1 de 1
    */

    const paginasExibidas =
        Math.max(
            totalPaginas,
            1
        );


    elementos.paginaAtual.textContent =
        String(
            paginaAtual
        );


    elementos.totalPaginas.textContent =
        String(
            paginasExibidas
        );


    elementos.btnAnterior.disabled =
        paginaAtual <= 1;


    elementos.btnProxima.disabled =
        paginaAtual >= paginasExibidas;

}


/* =========================================================
   CLIQUE DA TABELA
========================================================= */

async function tratarCliqueTabela(
    evento
) {

    const botao =
        evento.target.closest(
            "[data-acao='detalhar']"
        );


    if (!botao) {

        return;

    }


    const id =
        botao.dataset.id;


    await abrirDetalhes(
        id
    );

}


/* =========================================================
   DETALHES
========================================================= */

async function abrirDetalhes(
    id
) {

    try {

        abrirModalCarregando();


        const resposta =
            await registroService
                .buscarPorId(
                    id
                );


        renderizarDetalhes(
            resposta
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar detalhes:",
            erro
        );


        fecharModal();


        exibirMensagem(

            erro.message ||
            "Não foi possível carregar os detalhes da chamada.",

            "error"

        );

    }

}


/* =========================================================
   MODAL CARREGANDO
========================================================= */

function abrirModalCarregando() {

    elementos.modal.hidden =
        false;


    document.body.style.overflow =
        "hidden";


    elementos.tituloModal.textContent =
        "Registro de Chamada";


    elementos.subtituloModal.textContent =
        "Carregando informações...";


    elementos.detalheData.textContent =
        "—";


    elementos.detalheSecao.textContent =
        "—";


    elementos.detalheResponsavel.textContent =
        "—";


    elementos.detalheStatus.innerHTML =
        "—";


    elementos.detalheRegistrados.textContent =
        "0";


    elementos.detalheDisponiveis.textContent =
        "0";


    elementos.detalheIndisponiveis.textContent =
        "0";


    elementos.detalheInicio.textContent =
        "—";


    elementos.detalheConclusao.textContent =
        "—";


    elementos.tabelaDetalhes.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-empty"
            >
                Carregando detalhes...
            </td>

        </tr>

    `;

}


/* =========================================================
   RENDERIZAR DETALHES
========================================================= */

function renderizarDetalhes(
    resposta
) {

    const chamada =
        resposta.chamada;


    const militares =
        resposta.militares || [];


    const totais =
        resposta.totais || {};


    elementos.tituloModal.textContent =
        `Chamada - ${chamada.secao.sigla}`;


    elementos.subtituloModal.textContent =
        chamada.secao.nome;


    elementos.detalheData.textContent =
        formatarData(
            chamada.data
        );


    elementos.detalheSecao.textContent =
        chamada.secao.sigla;


    elementos.detalheResponsavel.textContent =
        obterNomeResponsavel(
            chamada.responsavel?.nome
        );


    elementos.detalheStatus.innerHTML =
        gerarBadgeStatus(
            chamada.status
        );


    elementos.detalheRegistrados.textContent =
        totais.registrados ?? 0;


    elementos.detalheDisponiveis.textContent =
        totais.disponiveis ?? 0;


    elementos.detalheIndisponiveis.textContent =
        totais.indisponiveis ?? 0;


    elementos.detalheInicio.textContent =
        formatarDataHora(
            chamada.dataHoraInicio
        );


    elementos.detalheConclusao.textContent =
        chamada.dataHoraConclusao
            ? formatarDataHora(
                chamada.dataHoraConclusao
            )
            : "Não concluída";


    renderizarMilitaresDetalhe(
        militares
    );

}


/* =========================================================
   MILITARES DO DETALHE
========================================================= */

function renderizarMilitaresDetalhe(
    militares
) {

    if (
        militares.length === 0
    ) {

        elementos.tabelaDetalhes.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="table-empty"
                >
                    Nenhum militar registrado nesta chamada.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabelaDetalhes.innerHTML =
        militares
            .map(
                item => `

                    <tr>

                        <td>

                            <strong class="record-section">

                                ${escaparHTML(
                                    item
                                        .militar
                                        ?.postoGraduacao
                                        ?.sigla ||
                                    "—"
                                )}

                            </strong>

                        </td>


                        <td>

                            <div>

                                <strong>

                                    ${escaparHTML(
                                        item
                                            .militar
                                            ?.nomeGuerra ||
                                        "—"
                                    )}

                                </strong>

                                <br>

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

                            <strong>

                                ${escaparHTML(
                                    item
                                        .situacao
                                        ?.nome ||
                                    "—"
                                )}

                            </strong>

                        </td>


                        <td>

                            ${gerarCondicao(
                                item
                                    .situacao
                                    ?.disponivel
                            )}

                        </td>


                        <td>

                            ${escaparHTML(
                                item.observacao ||
                                "—"
                            )}

                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   FECHAR MODAL
========================================================= */

function fecharModal() {

    elementos.modal.hidden =
        true;


    document.body.style.overflow =
        "";

}


/* =========================================================
   STATUS
========================================================= */

function gerarBadgeStatus(
    status
) {

    switch (status) {

        case "REALIZADA":

            return `

                <span class="status-badge realizada">
                    Realizada
                </span>

            `;


        case "EM_ANDAMENTO":

            return `

                <span class="status-badge andamento">
                    Em andamento
                </span>

            `;


        case "PENDENTE":

            return `

                <span class="status-badge pendente">
                    Pendente
                </span>

            `;


        default:

            return `

                <span class="status-badge pendente">

                    ${escaparHTML(
                        status || "—"
                    )}

                </span>

            `;

    }

}


/* =========================================================
   CONDIÇÃO
========================================================= */

function gerarCondicao(
    disponivel
) {

    if (
        disponivel === true
    ) {

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
   RESPONSÁVEL
========================================================= */

function obterNomeResponsavel(
    nome
) {

    if (!nome) {

        return "—";

    }


    return nome;

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
        data.split("-");


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
   DATA E HORA
========================================================= */

function formatarDataHora(
    valor
) {

    if (!valor) {

        return "—";

    }


    const data =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "pt-BR",
        {

            timeZone:
                "America/Sao_Paulo",

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                "2-digit"

        }
    ).format(
        data
    );

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function definirCarregamento(
    carregando
) {

    elementos.btnFiltrar.disabled =
        carregando;


    elementos.btnLimpar.disabled =
        carregando;


    elementos.limitePagina.disabled =
        carregando;


    if (carregando) {

        elementos.btnFiltrar.textContent =
            "Carregando...";

    } else {

        elementos.btnFiltrar.textContent =
            "Filtrar";

    }

}


/* =========================================================
   MENSAGEM
========================================================= */

function exibirMensagem(
    mensagem,
    tipo = "success"
) {

    elementos.mensagem.textContent =
        mensagem;


    elementos.mensagem.className =
        `registro-message ${tipo}`;


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