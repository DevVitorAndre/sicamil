import {
    carregarComponentes
} from "./components.js";


import {
    authService
} from "./services/authService.js";


import {
    configuracaoService
} from "./services/configuracaoService.js";



const CHAVE_TEMA =
    "sicamil-tema";


const CHAVE_DENSIDADE =
    "sicamil-densidade";


const elementos = {};


let mediaTemaEscuro = null;



document.addEventListener(
    "DOMContentLoaded",
    iniciar
);



/* =========================================================
   INICIAR
========================================================= */

async function iniciar() {

    try {

        aplicarPreferenciasSalvas();


        await authService
            .usuarioAtual();


        await carregarComponentes();


        mapearElementos();

        registrarEventos();

        carregarPreferenciasFormulario();


        const conta =
            await configuracaoService
                .buscarConta();


        preencherConta(
            conta
        );


        definirStatusSistema(
            true
        );


    } catch (erro) {

        console.error(
            "Erro ao iniciar Configurações:",
            erro
        );


        if (
            erro.status === 401
        ) {

            window.location.href =
                "index.html";

            return;

        }


        definirStatusSistema(
            false
        );


        exibirMensagem(
            erro.message ||
            "Não foi possível carregar as configurações.",
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
            "configMensagem"
        );


    elementos.nome =
        document.getElementById(
            "contaNome"
        );


    elementos.nomeGuerra =
        document.getElementById(
            "contaNomeGuerra"
        );


    elementos.avatar =
        document.getElementById(
            "contaAvatar"
        );


    elementos.login =
        document.getElementById(
            "contaLogin"
        );


    elementos.email =
        document.getElementById(
            "contaEmail"
        );


    elementos.tipo =
        document.getElementById(
            "contaTipo"
        );


    elementos.secao =
        document.getElementById(
            "contaSecao"
        );


    elementos.ultimoLogin =
        document.getElementById(
            "contaUltimoLogin"
        );


    elementos.status =
        document.getElementById(
            "contaStatus"
        );


    elementos.statusSistema =
        document.getElementById(
            "statusSistema"
        );


    elementos.senhaForm =
        document.getElementById(
            "senhaForm"
        );


    elementos.senhaAtual =
        document.getElementById(
            "senhaAtual"
        );


    elementos.novaSenha =
        document.getElementById(
            "novaSenha"
        );


    elementos.confirmarSenha =
        document.getElementById(
            "confirmarSenha"
        );


    elementos.btnAlterarSenha =
        document.getElementById(
            "btnAlterarSenha"
        );

}



/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {


    document
        .querySelectorAll(
            "[data-theme-option]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        selecionarTema(
                            botao.dataset
                                .themeOption
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            'input[name="densidade"]'
        )
        .forEach(
            radio => {

                radio.addEventListener(
                    "change",
                    () => {

                        selecionarDensidade(
                            radio.value
                        );

                    }
                );

            }
        );


    elementos.senhaForm
        ?.addEventListener(
            "submit",
            alterarSenha
        );

}



/* =========================================================
   CONTA
========================================================= */

function preencherConta(
    conta
) {

    elementos.nome.textContent =
        conta.nome ||
        "—";


    elementos.nomeGuerra.textContent =
        conta.nomeGuerra ||
        "—";


    elementos.login.textContent =
        conta.login ||
        "—";


    elementos.email.textContent =
        conta.email ||
        "—";


    elementos.tipo.textContent =
        formatarTipo(
            conta.tipo
        );


    elementos.secao.textContent =
        conta.secao
            ? (
                conta.secao.sigla ||
                conta.secao.nome
            )
            : "Sem seção";


    elementos.ultimoLogin.textContent =
        formatarDataHora(
            conta.ultimoLogin
        );


    elementos.status.textContent =
        conta.ativo
            ? "Ativo"
            : "Inativo";


    elementos.status.classList
        .toggle(
            "inactive",
            !conta.ativo
        );


    elementos.avatar.textContent =
        obterIniciais(
            conta.nomeGuerra ||
            conta.nome
        );

}



/* =========================================================
   ALTERAR SENHA
========================================================= */

async function alterarSenha(
    evento
) {

    evento.preventDefault();


    const senhaAtual =
        elementos.senhaAtual
            .value;


    const novaSenha =
        elementos.novaSenha
            .value;


    const confirmarSenha =
        elementos.confirmarSenha
            .value;


    if (
        !senhaAtual ||
        !novaSenha ||
        !confirmarSenha
    ) {

        exibirMensagem(
            "Preencha todos os campos da senha.",
            "error"
        );

        return;

    }


    if (
        novaSenha.length < 8
    ) {

        exibirMensagem(
            "A nova senha deve possuir pelo menos 8 caracteres.",
            "error"
        );

        return;

    }


    if (
        novaSenha !==
        confirmarSenha
    ) {

        exibirMensagem(
            "A confirmação da nova senha não confere.",
            "error"
        );

        return;

    }


    if (
        senhaAtual ===
        novaSenha
    ) {

        exibirMensagem(
            "A nova senha deve ser diferente da senha atual.",
            "error"
        );

        return;

    }


    definirCarregamentoSenha(
        true
    );


    try {

        const resposta =
            await configuracaoService
                .alterarSenha(
                    senhaAtual,
                    novaSenha
                );


        elementos.senhaForm
            .reset();


        exibirMensagem(
            resposta?.mensagem ||
            "Senha alterada com sucesso.",
            "success"
        );


    } catch (erro) {

        exibirMensagem(
            erro.message ||
            "Não foi possível alterar a senha.",
            "error"
        );


    } finally {

        definirCarregamentoSenha(
            false
        );

    }

}



function definirCarregamentoSenha(
    carregando
) {

    elementos.btnAlterarSenha
        .disabled =
        carregando;


    elementos.senhaAtual
        .disabled =
        carregando;


    elementos.novaSenha
        .disabled =
        carregando;


    elementos.confirmarSenha
        .disabled =
        carregando;


    elementos.btnAlterarSenha
        .textContent =
        carregando
            ? "Alterando..."
            : "Alterar senha";

}



/* =========================================================
   TEMA
========================================================= */

function aplicarPreferenciasSalvas() {

    const tema =
        localStorage.getItem(
            CHAVE_TEMA
        ) ||
        "light";


    const densidade =
        localStorage.getItem(
            CHAVE_DENSIDADE
        ) ||
        "normal";


    aplicarTema(
        tema
    );


    aplicarDensidade(
        densidade
    );

}



function carregarPreferenciasFormulario() {

    const tema =
        localStorage.getItem(
            CHAVE_TEMA
        ) ||
        "light";


    atualizarBotoesTema(
        tema
    );


    const densidade =
        localStorage.getItem(
            CHAVE_DENSIDADE
        ) ||
        "normal";


    const radio =
        document.querySelector(
            `input[name="densidade"][value="${densidade}"]`
        );


    if (radio) {

        radio.checked =
            true;

    }

}



function selecionarTema(
    tema
) {

    if (
        ![
            "light",
            "dark",
            "auto"
        ].includes(
            tema
        )
    ) {

        return;

    }


    localStorage.setItem(
        CHAVE_TEMA,
        tema
    );


    aplicarTema(
        tema
    );


    atualizarBotoesTema(
        tema
    );

}



function aplicarTema(
    tema
) {

    removerObservadorTema();


    if (
        tema === "auto"
    ) {

        mediaTemaEscuro =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );


        aplicarTemaResolvido(
            mediaTemaEscuro.matches
                ? "dark"
                : "light"
        );


        mediaTemaEscuro
            .addEventListener(
                "change",
                alterarTemaAutomatico
            );


        return;

    }


    aplicarTemaResolvido(
        tema
    );

}



function alterarTemaAutomatico(
    evento
) {

    aplicarTemaResolvido(
        evento.matches
            ? "dark"
            : "light"
    );

}



function aplicarTemaResolvido(
    tema
) {

    document.documentElement
        .dataset.theme =
        tema;

}



function removerObservadorTema() {

    if (!mediaTemaEscuro) {

        return;

    }


    mediaTemaEscuro
        .removeEventListener(
            "change",
            alterarTemaAutomatico
        );


    mediaTemaEscuro =
        null;

}



function atualizarBotoesTema(
    tema
) {

    document
        .querySelectorAll(
            "[data-theme-option]"
        )
        .forEach(
            botao => {

                botao.classList.toggle(
                    "active",
                    botao.dataset
                        .themeOption ===
                        tema
                );

            }
        );

}



/* =========================================================
   DENSIDADE
========================================================= */

function selecionarDensidade(
    densidade
) {

    if (
        ![
            "normal",
            "compact"
        ].includes(
            densidade
        )
    ) {

        return;

    }


    localStorage.setItem(
        CHAVE_DENSIDADE,
        densidade
    );


    aplicarDensidade(
        densidade
    );

}



function aplicarDensidade(
    densidade
) {

    document.documentElement
        .dataset.density =
        densidade;

}



/* =========================================================
   SISTEMA
========================================================= */

function definirStatusSistema(
    online
) {

    if (
        !elementos.statusSistema
    ) {

        return;

    }


    elementos.statusSistema
        .textContent =
        online
            ? "Online"
            : "Indisponível";


    elementos.statusSistema
        .classList.toggle(
            "system-offline",
            !online
        );


    elementos.statusSistema
        .classList.toggle(
            "system-online",
            online
        );

}



/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatarTipo(
    tipo
) {

    const tipos = {

        GERENTE:
            "Gerente",

        OPERACIONAL:
            "Operacional"

    };


    return (
        tipos[tipo] ||
        tipo ||
        "—"
    );

}



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

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    ).format(
        data
    );

}



function obterIniciais(
    nome = ""
) {

    const partes =
        nome
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (
        partes.length === 0
    ) {

        return "—";

    }


    if (
        partes.length === 1
    ) {

        return partes[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        partes[0][0] +
        partes[
            partes.length - 1
        ][0]
    ).toUpperCase();

}



/* =========================================================
   MENSAGENS
========================================================= */

function exibirMensagem(
    mensagem,
    tipo
) {

    if (
        !elementos.mensagem
    ) {

        return;

    }


    elementos.mensagem
        .hidden =
        false;


    elementos.mensagem
        .className =
        `config-message ${tipo}`;


    elementos.mensagem
        .textContent =
        mensagem;


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );


    window.setTimeout(
        () => {

            elementos.mensagem
                .hidden =
                true;

        },
        5000
    );

}