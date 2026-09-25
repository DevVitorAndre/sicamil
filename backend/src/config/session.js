import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import { pool } from "./database.js";


if (
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32
) {

    throw new Error(
        "SESSION_SECRET ausente ou muito curta no arquivo .env."
    );

}


const PostgreSQLStore =
    connectPgSimple(session);


export const sessionMiddleware =
    session({

        name:
            "sicamil.sid",


        store:
            new PostgreSQLStore({

                pool,

                tableName:
                    "sessoes_web"

            }),


        secret:
            process.env.SESSION_SECRET,


        resave:
            false,


        saveUninitialized:
            false,


        rolling:
            true,


        cookie: {

            httpOnly:
                true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite:
                "lax",

            maxAge:
                8 * 60 * 60 * 1000

        }

    });