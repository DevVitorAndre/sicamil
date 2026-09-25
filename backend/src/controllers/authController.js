import {

    autenticarUsuario,
    buscarUsuarioPorId

} from "../services/authService.js";


/* =========================================================
   LOGIN
========================================================= */

export async function login(
    req,
    res,
    next
) {

    try {

        const login =
            req.body.login?.trim();

        const senha =
            req.body.senha;


        if (
            !login ||
            typeof senha !== "string" ||
            !senha
        ) {

            return res
                .status(400)
                .json({

                    mensagem:
                        "Informe o login e a senha."

                });

        }


        const usuario =
            await autenticarUsuario(
                login,
                senha
            );


        if (!usuario) {

            return res
                .status(401)
                .json({

                    mensagem:
                        "Login ou senha inválidos."

                });

        }


        await regenerarSessao(
            req
        );


        req.session.usuarioId =
            usuario.id;


        await salvarSessao(
            req
        );


        return res
            .status(200)
            .json({

                usuario

            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   USUARIO ATUAL
========================================================= */

export async function usuarioAtual(
    req,
    res,
    next
) {

    try {

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


        return res
            .status(200)
            .json({

                usuario

            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   LOGOUT
========================================================= */

export async function logout(
    req,
    res,
    next
) {

    try {

        await destruirSessao(
            req
        );


        res.clearCookie(
            "sicamil.sid",
            {
                path: "/"
            }
        );


        return res
            .status(200)
            .json({

                mensagem:
                    "Sessão encerrada com sucesso."

            });


    } catch (erro) {

        next(erro);

    }

}


/* =========================================================
   HELPERS DE SESSAO
========================================================= */

function regenerarSessao(req) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            req.session.regenerate(
                (erro) => {

                    if (erro) {

                        reject(erro);

                        return;

                    }


                    resolve();

                }
            );

        }
    );

}


function salvarSessao(req) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            req.session.save(
                (erro) => {

                    if (erro) {

                        reject(erro);

                        return;

                    }


                    resolve();

                }
            );

        }
    );

}


function destruirSessao(req) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            req.session.destroy(
                (erro) => {

                    if (erro) {

                        reject(erro);

                        return;

                    }


                    resolve();

                }
            );

        }
    );

}