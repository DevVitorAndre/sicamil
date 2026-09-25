import { Usuario } from "./Usuario.js";
import { Militar } from "./Militar.js";
import { Chamada } from "./Chamada.js";


export class Dashboard {

    constructor({
        usuario = null,
        resumo = {},
        efetivoPorSecao = [],
        situacoes = [],
        chamadas = [],
        presentes = []
    } = {}) {


        this.usuario =
            usuario
                ? new Usuario(usuario)
                : null;


        this.resumo = {

            efetivoTotal:
                resumo.efetivoTotal ?? null,

            presentesHoje:
                resumo.presentesHoje ?? null,

            naoDisponiveis:
                resumo.naoDisponiveis ?? null,

            secoesPendentes:
                resumo.secoesPendentes ?? null,

            secoesConcluidas:
                resumo.secoesConcluidas ?? null

        };


        this.efetivoPorSecao =
            Array.isArray(efetivoPorSecao)
                ? efetivoPorSecao
                : [];


        this.situacoes =
            Array.isArray(situacoes)
                ? situacoes
                : [];


        this.chamadas =
            Array.isArray(chamadas)

                ? chamadas.map(
                    chamada =>
                        new Chamada(chamada)
                )

                : [];


        this.presentes =
            Array.isArray(presentes)

                ? presentes.map(
                    militar =>
                        new Militar(militar)
                )

                : [];

    }

}