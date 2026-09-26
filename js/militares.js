import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    militarService
} from "./services/militarService.js";


let usuarioLogado = null;

let militares = [];

let postosGraduacoes = [];

let secoes = [];

let militarEmEdicao = null;


const elementos = {};


/* =========================================================
   INICIAR
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
                "MILITARES_GERENCIAR"
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

        await carregarMilitares();


    } catch (erro) {

        console.error(
            "Erro ao iniciar Militares:",
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
   ELEMENTOS
========================================================= */

function mapearElementos() {

    elementos.btnNovoMilitar =
        document.getElementById(
            "btnNovoMilitar"
        );


    elementos.formulario =
        document.getElementById(
            "formularioMilitar"
        );


    elementos.form =
        document.getElementById(
            "militarForm"
        );


    elementos.militarId =
        document.getElementById(
            "militarId"
        );


    elementos.tituloFormulario =
        document.getElementById(
            "tituloFormulario"
        );


    elementos.postoGraduacao =
        document.getElementById(
            "militarPostoGraduacao"
        );


    elementos.nomeCompleto =
        document.getElementById(
            "militarNomeCompleto"
        );


    elementos.nomeGuerra =
        document.getElementById(
            "militarNomeGuerra"
        );


    elementos.saram =
        document.getElementById(
            "militarSaram"
        );


    elementos.secao =
        document.getElementById(
            "militarSecao"
        );


    elementos.btnCancelar =
        document.getElementById(
            "btnCancelarMilitar"
        );


    elementos.btnSalvar =
        document.getElementById(
            "btnSalvarMilitar"
        );


    elementos.mensagem =
        document.getElementById(
            "militarMensagem"
        );


    elementos.total =
        document.getElementById(
            "totalMilitares"
        );


    elementos.tabela =
        document.getElementById(
            "tabelaMilitares"
        );


    elementos.pesquisa =
        document.getElementById(
            "pesquisaMilitar"
        );


    elementos.filtroPosto =
        document.getElementById(
            "filtroPostoGraduacao"
        );


    elementos.filtroSecao =
        document.getElementById(
            "filtroSecao"
        );


    elementos.filtroStatus =
        document.getElementById(
            "filtroStatus"
        );

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnNovoMilitar
        ?.addEventListener(
            "click",
            abrirNovoMilitar
        );


    elementos.btnCancelar
        ?.addEventListener(
            "click",
            fecharFormulario
        );


    elementos.form
        ?.addEventListener(
            "submit",
            salvarMilitar
        );


    elementos.pesquisa
        ?.addEventListener(
            "input",
            aplicarFiltros
        );


    elementos.filtroPosto
        ?.addEventListener(
            "change",
            aplicarFiltros
        );


    elementos.filtroSecao
        ?.addEventListener(
            "change",
            aplicarFiltros
        );


    elementos.filtroStatus
        ?.addEventListener(
            "change",
            aplicarFiltros
        );


    /*
        AÇÕES DA TABELA
        Editar / Status / Excluir
    */

    elementos.tabela
        ?.addEventListener(
            "click",
            tratarAcaoTabela
        );

}


/* =========================================================
   CARREGAR OPÇÕES
========================================================= */

async function carregarOpcoes() {

    const resposta =
        await militarService.buscarOpcoes();


    postosGraduacoes =
        resposta.postosGraduacoes || [];


    secoes =
        resposta.secoes || [];


    renderizarPostosGraduacoes();

    renderizarSecoes();

}


/* =========================================================
   RENDERIZAR PT / GRAD
========================================================= */

function renderizarPostosGraduacoes() {

    elementos.postoGraduacao.innerHTML = `

        <option value="">
            Selecione...
        </option>

        ${
            postosGraduacoes
                .map(
                    posto => `

                        <option
                            value="${posto.id}"
                        >
                            ${escaparHTML(
                                posto.sigla
                            )}
                            -
                            ${escaparHTML(
                                posto.nome
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;


    elementos.filtroPosto.innerHTML = `

        <option value="TODOS">
            Todos os PT/GRAD
        </option>

        ${
            postosGraduacoes
                .map(
                    posto => `

                        <option
                            value="${posto.id}"
                        >
                            ${escaparHTML(
                                posto.sigla
                            )}
                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   RENDERIZAR SEÇÕES
========================================================= */

function renderizarSecoes() {

    elementos.secao.innerHTML = `

        <option value="">
            Selecione...
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


    elementos.filtroSecao.innerHTML = `

        <option value="TODOS">
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
                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   CARREGAR MILITARES
========================================================= */

async function carregarMilitares() {

    exibirCarregamento();


    try {

        militares =
            await militarService.listar();


        elementos.total.textContent =
            militares.length;


        aplicarFiltros();


    } catch (erro) {

        elementos.tabela.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="table-empty"
                >
                    Não foi possível carregar os militares.
                </td>

            </tr>

        `;


        throw erro;

    }

}


/* =========================================================
   FILTROS
========================================================= */

function aplicarFiltros() {

    const pesquisa =
        String(
            elementos.pesquisa.value || ""
        )
            .trim()
            .toLowerCase();


    const posto =
        elementos.filtroPosto.value;


    const secao =
        elementos.filtroSecao.value;


    const status =
        elementos.filtroStatus.value;


    const filtrados =
        militares.filter(
            militar => {

                const correspondePesquisa =

                    !pesquisa ||

                    militar.nomeCompleto
                        ?.toLowerCase()
                        .includes(
                            pesquisa
                        ) ||

                    militar.nomeGuerra
                        ?.toLowerCase()
                        .includes(
                            pesquisa
                        ) ||

                    String(
                        militar.saram || ""
                    )
                        .toLowerCase()
                        .includes(
                            pesquisa
                        );


                const correspondePosto =

                    posto === "TODOS" ||

                    String(
                        militar.postoGraduacao?.id
                    ) ===
                    String(
                        posto
                    );


                const correspondeSecao =

                    secao === "TODOS" ||

                    String(
                        militar.secao?.id
                    ) ===
                    String(
                        secao
                    );


                let correspondeStatus =
                    true;


                if (
                    status === "ATIVOS"
                ) {

                    correspondeStatus =
                        militar.ativo === true;

                }


                if (
                    status === "INATIVOS"
                ) {

                    correspondeStatus =
                        militar.ativo === false;

                }


                return (
                    correspondePesquisa &&
                    correspondePosto &&
                    correspondeSecao &&
                    correspondeStatus
                );

            }
        );


    renderizarTabela(
        filtrados
    );

}


/* =========================================================
   RENDERIZAR TABELA
========================================================= */

function renderizarTabela(lista) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        elementos.tabela.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="table-empty"
                >
                    Nenhum militar encontrado.
                </td>

            </tr>

        `;

        return;

    }


    elementos.tabela.innerHTML =
        lista.map(
            militar => {

                const statusTexto =
                    militar.ativo
                        ? "Ativo"
                        : "Inativo";


                const statusClasse =
                    militar.ativo
                        ? "active"
                        : "inactive";


                const acaoStatus =
                    militar.ativo
                        ? "Desativar"
                        : "Ativar";


                return `

                    <tr>

                        <td>

                            <span class="military-rank">

                                ${escaparHTML(
                                    militar
                                        .postoGraduacao
                                        ?.sigla ||
                                    "—"
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="military-full-name">

                                ${escaparHTML(
                                    militar.nomeCompleto
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="military-war-name">

                                ${escaparHTML(
                                    militar.nomeGuerra
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="military-saram">

                                ${escaparHTML(
                                    militar.saram
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="military-section">

                                ${escaparHTML(
                                    militar.secao?.sigla ||
                                    "—"
                                )}

                            </span>

                        </td>


                        <td>

                            <span
                                class="
                                    status-badge
                                    ${statusClasse}
                                "
                            >

                                ${statusTexto}

                            </span>

                        </td>


                        <td>

                            <span class="military-actions">


                                <button
                                    type="button"
                                    class="
                                        action-button
                                        edit
                                    "
                                    data-acao="editar"
                                    data-id="${militar.id}"
                                >
                                    Editar
                                </button>


                                <button
                                    type="button"
                                    class="
                                        action-button
                                        status
                                    "
                                    data-acao="status"
                                    data-id="${militar.id}"
                                >
                                    ${acaoStatus}
                                </button>


                                <button
                                    type="button"
                                    class="
                                        action-button
                                        delete
                                    "
                                    data-acao="excluir"
                                    data-id="${militar.id}"
                                >
                                    Excluir
                                </button>


                            </span>

                        </td>


                    </tr>

                `;

            }
        )
        .join("");

}


/* =========================================================
   AÇÕES DA TABELA
========================================================= */

async function tratarAcaoTabela(evento) {

    const botao =
        evento.target.closest(
            "[data-acao]"
        );


    if (!botao) {
        return;
    }


    const id =
        botao.dataset.id;


    const acao =
        botao.dataset.acao;


    if (!id) {
        return;
    }


    if (
        acao === "editar"
    ) {

        await abrirEdicaoMilitar(
            id
        );

        return;

    }


    if (
        acao === "status"
    ) {

        await alterarStatusMilitar(
            id
        );

        return;

    }


    if (
        acao === "excluir"
    ) {

        await excluirMilitar(
            id
        );

    }

}


/* =========================================================
   NOVO MILITAR
========================================================= */

function abrirNovoMilitar() {

    militarEmEdicao =
        null;


    elementos.form.reset();


    elementos.militarId.value =
        "";


    elementos.tituloFormulario.textContent =
        "Novo Militar";


    elementos.btnSalvar.textContent =
        "Salvar Militar";


    elementos.formulario.hidden =
        false;


    elementos.formulario.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


/* =========================================================
   EDITAR MILITAR
========================================================= */

async function abrirEdicaoMilitar(id) {

    try {

        const militar =
            await militarService.buscarPorId(
                id
            );


        militarEmEdicao =
            militar;


        elementos.militarId.value =
            militar.id;


        elementos.postoGraduacao.value =
            String(
                militar.postoGraduacao?.id ??
                ""
            );


        elementos.nomeCompleto.value =
            militar.nomeCompleto || "";


        elementos.nomeGuerra.value =
            militar.nomeGuerra || "";


        elementos.saram.value =
            militar.saram || "";


        elementos.secao.value =
            String(
                militar.secao?.id ??
                ""
            );


        elementos.tituloFormulario.textContent =
            "Editar Militar";


        elementos.btnSalvar.textContent =
            "Salvar Alterações";


        elementos.formulario.hidden =
            false;


        elementos.formulario.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });


    } catch (erro) {

        console.error(
            "Erro ao abrir militar:",
            erro
        );


        exibirMensagem(
            erro.message ||
            "Não foi possível carregar o militar.",
            "error"
        );

    }

}


/* =========================================================
   SALVAR MILITAR
========================================================= */

async function salvarMilitar(evento) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    /*
        CAMPOS LIDOS DIRETAMENTE DO FORMULÁRIO.
    */

    const campoPosto =
        formulario.querySelector(
            "#militarPostoGraduacao"
        );


    const campoNomeCompleto =
        formulario.querySelector(
            "#militarNomeCompleto"
        );


    const campoNomeGuerra =
        formulario.querySelector(
            "#militarNomeGuerra"
        );


    const campoSaram =
        formulario.querySelector(
            "#militarSaram"
        );


    const campoSecao =
        formulario.querySelector(
            "#militarSecao"
        );


    const postoGraduacaoId =
        String(
            campoPosto?.value ?? ""
        ).trim();


    const nomeCompleto =
        String(
            campoNomeCompleto?.value ?? ""
        ).trim();


    const nomeGuerra =
        String(
            campoNomeGuerra?.value ?? ""
        ).trim();


    const saram =
        String(
            campoSaram?.value ?? ""
        ).trim();


    const secaoId =
        String(
            campoSecao?.value ?? ""
        ).trim();


    /* =====================================================
       VALIDAÇÃO
    ===================================================== */

    const camposFaltando = [];


    if (!postoGraduacaoId) {

        camposFaltando.push(
            "PT/GRAD"
        );

    }


    if (!nomeCompleto) {

        camposFaltando.push(
            "Nome Completo"
        );

    }


    if (!nomeGuerra) {

        camposFaltando.push(
            "Nome de Guerra"
        );

    }


    if (!saram) {

        camposFaltando.push(
            "SARAM"
        );

    }


    if (!secaoId) {

        camposFaltando.push(
            "Seção"
        );

    }


    if (
        camposFaltando.length > 0
    ) {

        exibirMensagem(
            `Preencha: ${camposFaltando.join(", ")}.`,
            "error"
        );

        return;

    }


    if (
        !/^\d+$/.test(
            saram
        )
    ) {

        exibirMensagem(
            "O SARAM deve conter somente números.",
            "error"
        );


        campoSaram?.focus();

        return;

    }


    const dados = {

        postoGraduacaoId,

        nomeCompleto,

        nomeGuerra,

        saram,

        secaoId

    };


    try {

        elementos.btnSalvar.disabled =
            true;


        elementos.btnSalvar.textContent =
            "Salvando...";


        let resposta;


        /*
            SE EXISTE militarEmEdicao,
            FAZ UPDATE.

            CASO CONTRÁRIO,
            FAZ INSERT.
        */

        if (militarEmEdicao) {

            resposta =
                await militarService.editar(

                    militarEmEdicao.id,

                    dados

                );

        } else {

            resposta =
                await militarService.cadastrar(
                    dados
                );

        }


        exibirMensagem(
            resposta.mensagem,
            "success"
        );


        fecharFormulario();


        await carregarMilitares();


    } catch (erro) {

        console.error(
            "Erro ao salvar militar:",
            erro
        );


        exibirMensagem(
            erro.message ||
            "Não foi possível salvar o militar.",
            "error"
        );


    } finally {

        elementos.btnSalvar.disabled =
            false;


        elementos.btnSalvar.textContent =
            militarEmEdicao
                ? "Salvar Alterações"
                : "Salvar Militar";

    }

}


/* =========================================================
   ATIVAR / DESATIVAR
========================================================= */

async function alterarStatusMilitar(id) {

    const militar =
        militares.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!militar) {
        return;
    }


    const novoStatus =
        !militar.ativo;


    const acao =
        novoStatus
            ? "ativar"
            : "desativar";


    const confirmou =
        window.confirm(

            `Deseja ${acao} o militar ${militar.nomeGuerra}?`

        );


    if (!confirmou) {
        return;
    }


    try {

        const resposta =
            await militarService.alterarStatus(

                militar.id,

                novoStatus

            );


        exibirMensagem(
            resposta.mensagem,
            "success"
        );


        await carregarMilitares();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );


        exibirMensagem(
            erro.message ||
            "Não foi possível alterar o status do militar.",
            "error"
        );

    }

}


/* =========================================================
   EXCLUIR MILITAR
========================================================= */

async function excluirMilitar(id) {

    const militar =
        militares.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!militar) {
        return;
    }


    const confirmou =
        window.confirm(

            `ATENÇÃO!\n\nDeseja excluir definitivamente o militar ${militar.nomeGuerra}?\n\nSARAM: ${militar.saram}\n\nEsta ação não poderá ser desfeita.`

        );


    if (!confirmou) {
        return;
    }


    try {

        const resposta =
            await militarService.excluir(
                militar.id
            );


        exibirMensagem(
            resposta.mensagem,
            "success"
        );


        /*
            SE ESTAVA EDITANDO O MESMO MILITAR,
            FECHA O FORMULÁRIO.
        */

        if (
            militarEmEdicao &&
            String(
                militarEmEdicao.id
            ) ===
            String(
                militar.id
            )
        ) {

            fecharFormulario();

        }


        await carregarMilitares();


    } catch (erro) {

        console.error(
            "Erro ao excluir militar:",
            erro
        );


        exibirMensagem(
            erro.message ||
            "Não foi possível excluir o militar.",
            "error"
        );

    }

}


/* =========================================================
   FECHAR FORMULÁRIO
========================================================= */

function fecharFormulario() {

    militarEmEdicao =
        null;


    elementos.form.reset();


    elementos.militarId.value =
        "";


    elementos.tituloFormulario.textContent =
        "Novo Militar";


    elementos.btnSalvar.textContent =
        "Salvar Militar";


    elementos.formulario.hidden =
        true;

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function exibirCarregamento() {

    elementos.tabela.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="table-empty"
            >
                Carregando militares...
            </td>

        </tr>

    `;

}


/* =========================================================
   MENSAGENS
========================================================= */

function exibirMensagem(
    mensagem,
    tipo = "success"
) {

    if (!elementos.mensagem) {
        return;
    }


    elementos.mensagem.textContent =
        mensagem;


    elementos.mensagem.className =
        `militar-message ${tipo}`;


    elementos.mensagem.hidden =
        false;

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(valor) {

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