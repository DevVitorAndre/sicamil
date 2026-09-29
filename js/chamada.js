import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    chamadaService
} from "./services/chamadaService.js";


/* =========================================================
   ESTADO
========================================================= */

let usuarioLogado = null;

let chamadaAtual = null;

let secaoAtual = null;

let militares = [];

let situacoes = [];

let registros = [];

let secoes = [];


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
                "CHAMADA_REALIZAR"
            )
        ) {

            window.location.href =
                "dashboard.html";

            return;

        }


        await carregarComponentes();


        mapearElementos();

        registrarEventos();

        definirDataHoje();


        await carregarOpcoes();


    } catch (erro) {

        console.error(
            "Erro ao iniciar Chamada:",
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
            "Não foi possível carregar a chamada.",

            "error"

        );

    }

}


/* =========================================================
   ELEMENTOS
========================================================= */

function mapearElementos() {

    elementos.data =
        document.getElementById(
            "chamadaData"
        );


    elementos.secao =
        document.getElementById(
            "chamadaSecao"
        );


    elementos.grupoSecao =
        document.getElementById(
            "grupoChamadaSecao"
        );


    elementos.btnCarregar =
        document.getElementById(
            "btnCarregarChamada"
        );


    elementos.status =
        document.getElementById(
            "chamadaStatus"
        );


    elementos.mensagem =
        document.getElementById(
            "chamadaMensagem"
        );


    elementos.totalMilitares =
        document.getElementById(
            "totalMilitares"
        );


    elementos.totalPresentes =
        document.getElementById(
            "totalPresentes"
        );


    elementos.totalIndisponiveis =
        document.getElementById(
            "totalIndisponiveis"
        );


    elementos.totalPendentes =
        document.getElementById(
            "totalPendentes"
        );


    elementos.tituloSecao =
        document.getElementById(
            "tituloSecaoChamada"
        );


    elementos.subtitulo =
        document.getElementById(
            "subtituloChamada"
        );


    elementos.tabela =
        document.getElementById(
            "tabelaChamada"
        );


    elementos.btnMarcarTodos =
        document.getElementById(
            "btnMarcarTodosPresentes"
        );


    elementos.btnSalvar =
        document.getElementById(
            "btnSalvarChamada"
        );


    elementos.btnFinalizar =
        document.getElementById(
            "btnFinalizarChamada"
        );


    elementos.responsavel =
        document.getElementById(
            "responsavelChamada"
        );


    elementos.painel =
        document.getElementById(
            "painelChamada"
        );

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnCarregar
        ?.addEventListener(
            "click",
            carregarContexto
        );


    elementos.btnMarcarTodos
        ?.addEventListener(
            "click",
            marcarTodosPresentes
        );


    elementos.btnSalvar
        ?.addEventListener(
            "click",
            salvarChamada
        );


    elementos.btnFinalizar
        ?.addEventListener(
            "click",
            finalizarChamada
        );


    elementos.tabela
        ?.addEventListener(
            "change",
            tratarAlteracaoTabela
        );


    elementos.data
        ?.addEventListener(
            "change",
            limparTelaChamada
        );


    elementos.secao
        ?.addEventListener(
            "change",
            limparTelaChamada
        );

}


/* =========================================================
   DATA DE HOJE
========================================================= */

function definirDataHoje() {

    const agora =
        new Date();


    const ano =
        agora.getFullYear();


    const mes =
        String(
            agora.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            agora.getDate()
        ).padStart(
            2,
            "0"
        );


    elementos.data.value =
        `${ano}-${mes}-${dia}`;

}


/* =========================================================
   OPÇÕES
========================================================= */

async function carregarOpcoes() {

    const resposta =
        await chamadaService.buscarOpcoes();


    secoes =
        resposta.secoes || [];


    situacoes =
        resposta.situacoes || [];


    renderizarSecoes();


    /*
        USUÁRIO OPERACIONAL

        Se só existe uma seção permitida,
        já selecionamos automaticamente.
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


        await carregarContexto();

    }

}


/* =========================================================
   SEÇÕES
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

}


/* =========================================================
   CARREGAR CONTEXTO
========================================================= */

async function carregarContexto() {

    const data =
        elementos.data.value;


    const secaoId =
        elementos.secao.value;


    if (!data) {

        exibirMensagem(
            "Selecione a data da chamada.",
            "warning"
        );

        return;

    }


    if (!secaoId) {

        exibirMensagem(
            "Selecione a seção da chamada.",
            "warning"
        );

        return;

    }


    try {

        definirCarregamento(
            true
        );


        ocultarMensagem();


        const contexto =
            await chamadaService.buscarContexto({

                secaoId,

                data

            });


        secaoAtual =
            contexto.secao;


        militares =
            contexto.militares || [];


        situacoes =
            contexto.situacoes || [];


        chamadaAtual =
            contexto.chamada || null;


        registros =
            contexto.registros || [];


        renderizarContexto();


    } catch (erro) {

        console.error(
            "Erro ao carregar chamada:",
            erro
        );


        exibirMensagem(

            erro.message ||
            "Não foi possível carregar a chamada.",

            "error"

        );


    } finally {

        definirCarregamento(
            false
        );

    }

}


/* =========================================================
   RENDERIZAR CONTEXTO
========================================================= */

function renderizarContexto() {

    elementos.tituloSecao.textContent =
        secaoAtual
            ? `Efetivo - ${secaoAtual.sigla}`
            : "Efetivo da Seção";


    elementos.subtitulo.textContent =
        `${militares.length} militar(es) • ${formatarData(
            elementos.data.value
        )}`;


    renderizarTabela();


    atualizarStatus();


    atualizarResponsavel();


    atualizarIndicadores();


    atualizarBotoes();

}


/* =========================================================
   TABELA
========================================================= */

function renderizarTabela() {

    if (
        militares.length === 0
    ) {

        elementos.tabela.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="table-empty"
                >
                    Nenhum militar ativo cadastrado nesta seção.
                </td>

            </tr>

        `;

        return;

    }


    const mapaRegistros =
        new Map(
            registros.map(
                registro => [

                    String(
                        registro.militarId
                    ),

                    registro

                ]
            )
        );


    elementos.tabela.innerHTML =
        militares.map(
            militar => {

                const registro =
                    mapaRegistros.get(
                        String(
                            militar.id
                        )
                    );


                const situacaoId =
                    registro?.situacao?.id ||
                    "";


                const presente =
                    registro
                        ? registro.presente
                        : null;


                const observacao =
                    registro?.observacao ||
                    "";


                const bloqueada =
                    chamadaAtual?.status ===
                    "REALIZADA";


                return `

                    <tr
                        data-militar-id="${militar.id}"
                        class="${obterClasseLinha(
                            situacaoId
                        )}"
                    >

                        <td>

                            <span class="chamada-rank">

                                ${escaparHTML(
                                    militar
                                        .postoGraduacao
                                        ?.sigla ||
                                    "—"
                                )}

                            </span>

                        </td>


                        <td>

                            <div class="chamada-militar">

                                <strong>
                                    ${escaparHTML(
                                        militar.nomeGuerra
                                    )}
                                </strong>

                                <small>
                                    ${escaparHTML(
                                        militar.nomeCompleto
                                    )}
                                </small>

                            </div>

                        </td>


                        <td class="presenca-cell">

                            <input
                                type="radio"
                                class="presenca-radio"
                                name="presenca-${militar.id}"
                                value="PRESENTE"
                                data-tipo="presente"
                                ${
                                    presente === true
                                        ? "checked"
                                        : ""
                                }
                                ${
                                    bloqueada
                                        ? "disabled"
                                        : ""
                                }
                            >

                        </td>


                        <td class="presenca-cell">

                            <input
                                type="radio"
                                class="presenca-radio"
                                name="presenca-${militar.id}"
                                value="FALTA"
                                data-tipo="falta"
                                ${
                                    presente === false
                                        ? "checked"
                                        : ""
                                }
                                ${
                                    bloqueada
                                        ? "disabled"
                                        : ""
                                }
                            >

                        </td>


                        <td>

                            <select
                                class="situacao-select"
                                data-campo="situacao"
                                ${
                                    bloqueada
                                        ? "disabled"
                                        : ""
                                }
                            >

                                <option value="">
                                    Selecione...
                                </option>

                                ${
                                    gerarOpcoesSituacao(
                                        situacaoId
                                    )
                                }

                            </select>

                        </td>


                        <td>

                            <input
                                type="text"
                                class="observacao-input"
                                data-campo="observacao"
                                maxlength="255"
                                placeholder="Observação opcional..."
                                value="${escaparHTML(
                                    observacao
                                )}"
                                ${
                                    bloqueada
                                        ? "disabled"
                                        : ""
                                }
                            >

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


/* =========================================================
   OPÇÕES DE SITUAÇÃO
========================================================= */

function gerarOpcoesSituacao(
    situacaoSelecionada
) {

    return situacoes
        .map(
            situacao => `

                <option
                    value="${situacao.id}"
                    ${
                        String(
                            situacao.id
                        ) ===
                        String(
                            situacaoSelecionada
                        )
                            ? "selected"
                            : ""
                    }
                >
                    ${escaparHTML(
                        situacao.nome
                    )}
                </option>

            `
        )
        .join("");

}


/* =========================================================
   ALTERAÇÃO DA TABELA
========================================================= */

function tratarAlteracaoTabela(
    evento
) {

    const linha =
        evento.target.closest(
            "[data-militar-id]"
        );


    if (!linha) {
        return;
    }


    /*
        SITUAÇÃO ALTERADA
    */

    if (
        evento.target.matches(
            "[data-campo='situacao']"
        )
    ) {

        sincronizarPorSituacao(
            linha
        );

    }


    /*
        PRESENTE / FALTA
    */

    if (
        evento.target.matches(
            "[data-tipo='presente']"
        )
    ) {

        selecionarSituacaoPorCodigo(

            linha,

            "PRESENTE"

        );

    }


    if (
        evento.target.matches(
            "[data-tipo='falta']"
        )
    ) {

        selecionarSituacaoPorCodigo(

            linha,

            "FALTA"

        );

    }


    atualizarClasseLinha(
        linha
    );


    atualizarIndicadores();

}


/* =========================================================
   SITUAÇÃO → PRESENTE / FALTA
========================================================= */

function sincronizarPorSituacao(
    linha
) {

    const select =
        linha.querySelector(
            "[data-campo='situacao']"
        );


    const situacao =
        obterSituacaoPorId(
            select.value
        );


    const radioPresente =
        linha.querySelector(
            "[data-tipo='presente']"
        );


    const radioFalta =
        linha.querySelector(
            "[data-tipo='falta']"
        );


    if (!situacao) {

        radioPresente.checked =
            false;


        radioFalta.checked =
            false;


        return;

    }


    if (
        situacao.disponivel
    ) {

        radioPresente.checked =
            true;


        radioFalta.checked =
            false;

    } else {

        radioPresente.checked =
            false;


        radioFalta.checked =
            true;

    }

}


/* =========================================================
   PRESENTE / FALTA → SITUAÇÃO
========================================================= */

function selecionarSituacaoPorCodigo(
    linha,
    codigo
) {

    const situacao =
        situacoes.find(
            item =>
                item.codigo ===
                codigo
        );


    if (!situacao) {
        return;
    }


    const select =
        linha.querySelector(
            "[data-campo='situacao']"
        );


    select.value =
        String(
            situacao.id
        );

}


/* =========================================================
   MARCAR TODOS PRESENTES
========================================================= */

function marcarTodosPresentes() {

    if (
        chamadaAtual?.status ===
        "REALIZADA"
    ) {

        return;

    }


    const presente =
        situacoes.find(
            situacao =>
                situacao.codigo ===
                "PRESENTE"
        );


    if (!presente) {

        exibirMensagem(
            "A situação PRESENTE não foi encontrada.",
            "error"
        );

        return;

    }


    const linhas =
        elementos.tabela.querySelectorAll(
            "[data-militar-id]"
        );


    linhas.forEach(
        linha => {

            const select =
                linha.querySelector(
                    "[data-campo='situacao']"
                );


            const radio =
                linha.querySelector(
                    "[data-tipo='presente']"
                );


            select.value =
                String(
                    presente.id
                );


            radio.checked =
                true;


            atualizarClasseLinha(
                linha
            );

        }
    );


    atualizarIndicadores();

}


/* =========================================================
   COLETAR REGISTROS
========================================================= */

function coletarRegistros({
    somentePreenchidos = true
} = {}) {

    const linhas =
        [
            ...elementos.tabela
                .querySelectorAll(
                    "[data-militar-id]"
                )
        ];


    const resultado = [];


    for (
        const linha
        of linhas
    ) {

        const militarId =
            linha.dataset.militarId;


        const situacaoId =
            linha
                .querySelector(
                    "[data-campo='situacao']"
                )
                ?.value || "";


        const observacao =
            linha
                .querySelector(
                    "[data-campo='observacao']"
                )
                ?.value
                ?.trim() || "";


        if (
            somentePreenchidos &&
            !situacaoId
        ) {

            continue;

        }


        resultado.push({

            militarId,

            situacaoId,

            observacao

        });

    }


    return resultado;

}


/* =========================================================
   GARANTIR CHAMADA INICIADA
========================================================= */

async function garantirChamadaIniciada() {

    if (
        chamadaAtual
    ) {

        return chamadaAtual;

    }


    const resposta =
        await chamadaService.iniciar({

            secaoId:
                secaoAtual.id,

            data:
                elementos.data.value

        });


    chamadaAtual =
        resposta.chamada;


    atualizarStatus();

    atualizarResponsavel();

    atualizarBotoes();


    return chamadaAtual;

}


/* =========================================================
   SALVAR
========================================================= */

async function salvarChamada() {

    if (!secaoAtual) {

        exibirMensagem(
            "Carregue uma seção antes de salvar.",
            "warning"
        );

        return;

    }


    if (
        chamadaAtual?.status ===
        "REALIZADA"
    ) {

        exibirMensagem(
            "Esta chamada já foi realizada.",
            "warning"
        );

        return;

    }


    const dados =
        coletarRegistros();


    if (
        dados.length === 0
    ) {

        exibirMensagem(
            "Registre pelo menos um militar antes de salvar.",
            "warning"
        );

        return;

    }


    try {

        elementos.btnSalvar.disabled =
            true;


        elementos.btnSalvar.textContent =
            "Salvando...";


        await garantirChamadaIniciada();


        const resposta =
            await chamadaService.salvar(

                chamadaAtual.id,

                dados

            );


        chamadaAtual =
            resposta.chamada;


        registros =
            resposta.registros || [];


        exibirMensagem(

            resposta.mensagem ||
            "Chamada salva com sucesso.",

            "success"

        );


        renderizarContexto();


    } catch (erro) {

        console.error(
            "Erro ao salvar chamada:",
            erro
        );


        exibirMensagem(

            erro.message ||
            "Não foi possível salvar a chamada.",

            "error"

        );


    } finally {

        elementos.btnSalvar.textContent =
            "Salvar Chamada";


        atualizarBotoes();

    }

}


/* =========================================================
   FINALIZAR
========================================================= */

async function finalizarChamada() {

    if (!secaoAtual) {
        return;
    }


    const pendentes =
        calcularIndicadores()
            .pendentes;


    if (
        pendentes > 0
    ) {

        exibirMensagem(

            `Existem ${pendentes} militar(es) sem situação registrada.`,

            "warning"

        );

        return;

    }


    const confirmou =
        window.confirm(

            "Deseja finalizar esta chamada?\n\nApós a finalização ela ficará marcada como REALIZADA."

        );


    if (!confirmou) {
        return;
    }


    try {

        elementos.btnFinalizar.disabled =
            true;


        elementos.btnFinalizar.textContent =
            "Finalizando...";


        await garantirChamadaIniciada();


        /*
            ANTES DE FINALIZAR,
            SALVA O ESTADO ATUAL.
        */

        const dados =
            coletarRegistros({
                somentePreenchidos:
                    false
            });


        const respostaSalvo =
            await chamadaService.salvar(

                chamadaAtual.id,

                dados

            );


        registros =
            respostaSalvo.registros || [];


        const resposta =
            await chamadaService.finalizar(
                chamadaAtual.id
            );


        chamadaAtual =
            resposta.chamada;


        registros =
            resposta.registros || [];


        exibirMensagem(

            resposta.mensagem ||
            "Chamada realizada com sucesso.",

            "success"

        );


        renderizarContexto();


    } catch (erro) {

        console.error(
            "Erro ao finalizar chamada:",
            erro
        );


        exibirMensagem(

            erro.message ||
            "Não foi possível finalizar a chamada.",

            "error"

        );


    } finally {

        elementos.btnFinalizar.textContent =
            "Finalizar Chamada";


        atualizarBotoes();

    }

}


/* =========================================================
   INDICADORES
========================================================= */

function calcularIndicadores() {

    const linhas =
        [
            ...elementos.tabela
                .querySelectorAll(
                    "[data-militar-id]"
                )
        ];


    let disponiveis = 0;

    let indisponiveis = 0;

    let pendentes = 0;


    for (
        const linha
        of linhas
    ) {

        const situacaoId =
            linha
                .querySelector(
                    "[data-campo='situacao']"
                )
                ?.value;


        if (!situacaoId) {

            pendentes++;

            continue;

        }


        const situacao =
            obterSituacaoPorId(
                situacaoId
            );


        if (
            situacao?.disponivel
        ) {

            disponiveis++;

        } else {

            indisponiveis++;

        }

    }


    return {

        total:
            linhas.length,

        disponiveis,

        indisponiveis,

        pendentes

    };

}


function atualizarIndicadores() {

    const indicadores =
        calcularIndicadores();


    elementos.totalMilitares.textContent =
        indicadores.total;


    elementos.totalPresentes.textContent =
        indicadores.disponiveis;


    elementos.totalIndisponiveis.textContent =
        indicadores.indisponiveis;


    elementos.totalPendentes.textContent =
        indicadores.pendentes;

}


/* =========================================================
   STATUS
========================================================= */

function atualizarStatus() {

    if (!chamadaAtual) {

        elementos.status.textContent =
            "Não iniciada";


        elementos.status.className =
            "chamada-status pendente";


        return;

    }


    if (
        chamadaAtual.status ===
        "EM_ANDAMENTO"
    ) {

        elementos.status.textContent =
            "Em andamento";


        elementos.status.className =
            "chamada-status andamento";


        return;

    }


    if (
        chamadaAtual.status ===
        "REALIZADA"
    ) {

        elementos.status.textContent =
            "Realizada";


        elementos.status.className =
            "chamada-status realizada";


        return;

    }


    elementos.status.textContent =
        "Pendente";


    elementos.status.className =
        "chamada-status pendente";

}


/* =========================================================
   RESPONSÁVEL
========================================================= */

function atualizarResponsavel() {

    const nomeResponsavel =

        chamadaAtual
            ?.responsavel
            ?.nome ||

        usuarioLogado
            ?.nome ||

        usuarioLogado
            ?.nomeGuerra ||

        usuarioLogado
            ?.login ||

        "—";


    elementos.responsavel.textContent =
        nomeResponsavel;

}


/* =========================================================
   BOTÕES
========================================================= */

function atualizarBotoes() {

    const carregada =
        Boolean(
            secaoAtual
        ) &&
        militares.length > 0;


    const realizada =
        chamadaAtual?.status ===
        "REALIZADA";


    elementos.btnMarcarTodos.disabled =
        !carregada ||
        realizada;


    elementos.btnSalvar.disabled =
        !carregada ||
        realizada;


    elementos.btnFinalizar.disabled =
        !carregada ||
        realizada;


    if (realizada) {

        elementos.painel.classList.add(
            "finalizada"
        );

    } else {

        elementos.painel.classList.remove(
            "finalizada"
        );

    }

}


/* =========================================================
   CLASSE DA LINHA
========================================================= */

function obterClasseLinha(
    situacaoId
) {

    if (!situacaoId) {

        return "linha-pendente";

    }


    const situacao =
        obterSituacaoPorId(
            situacaoId
        );


    return situacao?.disponivel
        ? "linha-disponivel"
        : "linha-indisponivel";

}


function atualizarClasseLinha(
    linha
) {

    const situacaoId =
        linha
            .querySelector(
                "[data-campo='situacao']"
            )
            ?.value;


    linha.classList.remove(

        "linha-disponivel",

        "linha-indisponivel",

        "linha-pendente"

    );


    linha.classList.add(
        obterClasseLinha(
            situacaoId
        )
    );

}


/* =========================================================
   BUSCAR SITUAÇÃO
========================================================= */

function obterSituacaoPorId(id) {

    return situacoes.find(
        situacao =>
            String(
                situacao.id
            ) ===
            String(id)
    );

}


/* =========================================================
   LIMPAR AO TROCAR DATA / SEÇÃO
========================================================= */

function limparTelaChamada() {

    chamadaAtual =
        null;


    secaoAtual =
        null;


    militares =
        [];


    registros =
        [];


    elementos.tituloSecao.textContent =
        "Efetivo da Seção";


    elementos.subtitulo.textContent =
        "Clique em Carregar Chamada para consultar o efetivo.";


    elementos.tabela.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="table-empty"
            >
                Clique em Carregar Chamada.
            </td>

        </tr>

    `;


    elementos.totalMilitares.textContent =
        "0";


    elementos.totalPresentes.textContent =
        "0";


    elementos.totalIndisponiveis.textContent =
        "0";


    elementos.totalPendentes.textContent =
        "0";


    elementos.responsavel.textContent =
        "—";


    atualizarStatus();

    atualizarBotoes();

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function definirCarregamento(
    carregando
) {

    elementos.btnCarregar.disabled =
        carregando;


    elementos.btnCarregar.textContent =
        carregando
            ? "Carregando..."
            : "Carregar Chamada";

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
        `chamada-message ${tipo}`;


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

function formatarData(data) {

    if (!data) {
        return "";
    }


    const [
        ano,
        mes,
        dia
    ] = data.split("-");


    return `${dia}/${mes}/${ano}`;

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