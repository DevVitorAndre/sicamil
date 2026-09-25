import { Router } from "express";

import {

    login,
    logout,
    usuarioAtual

} from "../controllers/authController.js";

import {

    exigirAutenticacao

} from "../middleware/authMiddleware.js";


const router =
    Router();


/* =========================================================
   LOGIN
========================================================= */

router.post(
    "/login",
    login
);


/* =========================================================
   USUARIO LOGADO
========================================================= */

router.get(
    "/me",
    exigirAutenticacao,
    usuarioAtual
);


/* =========================================================
   LOGOUT
========================================================= */

router.post(
    "/logout",
    logout
);


export default router;