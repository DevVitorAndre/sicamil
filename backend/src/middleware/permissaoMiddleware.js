import {
    buscarUsuarioPorId
} from "../services/authService.js";


export function exigirPermissao(
    codigoPermissao
) {

    return async function (
        req,
        res,
        next
    ) {

        try {

            if (
                !req.session ||
                !req.session.usuarioId
            ) {

                return res
                    .status(401)
                    .json({

                        mensagem:
                            "Usuário não autenticado."

                    });

            }


            const usuario =
                await buscarUsuarioPorId(
                    req.session.usuarioId
                );


            if (
                !usuario ||
                !usuario.ativo
            ) {

                return res
                    .status(401)
                    .json({

                        mensagem:
                            "Sessão inválida."

                    });

            }


            const possuiPermissao =
                usuario.permissoes.includes(
                    codigoPermissao
                );


            if (!possuiPermissao) {

                return res
                    .status(403)
                    .json({

                        mensagem:
                            "Você não possui permissão para realizar esta operação."

                    });

            }


            req.usuario =
                usuario;


            next();


        } catch (erro) {

            next(erro);

        }

    };

}