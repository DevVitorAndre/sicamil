import {
    buscarMinhaConta,
    alterarSenha
} from "../services/configuracaoService.js";


/* =========================================================
   OBTER USUÁRIO DA SESSÃO
========================================================= */

function obterUsuarioId(
    req
) {

    return (
        req.session
            ?.usuarioId ??
        null
    );

}


/* =========================================================
   MINHA CONTA
========================================================= */

async function minhaConta(
    req,
    res,
    next
) {

    try {

        const usuarioId =
            obterUsuarioId(
                req
            );


        if (!usuarioId) {

            const erro =
                new Error(
                    "Usuário não autenticado."
                );


            erro.status =
                401;


            throw erro;

        }


        const conta =
            await buscarMinhaConta(
                usuarioId
            );


        return res
            .status(200)
            .json(
                conta
            );


    } catch (erro) {

        next(
            erro
        );

    }

}


/* =========================================================
   ALTERAR MINHA SENHA
========================================================= */

async function alterarMinhaSenha(
    req,
    res,
    next
) {

    try {

        const usuarioId =
            obterUsuarioId(
                req
            );


        if (!usuarioId) {

            const erro =
                new Error(
                    "Usuário não autenticado."
                );


            erro.status =
                401;


            throw erro;

        }


        const resultado =
            await alterarSenha(
                usuarioId,
                {

                    senhaAtual:
                        req.body
                            ?.senhaAtual,

                    novaSenha:
                        req.body
                            ?.novaSenha

                }
            );


        return res
            .status(200)
            .json(
                resultado
            );


    } catch (erro) {

        next(
            erro
        );

    }

}


export {
    minhaConta,
    alterarMinhaSenha
};