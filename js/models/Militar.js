import { Secao } from "./Secao.js";


export class Militar {

    constructor({
        id = null,
        postoGraduacao = "",
        nomeGuerra = "",
        secao = null,
        situacao = null,
        disponivel = false
    } = {}) {

        this.id = id;

        this.postoGraduacao =
            postoGraduacao;

        this.nomeGuerra =
            nomeGuerra;


        this.secao =
            secao
                ? new Secao(secao)
                : null;


        this.situacao =
            situacao;

        this.disponivel =
            Boolean(disponivel);

    }

}