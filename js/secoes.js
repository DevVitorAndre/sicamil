import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    secaoService
} from "./services/secaoService.js";


let secoes = [];

let secaoEmEdicao =
    null;


/* =========================================================
   ELEMENTOS
========================================================= */

const elementos = {};


document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


/* =========================================================
   INICIAR
========================================================= */

async function iniciar() {

    try {

        const usuario =
            await authService.usuarioAtual();


        if (
            !usuario.possuiPermissao(
                "SECOES_GERENCIAR"
            )
        ) {

            window.location.href =
                "dashboard.html";

            return;

        }


        await carregarComponentes();


        mapearElementos();

        registrarEventos();

        await carregarSecoes();


    } catch (erro) {

        console.error(
            "Erro ao iniciar Seções:",
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
            "Não foi possível carregar a página.",
            "error"
        );

    }

}


/* =========================================================
   ELEMENTOS DA PÁGINA
========================================================= */

function mapearElementos() {

    elementos.btnNovaSecao =
        document.getElementById(
            "btnNovaSecao"
        );


    elementos.formularioCard =
        document.getElementById(
            "formularioCard"
        );


    elementos.form =
        document.getElementById(
            "secaoForm"
        );


    elementos.secaoId =
        document.getElementById(
            "secaoId"
        );


    elementos.sigla =
        document.getElementById(
            "secaoSigla"
        );


    elementos.nome =
        document.getElementById(
            "secaoNome"
        );


    elementos.tituloFormulario =
        document.getElementById(
            "tituloFormulario"
        );


    elementos.btnCancelar =
        document.getElementById(
            "btnCancelar"
        );


    elementos.btnSalvar =
        document.getElementById(
            "btnSalvar"
        );


    elementos.tabela =
        document.getElementById(
            "tabelaSecoes"
        );


    elementos.total =
        document.getElementById(
            "totalSecoes"
        );


    elementos.pesquisa =
        document.getElementById(
            "pesquisaSecao"
        );


    elementos.filtroStatus =
        document.getElementById(
            "filtroStatus"
        );


    elementos.mensagem =
        document.getElementById(
            "secaoMensagem"
        );

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnNovaSecao
        ?.addEventListener(
            "click",
            abrirNovoCadastro
        );


    elementos.btnCancelar
        ?.addEventListener(
            "click",
            fecharFormulario
        );


    elementos.form
        ?.addEventListener(
            "submit",
            salvarSecao
        );


    elementos.pesquisa
        ?.addEventListener(
            "input",
            aplicarFiltros
        );


    elementos.filtroStatus
        ?.addEventListener(
            "change",
            aplicarFiltros
        );


    elementos.sigla
        ?.addEventListener(
            "input",
            () => {

                elementos.sigla.value =
                    elementos.sigla.value
                        .toUpperCase();

            }
        );

}


/* =========================================================
   CARREGAR SEÇÕES
========================================================= */

async function carregarSecoes() {

    exibirCarregamentoTabela();


    try {

        secoes =
            await secaoService.listar();


        atualizarTotal();

        aplicarFiltros();


    } catch (erro) {

        if (
            erro.status === 401
        ) {

            window.location.href =
                "index.html";

            return;

        }


        if (
            erro.status === 403
        ) {

            window.location.href =
                "dashboard.html";

            return;

        }


        elementos.tabela.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-empty"
                >
                    Não foi possível carregar as seções.
                </td>
            </tr>
        `;


        exibirMensagem(
            erro.message ||
            "Erro ao consultar as seções.",
            "error"
        );

    }

}


/* =========================================================
   FILTROS
========================================================= */

function aplicarFiltros() {

    const pesquisa =
        elementos.pesquisa
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const status =
        elementos.filtroStatus
            ?.value ||
        "TODAS";


    const filtradas =
        secoes.filter(
            (secao) => {

                const correspondePesquisa =
                    !pesquisa ||
                    secao.nome
                        ?.toLowerCase()
                        .includes(
                            pesquisa
                        ) ||
                    secao.sigla
                        ?.toLowerCase()
                        .includes(
                            pesquisa
                        );


                let correspondeStatus =
                    true;


                if (
                    status === "ATIVAS"
                ) {

                    correspondeStatus =
                        secao.ativa === true;

                }


                if (
                    status === "INATIVAS"
                ) {

                    correspondeStatus =
                        secao.ativa === false;

                }


                return (
                    correspondePesquisa &&
                    correspondeStatus
                );

            }
        );


    renderizarTabela(
        filtradas
    );

}


/* =========================================================
   TABELA
========================================================= */

function renderizarTabela(
    lista
) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        elementos.tabela.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-empty"
                >
                    Nenhuma seção encontrada.
                </td>
            </tr>
        `;

        return;

    }


    elementos.tabela.innerHTML =
        lista
            .map(
                (secao) => {

                    const status =
                        secao.ativa
                            ? "Ativa"
                            : "Inativa";


                    const classeStatus =
                        secao.ativa
                            ? "active"
                            : "inactive";


                    const textoStatusBotao =
                        secao.ativa
                            ? "Desativar"
                            : "Ativar";


                    return `
                        <tr>

                            <td>
                                <span class="secao-sigla">
                                    ${escaparHTML(
                                        secao.sigla
                                    )}
                                </span>
                            </td>

                            <td>
                                ${escaparHTML(
                                    secao.nome
                                )}
                            </td>

                            <td>

                                <span
                                    class="
                                        status-badge
                                        ${classeStatus}
                                    "
                                >
                                    ${status}
                                </span>

                            </td>

                            <td>

                                <div class="row-actions">

                                    <button
                                        type="button"
                                        class="
                                            btn-action
                                            edit
                                        "
                                        data-action="editar"
                                        data-id="${secao.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="
                                            btn-action
                                            status
                                        "
                                        data-action="status"
                                        data-id="${secao.id}"
                                    >
                                        ${textoStatusBotao}
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    registrarEventosTabela();

}


/* =========================================================
   EVENTOS DA TABELA
========================================================= */

function registrarEventosTabela() {

    elementos.tabela
        .querySelectorAll(
            "[data-action='editar']"
        )
        .forEach(
            (botao) => {

                botao.addEventListener(
                    "click",
                    () => {

                        editarSecao(
                            botao.dataset.id
                        );

                    }
                );

            }
        );


    elementos.tabela
        .querySelectorAll(
            "[data-action='status']"
        )
        .forEach(
            (botao) => {

                botao.addEventListener(
                    "click",
                    () => {

                        alterarStatus(
                            botao.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   NOVA SEÇÃO
========================================================= */

function abrirNovoCadastro() {

    secaoEmEdicao =
        null;


    elementos.form.reset();


    elementos.secaoId.value =
        "";


    elementos.tituloFormulario.textContent =
        "Nova Seção";


    elementos.btnSalvar.textContent =
        "Salvar Seção";


    elementos.formularioCard.hidden =
        false;


    elementos.sigla.focus();


    rolarParaFormulario();

}


/* =========================================================
   EDITAR
========================================================= */

function editarSecao(
    id
) {

    const secao =
        secoes.find(
            (item) =>
                String(item.id) ===
                String(id)
        );


    if (!secao) {

        return;

    }


    secaoEmEdicao =
        secao;


    elementos.secaoId.value =
        secao.id;


    elementos.sigla.value =
        secao.sigla || "";


    elementos.nome.value =
        secao.nome || "";


    elementos.tituloFormulario.textContent =
        "Editar Seção";


    elementos.btnSalvar.textContent =
        "Salvar Alterações";


    elementos.formularioCard.hidden =
        false;


    elementos.sigla.focus();


    rolarParaFormulario();

}


/* =========================================================
   SALVAR
========================================================= */

async function salvarSecao(
    evento
) {

    evento.preventDefault();


    const nome =
        elementos.nome.value
            .trim();


    const sigla =
        elementos.sigla.value
            .trim()
            .toUpperCase();


    if (
        !nome ||
        !sigla
    ) {

        exibirMensagem(
            "Informe o nome e a sigla da seção.",
            "error"
        );

        return;

    }


    definirFormularioCarregando(
        true
    );


    try {

        let resultado;


        if (secaoEmEdicao) {

            resultado =
                await secaoService.editar(
                    secaoEmEdicao.id,
                    nome,
                    sigla
                );

        } else {

            resultado =
                await secaoService.cadastrar(
                    nome,
                    sigla
                );

        }


        exibirMensagem(
            resultado.mensagem,
            "success"
        );


        fecharFormulario();


        await carregarSecoes();


    } catch (erro) {

        exibirMensagem(
            erro.message ||
            "Não foi possível salvar a seção.",
            "error"
        );


    } finally {

        definirFormularioCarregando(
            false
        );

    }

}


/* =========================================================
   ATIVAR / DESATIVAR
========================================================= */

async function alterarStatus(
    id
) {

    const secao =
        secoes.find(
            (item) =>
                String(item.id) ===
                String(id)
        );


    if (!secao) {

        return;

    }


    const novoStatus =
        !secao.ativa;


    const acao =
        novoStatus
            ? "ativar"
            : "desativar";


    const confirmou =
        window.confirm(
            `Deseja realmente ${acao} a seção ${secao.sigla}?`
        );


    if (!confirmou) {

        return;

    }


    try {

        const resultado =
            await secaoService.alterarStatus(
                secao.id,
                novoStatus
            );


        exibirMensagem(
            resultado.mensagem,
            "success"
        );


        await carregarSecoes();


    } catch (erro) {

        exibirMensagem(
            erro.message ||
            "Não foi possível alterar o status da seção.",
            "error"
        );

    }

}


/* =========================================================
   FECHAR FORMULÁRIO
========================================================= */

function fecharFormulario() {

    secaoEmEdicao =
        null;


    elementos.form.reset();


    elementos.secaoId.value =
        "";


    elementos.formularioCard.hidden =
        true;

}


/* =========================================================
   TOTAL
========================================================= */

function atualizarTotal() {

    elementos.total.textContent =
        secoes.length;

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function exibirCarregamentoTabela() {

    elementos.tabela.innerHTML = `
        <tr>
            <td
                colspan="4"
                class="table-empty"
            >
                Carregando seções...
            </td>
        </tr>
    `;

}


/* =========================================================
   BLOQUEAR FORM
========================================================= */

function definirFormularioCarregando(
    carregando
) {

    elementos.btnSalvar.disabled =
        carregando;


    elementos.btnCancelar.disabled =
        carregando;


    elementos.sigla.disabled =
        carregando;


    elementos.nome.disabled =
        carregando;


    elementos.btnSalvar.textContent =
        carregando
            ? "Salvando..."
            : (
                secaoEmEdicao
                    ? "Salvar Alterações"
                    : "Salvar Seção"
            );

}


/* =========================================================
   MENSAGEM
========================================================= */

function exibirMensagem(
    mensagem,
    tipo
) {

    elementos.mensagem.hidden =
        false;


    elementos.mensagem.textContent =
        mensagem;


    elementos.mensagem.className =
        `secao-message ${tipo}`;

}


/* =========================================================
   SCROLL
========================================================= */

function rolarParaFormulario() {

    elementos.formularioCard
        .scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

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