import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    dashboardService
} from "./services/dashboardService.js";

import {
    formatarNumero
} from "./utils/formatters.js";


document.addEventListener(
    "DOMContentLoaded",
    iniciarDashboard
);


/* =========================================================
   INICIAR DASHBOARD
========================================================= */

async function iniciarDashboard() {

    try {

        /*
            Primeiro confirma a sessão REAL
            diretamente com o backend.
        */

        await authService.usuarioAtual();


        /*
            Depois carregamos sidebar e header.

            Nesse ponto o sessionService já possui
            o usuário validado pelo servidor.
        */

        await carregarComponentes();


        exibirCarregamento();


        /*
            Busca os dados reais do dashboard.
        */

        const dashboard =
            await dashboardService.buscar();


        renderizarDashboard(
            dashboard
        );


    } catch (erro) {

        console.error(
            "Erro ao iniciar Dashboard:",
            erro
        );


        /*
            401 = usuário não autenticado
        */

        if (
            erro.status === 401
        ) {

            window.location.href =
                "index.html";

            return;

        }


        exibirErro(
            erro.message ||
            "Não foi possível carregar o Dashboard."
        );

    }

}


/* =========================================================
   RENDERIZAÇÃO PRINCIPAL
========================================================= */

function renderizarDashboard(
    dashboard
) {

    preencherValor(
        "efetivoTotal",
        dashboard.resumo
            ?.efetivoTotal
    );


    preencherValor(
        "presentesHoje",
        dashboard.resumo
            ?.presentesHoje
    );


    preencherValor(
        "naoDisponiveis",
        dashboard.resumo
            ?.naoDisponiveis
    );


    preencherValor(
        "secoesPendentes",
        dashboard.resumo
            ?.secoesPendentes
    );


    preencherValor(
        "secoesConcluidas",
        dashboard.resumo
            ?.secoesConcluidas
    );


    renderizarEfetivoPorSecao(
        dashboard.efetivoPorSecao
    );


    renderizarSituacoes(
        dashboard.situacoes
    );


    renderizarChamadas(
        dashboard.chamadas
    );


    renderizarPresentes(
        dashboard.presentes
    );

}


/* =========================================================
   EFETIVO POR SEÇÃO
========================================================= */

function renderizarEfetivoPorSecao(
    dados = []
) {

    const container =
        document.getElementById(
            "graficoEfetivoSecao"
        );


    if (!container) {

        return;

    }


    if (
        !Array.isArray(dados) ||
        dados.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum dado disponível.
            </div>
        `;

        return;

    }


    const maiorValor =
        Math.max(
            ...dados.map(
                (item) =>
                    Number(
                        item.total || 0
                    )
            )
        );


    container.innerHTML =
        dados
            .map(
                (item) => {

                    const total =
                        Number(
                            item.total || 0
                        );


                    const percentual =
                        maiorValor > 0
                            ? (
                                total /
                                maiorValor
                            ) * 100
                            : 0;


                    return `
                        <div class="bar-item">

                            <span class="bar-value">
                                ${formatarNumero(total)}
                            </span>

                            <div
                                class="bar"
                                style="
                                    --valor:
                                    ${percentual}%;
                                "
                            ></div>

                            <small>
                                ${escaparHTML(
                                    item.sigla ||
                                    item.nome ||
                                    "—"
                                )}
                            </small>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   SITUAÇÕES
========================================================= */

function renderizarSituacoes(
    dados = []
) {

    const totalElemento =
        document.getElementById(
            "situacoesTotal"
        );


    const legenda =
        document.getElementById(
            "situacoesLegenda"
        );


    const grafico =
        document.getElementById(
            "graficoSituacoes"
        );


    if (
        !totalElemento ||
        !legenda ||
        !grafico
    ) {

        return;

    }


    if (
        !Array.isArray(dados) ||
        dados.length === 0
    ) {

        totalElemento.textContent =
            "—";


        legenda.innerHTML = `
            <div class="empty-state">
                Nenhum dado disponível.
            </div>
        `;


        grafico.style.background =
            "#e1e9f0";


        return;

    }


    const total =
        dados.reduce(
            (
                soma,
                item
            ) =>
                soma +
                Number(
                    item.total || 0
                ),
            0
        );


    totalElemento.textContent =
        formatarNumero(
            total
        );


    legenda.innerHTML =
        dados
            .map(
                (item) => `
                    <div class="legend-item">

                        <span
                            class="dot"
                            style="
                                background:
                                ${item.cor || "#7f9bb5"};
                            "
                        ></span>

                        <div>

                            <strong>
                                ${escaparHTML(
                                    item.nome ||
                                    "Situação"
                                )}
                            </strong>

                            <small>
                                ${formatarNumero(
                                    item.total
                                )}
                            </small>

                        </div>

                    </div>
                `
            )
            .join("");

}


/* =========================================================
   CHAMADAS
========================================================= */

function renderizarChamadas(
    chamadas = []
) {

    const container =
        document.getElementById(
            "listaChamadas"
        );


    if (!container) {

        return;

    }


    if (
        !Array.isArray(chamadas) ||
        chamadas.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma chamada disponível.
            </div>
        `;

        return;

    }


    container.innerHTML =
        chamadas
            .map(
                (chamada) => {

                    const status =
                        normalizarStatus(
                            chamada.status
                        );


                    return `
                        <div class="call-row">

                            <span>
                                ${escaparHTML(
                                    chamada.secao
                                        ?.sigla ||
                                    chamada.secao
                                        ?.nome ||
                                    "—"
                                )}
                            </span>

                            <span
                                class="
                                    status
                                    ${status.classe}
                                "
                            >
                                ${status.texto}
                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   PRESENTES
========================================================= */

function renderizarPresentes(
    militares = []
) {

    const tbody =
        document.getElementById(
            "tabelaPresentes"
        );


    if (!tbody) {

        return;

    }


    if (
        !Array.isArray(militares) ||
        militares.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-empty"
                >
                    Nenhum militar disponível.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        militares
            .map(
                (militar) => `
                    <tr>

                        <td>
                            ${escaparHTML(
                                militar.postoGraduacao ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                militar.nomeGuerra ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                militar.secao?.sigla ||
                                militar.secao?.nome ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                militar.situacao?.nome ||
                                militar.situacao ||
                                "—"
                            )}
                        </td>

                    </tr>
                `
            )
            .join("");

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function exibirCarregamento() {

    [

        "efetivoTotal",
        "presentesHoje",
        "naoDisponiveis",
        "secoesPendentes",
        "secoesConcluidas"

    ].forEach(
        (id) => {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento.textContent =
                    "...";

            }

        }
    );

}


/* =========================================================
   ERRO
========================================================= */

function exibirErro(
    mensagem
) {

    const elemento =
        document.getElementById(
            "dashboardMensagem"
        );


    if (!elemento) {

        return;

    }


    elemento.textContent =
        mensagem;


    elemento.hidden =
        false;

}


/* =========================================================
   VALORES
========================================================= */

function preencherValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) {

        return;

    }


    elemento.textContent =
        valor === null ||
        valor === undefined
            ? "—"
            : formatarNumero(
                valor
            );

}


/* =========================================================
   STATUS
========================================================= */

function normalizarStatus(
    status
) {

    switch (status) {

        case "REALIZADA":

            return {

                texto:
                    "Realizada",

                classe:
                    "success"

            };


        case "EM_ANDAMENTO":

            return {

                texto:
                    "Em andamento",

                classe:
                    "progress"

            };


        case "PENDENTE":

            return {

                texto:
                    "Pendente",

                classe:
                    "pending"

            };


        default:

            return {

                texto:
                    status ||
                    "—",

                classe:
                    ""

            };

    }

}


/* =========================================================
   SEGURANÇA HTML
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
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}