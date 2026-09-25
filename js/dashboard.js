import { carregarComponentes } from "./components.js";

import { dashboardService } from "./services/dashboardService.js";

import { formatarNumero } from "./utils/formatters.js";


document.addEventListener(
    "DOMContentLoaded",
    iniciarDashboard
);


async function iniciarDashboard() {

    await carregarComponentes();


    exibirCarregamento();


    try {

        const dashboard =
            await dashboardService
                .buscar();


        renderizarDashboard(
            dashboard
        );

    } catch (erro) {

        console.error(erro);


        exibirErro(
            erro.message
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderizarDashboard(
    dashboard
) {

    renderizarResumo(
        dashboard.resumo
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
   CARDS
========================================================= */

function renderizarResumo(
    resumo
) {

    preencherTexto(
        "efetivoTotal",
        formatarNumero(
            resumo.efetivoTotal
        )
    );


    preencherTexto(
        "presentesHoje",
        formatarNumero(
            resumo.presentesHoje
        )
    );


    preencherTexto(
        "naoDisponiveis",
        formatarNumero(
            resumo.naoDisponiveis
        )
    );


    preencherTexto(
        "secoesPendentes",
        formatarNumero(
            resumo.secoesPendentes
        )
    );


    preencherTexto(
        "secoesConcluidas",
        formatarNumero(
            resumo.secoesConcluidas
        )
    );

}


/* =========================================================
   EFETIVO POR SEÇÃO
========================================================= */

function renderizarEfetivoPorSecao(
    secoes
) {

    const container =
        document.getElementById(
            "graficoEfetivoSecao"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(secoes) ||
        secoes.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Nenhuma informação de efetivo disponível."
            );

        return;

    }


    const maiorValor =
        Math.max(
            ...secoes.map(
                item =>
                    Number(item.total) || 0
            ),
            1
        );


    secoes.forEach(
        item => {

            const total =
                Number(item.total) || 0;


            const percentual =
                (
                    total /
                    maiorValor
                ) * 100;


            const elemento =
                document.createElement(
                    "div"
                );


            elemento.className =
                "bar-item";


            elemento.innerHTML =
                `
                    <span class="bar-value">
                        ${formatarNumero(total)}
                    </span>

                    <div
                        class="bar"
                        style="--valor: ${percentual}%"
                    ></div>

                    <small>
                        ${escaparHTML(
                            item.sigla || "—"
                        )}
                    </small>
                `;


            container.appendChild(
                elemento
            );

        }
    );

}


/* =========================================================
   SITUAÇÕES
========================================================= */

function renderizarSituacoes(
    situacoes
) {

    const totalElemento =
        document.getElementById(
            "situacoesTotal"
        );


    const legenda =
        document.getElementById(
            "situacoesLegenda"
        );


    if (!legenda) {
        return;
    }


    legenda.innerHTML = "";


    if (
        !Array.isArray(situacoes) ||
        situacoes.length === 0
    ) {

        if (totalElemento) {

            totalElemento.textContent =
                "—";

        }


        legenda.innerHTML =
            criarEstadoVazio(
                "Nenhuma situação registrada."
            );


        return;

    }


    const total =
        situacoes.reduce(

            (soma, item) =>
                soma +
                (
                    Number(
                        item.total
                    ) || 0
                ),

            0

        );


    if (totalElemento) {

        totalElemento.textContent =
            formatarNumero(total);

    }


    situacoes.forEach(
        item => {

            const linha =
                document.createElement(
                    "div"
                );


            linha.className =
                "legend-item";


            linha.innerHTML =
                `
                    <span
                        class="dot"
                        style="
                            background:
                            ${item.cor || "#8495a8"}
                        "
                    ></span>

                    <div>
                        <strong>
                            ${formatarNumero(item.total)}
                        </strong>

                        <small>
                            ${escaparHTML(
                                item.nome || "—"
                            )}
                        </small>
                    </div>
                `;


            legenda.appendChild(
                linha
            );

        }
    );

}


/* =========================================================
   CHAMADAS
========================================================= */

function renderizarChamadas(
    chamadas
) {

    const container =
        document.getElementById(
            "listaChamadas"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !Array.isArray(chamadas) ||
        chamadas.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Nenhuma chamada registrada hoje."
            );

        return;

    }


    chamadas.forEach(
        chamada => {

            const linha =
                document.createElement(
                    "div"
                );


            linha.className =
                "call-row";


            const status =
                normalizarStatus(
                    chamada.status
                );


            linha.innerHTML =
                `
                    <span>
                        ${
                            escaparHTML(
                                chamada.secao?.sigla ||
                                chamada.secao?.nome ||
                                "—"
                            )
                        }
                    </span>

                    <span
                        class="
                            status
                            ${status.classe}
                        "
                    >
                        ${status.texto}
                    </span>
                `;


            container.appendChild(
                linha
            );

        }
    );

}


/* =========================================================
   PRESENTES
========================================================= */

function renderizarPresentes(
    militares
) {

    const tabela =
        document.getElementById(
            "tabelaPresentes"
        );


    if (!tabela) {
        return;
    }


    tabela.innerHTML = "";


    if (
        !Array.isArray(militares) ||
        militares.length === 0
    ) {

        tabela.innerHTML =
            `
                <tr>
                    <td
                        colspan="4"
                        class="table-empty"
                    >
                        Nenhum militar disponível para exibição.
                    </td>
                </tr>
            `;

        return;

    }


    militares.forEach(
        militar => {

            const linha =
                document.createElement(
                    "tr"
                );


            linha.innerHTML =
                `
                    <td>
                        ${escaparHTML(
                            militar.postoGraduacao || "—"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            militar.nomeGuerra || "—"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            militar.secao?.sigla || "—"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            militar.situacao?.nome ||
                            militar.situacao ||
                            "—"
                        )}
                    </td>
                `;


            tabela.appendChild(
                linha
            );

        }
    );

}


/* =========================================================
   ESTADO DE CARREGAMENTO
========================================================= */

function exibirCarregamento() {

    const ids = [

        "efetivoTotal",

        "presentesHoje",

        "naoDisponiveis",

        "secoesPendentes",

        "secoesConcluidas"

    ];


    ids.forEach(
        id => {

            preencherTexto(
                id,
                "..."
            );

        }
    );

}


/* =========================================================
   ERRO
========================================================= */

function exibirErro(
    mensagem
) {

    const container =
        document.getElementById(
            "dashboardMensagem"
        );


    if (!container) {

        console.error(
            mensagem
        );

        return;

    }


    container.hidden =
        false;


    container.textContent =
        mensagem;

}


/* =========================================================
   HELPERS
========================================================= */

function preencherTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor;

    }

}


function criarEstadoVazio(
    mensagem
) {

    return `
        <div class="empty-state">
            ${escaparHTML(mensagem)}
        </div>
    `;

}


function normalizarStatus(
    status
) {

    const valor =
        String(status || "")
            .toUpperCase();


    switch (valor) {

        case "REALIZADA":

            return {

                classe:
                    "success",

                texto:
                    "✓ Realizada"

            };


        case "PENDENTE":

            return {

                classe:
                    "pending",

                texto:
                    "• Pendente"

            };


        case "EM_ANDAMENTO":

        case "EM ANDAMENTO":

            return {

                classe:
                    "progress",

                texto:
                    "↻ Em andamento"

            };


        default:

            return {

                classe: "",

                texto:
                    status || "—"

            };

    }

}


function escaparHTML(
    valor
) {

    const elemento =
        document.createElement(
            "div"
        );


    elemento.textContent =
        String(valor ?? "");


    return elemento.innerHTML;

}