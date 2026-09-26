import express from "express";
import cors from "cors";
import helmet from "helmet";

import { pool } from "./config/database.js";
import { sessionMiddleware } from "./config/session.js";

import authRoutes from "./routes/authRoutes.js";
import secaoRoutes from "./routes/secaoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import militarRoutes from "./routes/militarRoutes.js";

import {
    exigirAutenticacao
} from "./middleware/authMiddleware.js";


const app =
    express();


const PORT =
    process.env.PORT || 3000;


/* =========================================================
   SEGURANCA
========================================================= */

app.use(
    helmet()
);


/* =========================================================
   CORS
========================================================= */

app.use(
    cors({

        origin: true,

        credentials: true

    })
);


/* =========================================================
   JSON
========================================================= */

app.use(
    express.json()
);


/* =========================================================
   SESSAO
========================================================= */

app.use(
    sessionMiddleware
);


/* =========================================================
   AUTH
========================================================= */

app.use(
    "/api/auth",
    authRoutes
);

/* =========================================================
   SEÇÕES
========================================================= */

app.use(
    "/api/secoes",
    secaoRoutes
);

/* =========================================================
   USUÁRIOS
========================================================= */

app.use(
    "/api/usuarios",
    usuarioRoutes
);


/* =========================================================
   MILITARES
========================================================= */

app.use(
    "/api/militares",
    militarRoutes
);


/* =========================================================
   HEALTH DA API
========================================================= */

app.get(
    "/api/health",

    (req, res) => {

        res.status(200).json({

            status:
                "ok",

            service:
                "SICAMIL API"

        });

    }
);


/* =========================================================
   HEALTH DO BANCO
========================================================= */

app.get(
    "/api/database/health",

    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        current_database()
                            AS database,

                        NOW()
                            AS horario
                    `
                );


            return res
                .status(200)
                .json({

                    status:
                        "ok",

                    database:
                        resultado.rows[0].database,

                    horario:
                        resultado.rows[0].horario

                });


        } catch (erro) {

            console.error(
                "Erro ao conectar no banco:",
                erro
            );


            return res
                .status(500)
                .json({

                    status:
                        "erro",

                    mensagem:
                        "Não foi possível conectar ao banco de dados."

                });

        }

    }
);


/* =========================================================
   DASHBOARD

   Agora protegido por login.
========================================================= */

app.get(
    "/api/dashboard",

    exigirAutenticacao,

    (req, res) => {

        res.status(200).json({

            usuario:
                null,


            resumo: {

                efetivoTotal:
                    null,

                presentesHoje:
                    null,

                naoDisponiveis:
                    null,

                secoesPendentes:
                    null,

                secoesConcluidas:
                    null

            },


            efetivoPorSecao:
                [],


            situacoes:
                [],


            chamadas:
                [],


            presentes:
                []

        });

    }
);


/* =========================================================
   ROTA NAO ENCONTRADA
========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            mensagem:
                "Rota não encontrada."

        });

    }
);


/* =========================================================
   TRATAMENTO GLOBAL DE ERROS
========================================================= */

app.use(
    (
        erro,
        req,
        res,
        next
    ) => {

        console.error(
            "Erro da API:",
            erro
        );


        const status =
            Number.isInteger(erro.status)
                ? erro.status
                : 500;


        const mensagem =
            status === 500
                ? "Erro interno do servidor."
                : erro.message;


        return res
            .status(status)
            .json({

                mensagem

            });

    }
);


/* =========================================================
   INICIAR SERVIDOR
========================================================= */

app.listen(
    PORT,

    () => {

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            " SICAMIL API"
        );

        console.log(
            ` http://localhost:${PORT}`
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);