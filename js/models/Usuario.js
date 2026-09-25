export class Usuario {

    constructor({
        id = null,
        nome = "",
        nomeGuerra = "",
        login = "",
        email = "",
        tipo = "",
        secao = null,
        permissoes = [],
        ativo = true
    } = {}) {

        this.id = id;

        this.nome = nome;

        this.nomeGuerra = nomeGuerra;

        this.login = login;

        this.email = email;

        this.tipo = tipo;

        this.secao = secao;

        this.permissoes = permissoes;

        this.ativo = ativo;

    }


    possuiPermissao(permissao) {

        return this.permissoes.includes(permissao);

    }


    get nomeExibicao() {

        return (
            this.nomeGuerra ||
            this.nome ||
            this.login
        );

    }


    get iniciais() {

        const nome =
            this.nomeExibicao.trim();

        if (!nome) {
            return "--";
        }


        const partes =
            nome
                .split(/\s+/)
                .filter(Boolean);


        if (partes.length === 1) {

            return partes[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            partes[0][0] +
            partes[partes.length - 1][0]
        ).toUpperCase();

    }

}