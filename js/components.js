import { sessionService } from "./services/sessionService.js";


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


    marcarPaginaAtual();

    preencherDataAtual();

    preencherUsuario();

}


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
            await fetch(caminho);


        if (!resposta.ok) {

            throw new Error(
                `Erro ao carregar ${caminho}`
            );

        }


        container.innerHTML =
            await resposta.text();

    } catch (erro) {

        console.error(erro);


        container.innerHTML =
            `
                <div class="component-error">
                    Não foi possível carregar este componente.
                </div>
            `;

    }

}


function marcarPaginaAtual() {

    const arquivo =

        window.location.pathname
            .split("/")
            .pop();


    document
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );


                const href =
                    item.getAttribute(
                        "href"
                    );


                if (href === arquivo) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );

}


function preencherDataAtual() {

    const agora =
        new Date();


    const diaSemana =
        document.getElementById(
            "diaSemana"
        );


    const dataAtual =
        document.getElementById(
            "dataAtual"
        );


    if (diaSemana) {

        diaSemana.textContent =
            agora.toLocaleDateString(
                "pt-BR",
                {
                    weekday:
                        "long"
                }
            );

    }


    if (dataAtual) {

        dataAtual.textContent =
            agora.toLocaleDateString(
                "pt-BR"
            );

    }

}


function preencherUsuario() {

    const usuario =
        sessionService
            .obterUsuario();


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


    const saudacao =
        document.getElementById(
            "usuarioSaudacao"
        );


    if (!usuario) {

        if (nome) {
            nome.textContent = "—";
        }

        if (tipo) {
            tipo.textContent = "—";
        }

        if (avatar) {
            avatar.textContent = "--";
        }

        return;

    }


    if (nome) {

        nome.textContent =
            usuario.nomeExibicao;

    }


    if (tipo) {

        tipo.textContent =
            usuario.tipo || "—";

    }


    if (avatar) {

        avatar.textContent =
            usuario.iniciais;

    }


    if (saudacao) {

        saudacao.textContent =
            usuario.nomeExibicao;

    }

}