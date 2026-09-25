import { Secao } from "./Secao.js";
import { Usuario } from "./Usuario.js";


export class Chamada {

    constructor({
        id = null,
        data = null,
        dataHora = null,
        status = "",
        secao = null,
        responsavel = null
    } = {}) {

        this.id = id;

        this.data = data;

        this.dataHora =
            dataHora;

        this.status =
            status;


        this.secao =
            secao
                ? new Secao(secao)
                : null;


        this.responsavel =
            responsavel
                ? new Usuario(responsavel)
                : null;

    }

}