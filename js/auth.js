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


    definirCarregamento(true);


    try {

        await authService.login(
            login,
            senha
        );


        window.location.href =
            "dashboard.html";

    } catch (erro) {

        mostrarMensagem(
            erro.message,
            "erro"
        );

    } finally {

        definirCarregamento(false);

    }

}


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


function limparMensagem() {

    document
        .getElementById(
            "loginMensagem"
        )
        ?.remove();

}