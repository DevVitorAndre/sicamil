export function exigirAutenticacao(
    req,
    res,
    next
) {

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


    next();

}