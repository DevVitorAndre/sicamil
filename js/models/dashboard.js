import { Usuario } from "./Usuario.js";


export class Dashboard {

    constructor({
        usuario = null,
        resumo = {},
        efetivoPorSecao = [],
        situacoes = [],
        chamadas = [],
        militaresDisponiveis = []
    } = {}) {


        this.usuario =
            usuario
                ? new Usuario(usuario)
                : null;


        this.resumo = {

            efetivoTotal:
                resumo.efetivoTotal ?? 0,

            disponiveisHoje:
                resumo.disponiveisHoje ?? 0,

            indisponiveisHoje:
                resumo.indisponiveisHoje ?? 0,

            secoesPendentes:
                resumo.secoesPendentes ?? 0,

            secoesConcluidas:
                resumo.secoesConcluidas ?? 0

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
                ? chamadas
                : [];


        this.militaresDisponiveis =
            Array.isArray(
                militaresDisponiveis
            )
                ? militaresDisponiveis
                : [];

    }

}