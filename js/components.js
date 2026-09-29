import "./theme.js";


import {
    sessionService
} from "./services/sessionService.js";


import {
    api
} from "./services/api.js";


import {
    CONFIG
} from "./config.js";


/* =========================================================
   CARREGAR COMPONENTES
========================================================= */

export async function carregarComponentes() {

    await Promise.all([

        carregarComponente(
            "sidebar-container",
            "components/sidebar.html"
        ),

        carregarComponente(
            "header-container",
            "components/header.html"
        )

    ]);


    aplicarPermissoesMenu();

    marcarPaginaAtual();

    preencherDataAtual();

    preencherUsuario();

    configurarBotaoSair();

}


/* =========================================================
   CARREGAR COMPONENTE
========================================================= */

async function carregarComponente(
    containerId,
    caminho
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {

        return;

    }


    try {

        const resposta =
            await fetch(
                caminho
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro ao carregar ${caminho}`
            );

        }


        const html =
            await resposta.text();


        container.innerHTML =
            html;


    } catch (erro) {

        console.error(
            erro
        );


        container.innerHTML = `
            <div class="component-error">
                Não foi possível carregar este componente.
            </div>
        `;

    }

}


/* =========================================================
   PERMISSÕES DO MENU
========================================================= */

function aplicarPermissoesMenu() {

    const usuario =
        sessionService.obter();


    if (!usuario) {

        return;

    }


    const itensProtegidos =
        document.querySelectorAll(
            "[data-permission]"
        );


    itensProtegidos.forEach(
        item => {

            const permissao =
                item.dataset.permission;


            const autorizado =
                usuario.possuiPermissao(
                    permissao
                );


            item.hidden =
                !autorizado;

        }
    );


    ajustarTituloCadastros();

}


/* =========================================================
   ESCONDER CADASTROS CASO NÃO HAJA OPÇÕES
========================================================= */

function ajustarTituloCadastros() {

    const titulo =
        document.getElementById(
            "menuCadastrosTitulo"
        );


    if (!titulo) {

        return;

    }


    const itens =
        document.querySelectorAll(
            ".menu-cadastro"
        );


    const existeItemVisivel =
        Array
            .from(
                itens
            )
            .some(
                item =>
                    !item.hidden
            );


    titulo.hidden =
        !existeItemVisivel;

}


/* =========================================================
   PÁGINA ATUAL
========================================================= */

function marcarPaginaAtual() {

    const paginaAtual =
        window.location.pathname
            .split("/")
            .pop() ||
        "dashboard.html";


    const links =
        document.querySelectorAll(
            ".sidebar-menu a"
        );


    links.forEach(
        link => {

            const destino =
                link
                    .getAttribute(
                        "href"
                    )
                    ?.split("/")
                    .pop();


            if (
                destino ===
                paginaAtual
            ) {

                link.classList.add(
                    "active"
                );

            } else {

                link.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   DATA
========================================================= */

function preencherDataAtual() {

    const diaSemana =
        document.getElementById(
            "diaSemana"
        );


    const dataAtual =
        document.getElementById(
            "dataAtual"
        );


    const agora =
        new Date();


    if (diaSemana) {

        const texto =
            agora.toLocaleDateString(
                "pt-BR",
                {
                    weekday:
                        "long"
                }
            );


        diaSemana.textContent =
            texto.charAt(0)
                .toUpperCase() +
            texto.slice(1);

    }


    if (dataAtual) {

        dataAtual.textContent =
            agora.toLocaleDateString(
                "pt-BR"
            );

    }

}


/* =========================================================
   USUÁRIO
========================================================= */

function preencherUsuario() {

    const usuario =
        sessionService.obter();


    if (!usuario) {

        return;

    }


    const saudacao =
        document.getElementById(
            "usuarioSaudacao"
        );


    const nome =
        document.getElementById(
            "usuarioNome"
        );


    const tipo =
        document.getElementById(
            "usuarioTipo"
        );


    const avatar =
        document.getElementById(
            "usuarioAvatar"
        );


    const nomeGuerra =
        usuario.nomeGuerra ||
        usuario.nome ||
        usuario.login ||
        "Usuário";


    /*
        Quando o backend enviar algo como:

        postoGraduacao: {
            sigla: "3S"
        }

        automaticamente aparecerá:

        3S VITOR ANDRÉ
    */

    const postoGraduacao =
        usuario.postoGraduacao
            ?.sigla ||
        "";


    const identificacao =
        [
            postoGraduacao,
            nomeGuerra
        ]
            .filter(
                Boolean
            )
            .join(
                " "
            );


    if (saudacao) {

        saudacao.textContent =
            nomeGuerra;

    }


    if (nome) {

        nome.textContent =
            identificacao;

    }


    if (tipo) {

        tipo.textContent =
            formatarTipoUsuario(
                usuario.tipo
            );

    }


    if (avatar) {

        avatar.textContent =
            usuario.iniciais ||
            obterIniciais(
                nomeGuerra
            );

    }

}


/* =========================================================
   INICIAIS
========================================================= */

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

        return "--";

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
   BOTÃO SAIR
========================================================= */

function configurarBotaoSair() {

    const botao =
        document.getElementById(
            "btnSairSistema"
        );


    if (!botao) {

        return;

    }


    botao.addEventListener(
        "click",
        async () => {

            if (
                botao.disabled
            ) {

                return;

            }


            botao.disabled =
                true;


            botao.textContent =
                "Saindo...";


            try {

                await api.post(
                    CONFIG.ROTAS.logout
                );


                window.location.href =
                    "index.html";


            } catch (erro) {

                console.error(
                    "Erro ao sair do SICAMIL:",
                    erro
                );


                botao.disabled =
                    false;


                botao.textContent =
                    "Sair";


                window.alert(
                    erro.message ||
                    "Não foi possível encerrar a sessão."
                );

            }

        }
    );

}


/* =========================================================
   FORMATAR TIPO
========================================================= */

function formatarTipoUsuario(
    tipo
) {

    if (!tipo) {

        return "—";

    }


    return tipo
        .replaceAll(
            "_",
            " "
        )
        .toLowerCase()
        .replace(
            /\b\w/g,
            letra =>
                letra.toUpperCase()
        );

}