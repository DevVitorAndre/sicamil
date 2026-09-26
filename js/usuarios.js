import {
    carregarComponentes
} from "./components.js";

import {
    authService
} from "./services/authService.js";

import {
    usuarioService
} from "./services/usuarioService.js";


/* =========================================================
   ESTADO
========================================================= */

let usuarios = [];

let secoesDisponiveis = [];

let permissoesDisponiveis = [];

let usuarioEmEdicao = null;

let usuarioLogado = null;


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

        usuarioLogado =
            await authService.usuarioAtual();


        if (
            !usuarioLogado ||
            !usuarioLogado.possuiPermissao(
                "USUARIOS_GERENCIAR"
            )
        ) {

            window.location.href =
                "dashboard.html";

            return;

        }


        await carregarComponentes();


        mapearElementos();

        validarElementos();

        registrarEventos();


        await carregarOpcoes();

        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao iniciar Usuários:",
            erro
        );


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


        if (elementos.mensagem) {

            exibirMensagem(
                erro.message ||
                "Não foi possível carregar a página.",
                "error"
            );

        }

    }

}


/* =========================================================
   MAPEAR ELEMENTOS
========================================================= */

function mapearElementos() {

    elementos.btnNovoUsuario =
        document.getElementById(
            "btnNovoUsuario"
        );


    elementos.formulario =
        document.getElementById(
            "formularioUsuario"
        );


    elementos.form =
        document.getElementById(
            "usuarioForm"
        );


    elementos.usuarioId =
        document.getElementById(
            "usuarioId"
        );


    elementos.nome =
        document.getElementById(
            "usuarioNome"
        );


    elementos.nomeGuerra =
        document.getElementById(
            "usuarioNomeGuerra"
        );


    elementos.login =
        document.getElementById(
            "usuarioLogin"
        );


    elementos.email =
        document.getElementById(
            "usuarioEmail"
        );


    elementos.tipo =
        document.getElementById(
            "usuarioTipo"
        );


    elementos.secao =
        document.getElementById(
            "usuarioSecao"
        );


    elementos.senha =
        document.getElementById(
            "usuarioSenha"
        );


    elementos.grupoSenha =
        document.getElementById(
            "grupoSenha"
        );


    elementos.listaPermissoes =
        document.getElementById(
            "listaPermissoes"
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


    elementos.total =
        document.getElementById(
            "totalUsuarios"
        );


    elementos.pesquisa =
        document.getElementById(
            "pesquisaUsuario"
        );


    elementos.filtroTipo =
        document.getElementById(
            "filtroTipo"
        );


    elementos.filtroStatus =
        document.getElementById(
            "filtroStatus"
        );


    elementos.tabela =
        document.getElementById(
            "tabelaUsuarios"
        );


    elementos.mensagem =
        document.getElementById(
            "usuarioMensagem"
        );

}


/* =========================================================
   VALIDAR HTML
========================================================= */

function validarElementos() {

    const obrigatorios = {

        btnNovoUsuario:
            elementos.btnNovoUsuario,

        formulario:
            elementos.formulario,

        form:
            elementos.form,

        usuarioId:
            elementos.usuarioId,

        nome:
            elementos.nome,

        nomeGuerra:
            elementos.nomeGuerra,

        login:
            elementos.login,

        email:
            elementos.email,

        tipo:
            elementos.tipo,

        secao:
            elementos.secao,

        senha:
            elementos.senha,

        grupoSenha:
            elementos.grupoSenha,

        listaPermissoes:
            elementos.listaPermissoes,

        tituloFormulario:
            elementos.tituloFormulario,

        btnCancelar:
            elementos.btnCancelar,

        btnSalvar:
            elementos.btnSalvar,

        total:
            elementos.total,

        pesquisa:
            elementos.pesquisa,

        filtroTipo:
            elementos.filtroTipo,

        filtroStatus:
            elementos.filtroStatus,

        tabela:
            elementos.tabela,

        mensagem:
            elementos.mensagem

    };


    const faltando =
        Object.entries(
            obrigatorios
        )
            .filter(
                ([, elemento]) =>
                    !elemento
            )
            .map(
                ([nome]) =>
                    nome
            );


    if (
        faltando.length > 0
    ) {

        throw new Error(
            `Elementos não encontrados no usuarios.html: ${faltando.join(", ")}`
        );

    }

}


/* =========================================================
   EVENTOS
========================================================= */

function registrarEventos() {

    elementos.btnNovoUsuario
        .addEventListener(
            "click",
            abrirNovoUsuario
        );


    elementos.btnCancelar
        .addEventListener(
            "click",
            fecharFormulario
        );


    elementos.form
        .addEventListener(
            "submit",
            salvarUsuario
        );


    elementos.tipo
        .addEventListener(
            "change",
            atualizarRegraSecao
        );


    elementos.pesquisa
        .addEventListener(
            "input",
            aplicarFiltros
        );


    elementos.filtroTipo
        .addEventListener(
            "change",
            aplicarFiltros
        );


    elementos.filtroStatus
        .addEventListener(
            "change",
            aplicarFiltros
        );

}


/* =========================================================
   OPÇÕES DO FORMULÁRIO
========================================================= */

async function carregarOpcoes() {

    try {

        const resposta =
            await usuarioService
                .buscarOpcoes();


        secoesDisponiveis =
            Array.isArray(
                resposta.secoes
            )
                ? resposta.secoes
                : [];


        permissoesDisponiveis =
            Array.isArray(
                resposta.permissoes
            )
                ? resposta.permissoes
                : [];


        renderizarSecoes();

        renderizarPermissoes();


    } catch (erro) {

        if (
            tratarErroAutorizacao(
                erro
            )
        ) {

            return;

        }


        throw erro;

    }

}


/* =========================================================
   SEÇÕES
========================================================= */

function renderizarSecoes() {

    elementos.secao.innerHTML =
        "";


    const opcaoSemSecao =
        document.createElement(
            "option"
        );


    opcaoSemSecao.value =
        "";


    opcaoSemSecao.textContent =
        "Sem seção";


    elementos.secao.appendChild(
        opcaoSemSecao
    );


    for (
        const secao
        of secoesDisponiveis
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            String(
                secao.id ?? ""
            );


        const sigla =
            String(
                secao.sigla ?? ""
            );


        const nome =
            String(
                secao.nome ?? ""
            );


        option.textContent =
            sigla
                ? `${sigla} - ${nome}`
                : nome;


        elementos.secao.appendChild(
            option
        );

    }

}


/* =========================================================
   PERMISSÕES
========================================================= */

function renderizarPermissoes() {

    if (
        permissoesDisponiveis.length === 0
    ) {

        elementos.listaPermissoes.innerHTML = `
            <div class="permissions-loading">
                Nenhuma permissão cadastrada.
            </div>
        `;

        return;

    }


    elementos.listaPermissoes.innerHTML =
        permissoesDisponiveis
            .map(
                permissao => {

                    const codigo =
                        escaparHTML(
                            permissao.codigo
                        );


                    const nome =
                        escaparHTML(
                            permissao.nome
                        );


                    return `
                        <label class="permission-item">

                            <input
                                type="checkbox"
                                value="${codigo}"
                                data-permission-checkbox
                            >

                            <span class="permission-content">

                                <strong>
                                    ${nome}
                                </strong>

                            </span>

                        </label>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   CARREGAR USUÁRIOS
========================================================= */

async function carregarUsuarios() {

    exibirCarregamento();


    try {

        usuarios =
            await usuarioService.listar();


        if (
            !Array.isArray(
                usuarios
            )
        ) {

            usuarios = [];

        }


        elementos.total.textContent =
            usuarios.length;


        aplicarFiltros();


    } catch (erro) {

        if (
            tratarErroAutorizacao(
                erro
            )
        ) {

            return;

        }


        elementos.tabela.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="table-empty"
                >
                    Não foi possível carregar os usuários.
                </td>

            </tr>
        `;


        exibirMensagem(
            erro.message ||
            "Erro ao carregar usuários.",
            "error"
        );

    }

}


/* =========================================================
   FILTROS
========================================================= */

function aplicarFiltros() {

    const pesquisa =
        String(
            elementos.pesquisa?.value ??
            ""
        )
            .trim()
            .toLowerCase();


    const tipo =
        String(
            elementos.filtroTipo?.value ??
            "TODOS"
        );


    const status =
        String(
            elementos.filtroStatus?.value ??
            "TODOS"
        );


    const filtrados =
        usuarios.filter(
            usuario => {

                const nome =
                    String(
                        usuario.nome ??
                        ""
                    )
                        .toLowerCase();


                const nomeGuerra =
                    String(
                        usuario.nomeGuerra ??
                        ""
                    )
                        .toLowerCase();


                const login =
                    String(
                        usuario.login ??
                        ""
                    )
                        .toLowerCase();


                const email =
                    String(
                        usuario.email ??
                        ""
                    )
                        .toLowerCase();


                const textoSecao =
                    usuario.secao
                        ? `${usuario.secao.sigla ?? ""} ${usuario.secao.nome ?? ""}`
                            .toLowerCase()
                        : "";


                const correspondePesquisa =
                    !pesquisa ||
                    nome.includes(
                        pesquisa
                    ) ||
                    nomeGuerra.includes(
                        pesquisa
                    ) ||
                    login.includes(
                        pesquisa
                    ) ||
                    email.includes(
                        pesquisa
                    ) ||
                    textoSecao.includes(
                        pesquisa
                    );


                const correspondeTipo =
                    tipo === "TODOS" ||
                    usuario.tipo === tipo;


                let correspondeStatus =
                    true;


                if (
                    status === "ATIVOS"
                ) {

                    correspondeStatus =
                        usuario.ativo === true;

                }


                if (
                    status === "INATIVOS"
                ) {

                    correspondeStatus =
                        usuario.ativo === false;

                }


                return (
                    correspondePesquisa &&
                    correspondeTipo &&
                    correspondeStatus
                );

            }
        );


    renderizarTabela(
        filtrados
    );

}


/* =========================================================
   TABELA
========================================================= */

function renderizarTabela(lista) {

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        elementos.tabela.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="table-empty"
                >
                    Nenhum usuário encontrado.
                </td>

            </tr>
        `;

        return;

    }


    elementos.tabela.innerHTML =
        lista
            .map(
                usuario => {

                    const id =
                        escaparHTML(
                            usuario.id
                        );


                    const ehUsuarioAtual =
                        String(
                            usuario.id
                        ) ===
                        String(
                            usuarioLogado?.id
                        );


                    const nomeExibicao =
                        escaparHTML(
                            usuario.nomeGuerra ||
                            usuario.nome ||
                            "Usuário"
                        );


                    const nomeCompleto =
                        escaparHTML(
                            usuario.nome ||
                            ""
                        );


                    const login =
                        escaparHTML(
                            usuario.login ||
                            ""
                        );


                    const status =
                        usuario.ativo
                            ? "Ativo"
                            : "Inativo";


                    const classeStatus =
                        usuario.ativo
                            ? "active"
                            : "inactive";


                    const tipoGerente =
                        usuario.tipo ===
                        "GERENTE";


                    const classeTipo =
                        tipoGerente
                            ? "manager"
                            : "operational";


                    const tipoTexto =
                        tipoGerente
                            ? "Gerente"
                            : "Operacional";


                    const secao =
                        usuario.secao
                            ? escaparHTML(
                                usuario.secao
                                    .sigla ||
                                usuario.secao
                                    .nome ||
                                ""
                            )
                            : "—";


                    const acaoStatus =
                        usuario.ativo
                            ? "Desativar"
                            : "Ativar";


                    const botoesSecundarios =
                        ehUsuarioAtual
                            ? `
                                <span class="current-account">
                                    Conta atual
                                </span>
                            `
                            : `
                                <button
                                    type="button"
                                    class="
                                        btn-action
                                        status
                                    "
                                    data-action="status"
                                    data-id="${id}"
                                >
                                    ${acaoStatus}
                                </button>

                                <button
                                    type="button"
                                    class="
                                        btn-action
                                        delete
                                    "
                                    data-action="excluir"
                                    data-id="${id}"
                                >
                                    Excluir
                                </button>
                            `;


                    return `
                        <tr>

                            <td>

                                <span class="user-name">
                                    ${nomeExibicao}
                                </span>

                                <span class="user-full-name">
                                    ${nomeCompleto}
                                </span>

                            </td>


                            <td>
                                ${login}
                            </td>


                            <td>

                                <span
                                    class="
                                        type-badge
                                        ${classeTipo}
                                    "
                                >
                                    ${tipoTexto}
                                </span>

                            </td>


                            <td>
                                ${secao}
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
                                        data-id="${id}"
                                    >
                                        Editar
                                    </button>

                                    ${botoesSecundarios}

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
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        editarUsuario(
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
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        alterarStatusUsuario(
                            botao.dataset.id
                        );

                    }
                );

            }
        );


    elementos.tabela
        .querySelectorAll(
            "[data-action='excluir']"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        excluirUsuario(
                            botao.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   NOVO USUÁRIO
========================================================= */

function abrirNovoUsuario() {

    usuarioEmEdicao =
        null;


    elementos.form.reset();


    elementos.usuarioId.value =
        "";


    elementos.tituloFormulario.textContent =
        "Novo Usuário";


    elementos.btnSalvar.textContent =
        "Salvar Usuário";


    elementos.grupoSenha.hidden =
        false;


    elementos.senha.required =
        true;


    elementos.senha.value =
        "";


    elementos.tipo.disabled =
        false;


    limparPermissoes();


    elementos.formulario.hidden =
        false;


    atualizarRegraSecao();


    ocultarMensagem();


    elementos.nome.focus();


    rolarParaFormulario();

}


/* =========================================================
   EDITAR USUÁRIO
========================================================= */

function editarUsuario(id) {

    const usuario =
        usuarios.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (!usuario) {

        exibirMensagem(
            "Usuário não encontrado.",
            "error"
        );

        return;

    }


    usuarioEmEdicao =
        usuario;


    elementos.usuarioId.value =
        usuario.id ?? "";


    elementos.nome.value =
        usuario.nome ?? "";


    elementos.nomeGuerra.value =
        usuario.nomeGuerra ?? "";


    elementos.login.value =
        usuario.login ?? "";


    elementos.email.value =
        usuario.email ?? "";


    elementos.tipo.value =
        usuario.tipo ?? "";


    elementos.secao.value =
        usuario.secao?.id ?? "";


    elementos.tituloFormulario.textContent =
        "Editar Usuário";


    elementos.btnSalvar.textContent =
        "Salvar Alterações";


    /*
     * Senha não é alterada nesta edição.
     */
    elementos.grupoSenha.hidden =
        true;


    elementos.senha.required =
        false;


    elementos.senha.value =
        "";


    marcarPermissoes(
        usuario.permissoes ||
        []
    );


    elementos.formulario.hidden =
        false;


    atualizarRegraSecao();

    protegerPermissaoPropria();


    ocultarMensagem();


    elementos.nome.focus();


    rolarParaFormulario();

}


/* =========================================================
   SALVAR USUÁRIO
========================================================= */

async function salvarUsuario(evento) {

    evento.preventDefault();


    /*
     * Pega diretamente o formulário que disparou o submit.
     * Assim garantimos que os dados lidos são exatamente
     * os campos que estão aparecendo na tela.
     */
    const formulario =
        evento.currentTarget;


    const campoNome =
        formulario.querySelector(
            "#usuarioNome"
        );


    const campoNomeGuerra =
        formulario.querySelector(
            "#usuarioNomeGuerra"
        );


    const campoLogin =
        formulario.querySelector(
            "#usuarioLogin"
        );


    const campoEmail =
        formulario.querySelector(
            "#usuarioEmail"
        );


    const campoTipo =
        formulario.querySelector(
            "#usuarioTipo"
        );


    const campoSecao =
        formulario.querySelector(
            "#usuarioSecao"
        );


    const campoSenha =
        formulario.querySelector(
            "#usuarioSenha"
        );


    /* =====================================================
       VALORES
    ===================================================== */

    const nome =
        String(
            campoNome?.value ?? ""
        ).trim();


    const nomeGuerra =
        String(
            campoNomeGuerra?.value ?? ""
        ).trim();


    const login =
        String(
            campoLogin?.value ?? ""
        ).trim();


    const email =
        String(
            campoEmail?.value ?? ""
        ).trim();


    const tipo =
        String(
            campoTipo?.value ?? ""
        ).trim();


    const valorSecao =
        String(
            campoSecao?.value ?? ""
        ).trim();


    const secaoId =
        valorSecao
            ? Number(
                valorSecao
            )
            : null;


    const permissoes =
        obterPermissoesMarcadas();


    /* =====================================================
       CAMPOS OBRIGATÓRIOS
    ===================================================== */

    const camposFaltando = [];


    if (!nome) {

        camposFaltando.push(
            "Nome Completo"
        );

    }

    if (!nomeGuerra) {

        camposFaltando.push(
            "Nome de Guerra"
        );

    }


    if (!login) {

        camposFaltando.push(
            "Login"
        );

    }


    if (!email) {

        camposFaltando.push(
            "E-mail"
        );

    }


    if (!tipo) {

        camposFaltando.push(
            "Tipo de Usuário"
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


    /* =====================================================
       SEÇÃO
    ===================================================== */

    if (
        tipo === "OPERACIONAL" &&
        !secaoId
    ) {

        exibirMensagem(
            "Usuário operacional deve estar vinculado a uma seção.",
            "error"
        );

        return;

    }


    /* =====================================================
       E-MAIL
    ===================================================== */

    if (
        !emailValido(
            email
        )
    ) {

        exibirMensagem(
            "Informe um e-mail válido.",
            "error"
        );

        return;

    }


    /* =====================================================
       CRIAÇÃO - SENHA
    ===================================================== */

    let senha = "";


    if (
        !usuarioEmEdicao
    ) {

        senha =
            String(
                campoSenha?.value ?? ""
            );


        if (
            senha.length < 8
        ) {

            exibirMensagem(
                "A senha inicial deve possuir pelo menos 8 caracteres.",
                "error"
            );

            return;

        }

    }


    definirFormularioCarregando(
        true
    );


    try {

        /* =================================================
           EDITAR
        ================================================= */

        if (
            usuarioEmEdicao
        ) {

            const resultado =
                await usuarioService.editar(
                    usuarioEmEdicao.id,
                    {
                        nome,
                        nomeGuerra,
                        login,
                        email,
                        tipo,
                        secaoId
                    }
                );


            await usuarioService
                .alterarPermissoes(
                    usuarioEmEdicao.id,
                    permissoes
                );


            exibirMensagem(
                resultado.mensagem ||
                "Usuário atualizado com sucesso.",
                "success"
            );

        }


        /* =================================================
           CADASTRAR
        ================================================= */

        else {

            const resultado =
                await usuarioService
                    .cadastrar(
                        {
                            nome,
                            nomeGuerra,
                            login,
                            email,
                            senha,
                            tipo,
                            secaoId,
                            permissoes
                        }
                    );


            exibirMensagem(
                resultado.mensagem ||
                "Usuário cadastrado com sucesso.",
                "success"
            );

        }


        fecharFormulario(
            false
        );


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao salvar usuário:",
            erro
        );


        exibirMensagem(
            erro.message ||
            "Não foi possível salvar o usuário.",
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

async function alterarStatusUsuario(id) {

    const usuario =
        usuarios.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (!usuario) {

        exibirMensagem(
            "Usuário não encontrado.",
            "error"
        );

        return;

    }


    const novoStatus =
        !usuario.ativo;


    const acao =
        novoStatus
            ? "ativar"
            : "desativar";


    const nome =
        usuario.nomeGuerra ||
        usuario.nome ||
        "este usuário";


    const confirmou =
        window.confirm(
            `Deseja realmente ${acao} o usuário ${nome}?`
        );


    if (!confirmou) {

        return;

    }


    try {

        const resultado =
            await usuarioService
                .alterarStatus(
                    usuario.id,
                    novoStatus
                );


        exibirMensagem(
            resultado.mensagem,
            "success"
        );


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );


        if (
            tratarErroAutorizacao(
                erro
            )
        ) {

            return;

        }


        exibirMensagem(
            erro.message ||
            "Não foi possível alterar o status do usuário.",
            "error"
        );

    }

}


/* =========================================================
   EXCLUIR USUÁRIO
========================================================= */

async function excluirUsuario(id) {

    const usuario =
        usuarios.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );


    if (!usuario) {

        exibirMensagem(
            "Usuário não encontrado.",
            "error"
        );

        return;

    }


    /*
     * Proteção adicional no frontend.
     * O backend também deve bloquear.
     */
    if (
        String(
            usuario.id
        ) ===
        String(
            usuarioLogado?.id
        )
    ) {

        exibirMensagem(
            "Você não pode excluir sua própria conta.",
            "error"
        );

        return;

    }


    const nome =
        usuario.nomeGuerra ||
        usuario.nome ||
        "este usuário";


    const confirmou =
        window.confirm(
            `ATENÇÃO!\n\nDeseja excluir definitivamente o usuário ${nome}?\n\nEsta ação não poderá ser desfeita.`
        );


    if (!confirmou) {

        return;

    }


    try {

        const resposta =
            await usuarioService.excluir(
                usuario.id
            );


        /*
         * Se estava editando justamente o usuário excluído,
         * fecha o formulário.
         */
        if (
            usuarioEmEdicao &&
            String(
                usuarioEmEdicao.id
            ) ===
            String(
                usuario.id
            )
        ) {

            fecharFormulario(
                false
            );

        }


        exibirMensagem(
            resposta.mensagem ||
            "Usuário excluído com sucesso.",
            "success"
        );


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao excluir usuário:",
            erro
        );


        if (
            tratarErroAutorizacao(
                erro
            )
        ) {

            return;

        }


        exibirMensagem(
            erro.message ||
            "Não foi possível excluir o usuário.",
            "error"
        );

    }

}


/* =========================================================
   REGRA DA SEÇÃO
========================================================= */

function atualizarRegraSecao() {

    const tipo =
        obterTextoCampo(
            elementos.tipo
        );


    const operacional =
        tipo ===
        "OPERACIONAL";


    elementos.secao.required =
        operacional;

}


/* =========================================================
   PERMISSÕES MARCADAS
========================================================= */

function obterPermissoesMarcadas() {

    if (
        !elementos.listaPermissoes
    ) {

        return [];

    }


    return [
        ...elementos.listaPermissoes
            .querySelectorAll(
                "[data-permission-checkbox]:checked"
            )
    ]
        .map(
            checkbox =>
                String(
                    checkbox.value ??
                    ""
                ).trim()
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   LIMPAR PERMISSÕES
========================================================= */

function limparPermissoes() {

    elementos.listaPermissoes
        .querySelectorAll(
            "[data-permission-checkbox]"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;


                checkbox.disabled =
                    false;

            }
        );

}


/* =========================================================
   MARCAR PERMISSÕES
========================================================= */

function marcarPermissoes(
    permissoes
) {

    limparPermissoes();


    const lista =
        Array.isArray(
            permissoes
        )
            ? permissoes
            : [];


    elementos.listaPermissoes
        .querySelectorAll(
            "[data-permission-checkbox]"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    lista.includes(
                        checkbox.value
                    );

            }
        );

}


/* =========================================================
   PROTEGER PERMISSÃO DA PRÓPRIA CONTA
========================================================= */

function protegerPermissaoPropria() {

    if (
        !usuarioEmEdicao ||
        String(
            usuarioEmEdicao.id
        ) !==
        String(
            usuarioLogado?.id
        )
    ) {

        return;

    }


    const checkbox =
        elementos.listaPermissoes
            .querySelector(
                '[value="USUARIOS_GERENCIAR"]'
            );


    if (checkbox) {

        checkbox.checked =
            true;


        checkbox.disabled =
            true;

    }

}


/* =========================================================
   FECHAR FORMULÁRIO
========================================================= */

function fecharFormulario(
    ocultarMensagemAtual = true
) {

    usuarioEmEdicao =
        null;


    elementos.form.reset();


    elementos.usuarioId.value =
        "";


    elementos.grupoSenha.hidden =
        false;


    elementos.senha.required =
        false;


    elementos.senha.value =
        "";


    elementos.tipo.disabled =
        false;


    limparPermissoes();


    elementos.formulario.hidden =
        true;


    if (
        ocultarMensagemAtual
    ) {

        ocultarMensagem();

    }

}


/* =========================================================
   FORMULÁRIO CARREGANDO
========================================================= */

function definirFormularioCarregando(
    carregando
) {

    elementos.btnSalvar.disabled =
        carregando;


    elementos.btnCancelar.disabled =
        carregando;


    elementos.nome.disabled =
        carregando;


    elementos.nomeGuerra.disabled =
        carregando;


    elementos.login.disabled =
        carregando;


    elementos.email.disabled =
        carregando;


    elementos.tipo.disabled =
        carregando;


    elementos.secao.disabled =
        carregando;


    elementos.senha.disabled =
        carregando;


    elementos.listaPermissoes
        .querySelectorAll(
            "[data-permission-checkbox]"
        )
        .forEach(
            checkbox => {

                /*
                 * Mantém a proteção da própria permissão
                 * depois que o carregamento terminar.
                 */
                if (carregando) {

                    checkbox.disabled =
                        true;

                } else {

                    checkbox.disabled =
                        false;

                }

            }
        );


    elementos.btnSalvar.textContent =
        carregando
            ? "Salvando..."
            : (
                usuarioEmEdicao
                    ? "Salvar Alterações"
                    : "Salvar Usuário"
            );


    if (
        !carregando
    ) {

        protegerPermissaoPropria();

    }

}


/* =========================================================
   CARREGAMENTO DA TABELA
========================================================= */

function exibirCarregamento() {

    elementos.tabela.innerHTML = `
        <tr>

            <td
                colspan="6"
                class="table-empty"
            >
                Carregando usuários...
            </td>

        </tr>
    `;

}


/* =========================================================
   MENSAGENS
========================================================= */

function exibirMensagem(
    mensagem,
    tipo = "error"
) {

    if (
        !elementos.mensagem
    ) {

        console.log(
            mensagem
        );

        return;

    }


    elementos.mensagem.hidden =
        false;


    elementos.mensagem.textContent =
        String(
            mensagem ??
            ""
        );


    elementos.mensagem.className =
        `usuario-message ${tipo}`;

}


/* =========================================================
   OCULTAR MENSAGEM
========================================================= */

function ocultarMensagem() {

    if (
        !elementos.mensagem
    ) {

        return;

    }


    elementos.mensagem.hidden =
        true;


    elementos.mensagem.textContent =
        "";


    elementos.mensagem.className =
        "usuario-message";

}


/* =========================================================
   TRATAR 401 / 403
========================================================= */

function tratarErroAutorizacao(
    erro
) {

    if (
        erro?.status === 401
    ) {

        window.location.href =
            "index.html";

        return true;

    }


    if (
        erro?.status === 403
    ) {

        window.location.href =
            "dashboard.html";

        return true;

    }


    return false;

}


/* =========================================================
   VALOR DE CAMPO
========================================================= */

function obterTextoCampo(
    elemento
) {

    return String(
        elemento?.value ??
        ""
    ).trim();

}


/* =========================================================
   E-MAIL
========================================================= */

function emailValido(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            email
        );

}


/* =========================================================
   SCROLL
========================================================= */

function rolarParaFormulario() {

    elementos.formulario
        .scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
        );

}


/* =========================================================
   SEGURANÇA HTML
========================================================= */

function escaparHTML(
    valor
) {

    return String(
        valor ??
        ""
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