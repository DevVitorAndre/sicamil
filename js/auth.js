const loginForm = document.getElementById("loginForm");

const senha = document.getElementById("senha");

const mostrarSenha = document.getElementById("mostrarSenha");


mostrarSenha.addEventListener("click", () => {

    senha.type =
        senha.type === "password"
            ? "text"
            : "password";

});


loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const login = document
        .getElementById("login")
        .value
        .trim();

    const senhaInformada = senha
        .value
        .trim();


    if (!login || !senhaInformada) {

        alert(
            "Informe seu login e sua senha."
        );

        return;

    }


    /*
        TEMPORÁRIO

        Depois vamos substituir
        isso pela autenticação
        real no banco de dados.
    */

    window.location.href =
        "dashboard.html";

});