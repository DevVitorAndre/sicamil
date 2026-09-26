import {
    Secao
} from "./Secao.js";


export class Militar {

    constructor({

        id = null,

        nomeCompleto = "",

        nomeGuerra = "",

        saram = "",

        postoGraduacao = null,

        secao = null,

        ativo = true,

        createdAt = null,

        updatedAt = null

    } = {}) {


        this.id =
            id;


        this.nomeCompleto =
            nomeCompleto;


        this.nomeGuerra =
            nomeGuerra;


        this.saram =
            saram;


        /* =================================================
           PT / GRAD
        ================================================= */

        this.postoGraduacao =
            postoGraduacao
                ? {

                    id:
                        postoGraduacao.id ?? null,

                    sigla:
                        postoGraduacao.sigla ?? "",

                    nome:
                        postoGraduacao.nome ?? "",

                    ordem:
                        postoGraduacao.ordem ?? null

                }
                : null;


        /* =================================================
           SEÇÃO
        ================================================= */

        this.secao =
            secao
                ? new Secao(secao)
                : null;


        /* =================================================
           STATUS DO CADASTRO
        ================================================= */

        this.ativo =
            Boolean(ativo);


        /* =================================================
           DATAS
        ================================================= */

        this.createdAt =
            createdAt;


        this.updatedAt =
            updatedAt;

    }


    /* =====================================================
       PT / GRAD PARA EXIBIÇÃO
    ===================================================== */

    get postoGraduacaoSigla() {

        return (
            this.postoGraduacao?.sigla ||
            ""
        );

    }


    /* =====================================================
       SEÇÃO PARA EXIBIÇÃO
    ===================================================== */

    get secaoSigla() {

        return (
            this.secao?.sigla ||
            ""
        );

    }


    /* =====================================================
       STATUS PARA EXIBIÇÃO
    ===================================================== */

    get statusTexto() {

        return this.ativo
            ? "Ativo"
            : "Inativo";

    }

}