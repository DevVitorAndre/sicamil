import { authService } from "./services/authService.js";


const formulario =
    document.getElementById(
        "loginForm"
    );


const inputLogin =
    document.getElementById(
        "login"
    );


const inputSenha =
    document.getElementById(
        "senha"
    );


const botaoMostrarSenha =
    document.getElementById(
        "mostrarSenha"
    );


const botaoEntrar =
    formulario?.querySelector(
        ".btn-login"
    );


botaoMostrarSenha
    ?.addEventListener(
        "click",
        alternarSenha
    );


formulario
    ?.addEventListener(
        "submit",
        realizarLogin
    );


/* =========================================================
   MOSTRAR / OCULTAR SENHA
========================================================= */

function alternarSenha() {

    const senhaVisivel =
        inputSenha.type === "text";


    inputSenha.type =
        senhaVisivel
            ? "password"
            : "text";


    botaoMostrarSenha
        .setAttribute(

            "aria-label",

            senhaVisivel
                ? "Mostrar senha"
                : "Ocultar senha"

        );

}


/* =========================================================
   REALIZAR LOGIN
========================================================= */

async function realizarLogin(
    evento
) {

    evento.preventDefault();


    limparMensagem();


    const login =
        inputLogin.value.trim();


    const senha =
        inputSenha.value;


    if (!login) {

        mostrarMensagem(
            "Informe seu login.",
            "erro"
        );

        inputLogin.focus();

        return;

    }


    if (!senha) {

        mostrarMensagem(
            "Informe sua senha.",
            "erro"
        );

        inputSenha.focus();

        return;

    }


    definirCarregamento(
        true
    );


    try {

        const usuario =
            await authService.login(
                login,
                senha
            );


        const paginaInicial =
            obterPaginaInicial(
                usuario
            );


        window.location.href =
            paginaInicial;


    } catch (erro) {

        mostrarMensagem(
            erro.message ||
            "Não foi possível realizar o login.",
            "erro"
        );

    } finally {

        definirCarregamento(
            false
        );

    }

}


/* =========================================================
   DEFINIR PÁGINA INICIAL

   O usuário é direcionado para a primeira página
   que possuir permissão.

   Configurações fica disponível para todo usuário
   autenticado e funciona como página de fallback.
========================================================= */

function obterPaginaInicial(
    usuario
) {

    const paginas = [

        {
            permissao:
                "DASHBOARD_VISUALIZAR",

            pagina:
                "dashboard.html"
        },

        {
            permissao:
                "CHAMADA_REALIZAR",

            pagina:
                "chamada.html"
        },

        {
            permissao:
                "REGISTROS_VISUALIZAR",

            pagina:
                "registros.html"
        },

        {
            permissao:
                "PESQUISA_REALIZAR",

            pagina:
                "pesquisa.html"
        },

        {
            permissao:
                "USUARIOS_GERENCIAR",

            pagina:
                "usuarios.html"
        },

        {
            permissao:
                "SECOES_GERENCIAR",

            pagina:
                "secoes.html"
        },

        {
            permissao:
                "MILITARES_GERENCIAR",

            pagina:
                "militares.html"
        },

        {
            permissao:
                "RELATORIOS_EXPORTAR",

            pagina:
                "relatorios.html"
        }

    ];


    const paginaPermitida =
        paginas.find(
            item =>
                usuario.possuiPermissao(
                    item.permissao
                )
        );


    return (
        paginaPermitida
            ?.pagina ||
        "configuracoes.html"
    );

}


/* =========================================================
   CARREGAMENTO
========================================================= */

function definirCarregamento(
    carregando
) {

    if (!botaoEntrar) {

        return;

    }


    botaoEntrar.disabled =
        carregando;


    botaoEntrar.classList.toggle(
        "loading",
        carregando
    );


    const texto =
        botaoEntrar.querySelector(
            "span:first-child"
        );


    if (texto) {

        texto.textContent =
            carregando
                ? "Entrando..."
                : "Entrar";

    }

}


/* =========================================================
   MENSAGEM
========================================================= */

function mostrarMensagem(
    mensagem,
    tipo
) {

    let elemento =
        document.getElementById(
            "loginMensagem"
        );


    if (!elemento) {

        elemento =
            document.createElement(
                "div"
            );


        elemento.id =
            "loginMensagem";


        elemento.className =
            "login-message";


        formulario.prepend(
            elemento
        );

    }


    elemento.textContent =
        mensagem;


    elemento.dataset.tipo =
        tipo;

}


/* =========================================================
   LIMPAR MENSAGEM
========================================================= */

function limparMensagem() {

    document
        .getElementById(
            "loginMensagem"
        )
        ?.remove();

}