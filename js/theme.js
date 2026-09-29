/* =========================================================
   SICAMIL - TEMA GLOBAL
========================================================= */

const CHAVE_TEMA =
    "sicamil-tema";


const CHAVE_DENSIDADE =
    "sicamil-densidade";


const mediaTemaEscuro =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );


/* =========================================================
   CSS GLOBAL DE TEMA
========================================================= */

function carregarCssTema() {

    if (
        document.querySelector(
            'link[data-sicamil-theme]'
        )
    ) {

        return;

    }


    const link =
        document.createElement(
            "link"
        );


    link.rel =
        "stylesheet";


    link.href =
        new URL(
            "../css/theme.css",
            import.meta.url
        ).href;


    link.dataset.sicamilTheme =
        "true";


    document.head.appendChild(
        link
    );

}


/* =========================================================
   TEMA
========================================================= */

function aplicarTemaGlobal() {

    const preferencia =
        localStorage.getItem(
            CHAVE_TEMA
        ) ||
        "light";


    let temaFinal =
        preferencia;


    if (
        preferencia ===
        "auto"
    ) {

        temaFinal =
            mediaTemaEscuro.matches
                ? "dark"
                : "light";

    }


    document.documentElement
        .dataset.theme =
        temaFinal;

}


/* =========================================================
   DENSIDADE
========================================================= */

function aplicarDensidadeGlobal() {

    const densidade =
        localStorage.getItem(
            CHAVE_DENSIDADE
        ) ||
        "normal";


    document.documentElement
        .dataset.density =
        densidade;

}


/* =========================================================
   ALTERAÇÃO AUTOMÁTICA WINDOWS
========================================================= */

mediaTemaEscuro
    .addEventListener(
        "change",
        () => {

            const preferencia =
                localStorage.getItem(
                    CHAVE_TEMA
                );


            if (
                preferencia ===
                "auto"
            ) {

                aplicarTemaGlobal();

            }

        }
    );


/* =========================================================
   ALTERAÇÕES EM OUTRAS ABAS
========================================================= */

window.addEventListener(
    "storage",
    evento => {

        if (
            evento.key ===
            CHAVE_TEMA
        ) {

            aplicarTemaGlobal();

        }


        if (
            evento.key ===
            CHAVE_DENSIDADE
        ) {

            aplicarDensidadeGlobal();

        }

    }
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

carregarCssTema();

aplicarTemaGlobal();

aplicarDensidadeGlobal();