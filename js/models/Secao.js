export class Secao {

    constructor({
        id = null,
        nome = "",
        sigla = "",
        ativa = true
    } = {}) {

        this.id = id;

        this.nome = nome;

        this.sigla = sigla;

        this.ativa = ativa;

    }


    get descricao() {

        if (
            this.sigla &&
            this.nome
        ) {

            return `${this.sigla} - ${this.nome}`;

        }


        return (
            this.sigla ||
            this.nome
        );

    }

}