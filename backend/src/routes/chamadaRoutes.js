import { Router } from "express";

import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";

import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";

import {
    opcoes,
    contexto,
    iniciarChamada,
    buscar,
    salvarChamada,
    finalizarChamada
} from "../controllers/chamadaController.js";


const router =
    Router();


/* =========================================================
   TODAS AS ROTAS EXIGEM LOGIN
========================================================= */

router.use(
    exigirAutenticacao
);


/* =========================================================
   TODAS EXIGEM PERMISSÃO DE CHAMADA
========================================================= */

router.use(
    exigirPermissao(
        "CHAMADA_REALIZAR"
    )
);


/* =========================================================
   ROTAS

   IMPORTANTE:
   /contexto precisa ficar ANTES de /:id
========================================================= */


/*
    Buscar seção, militares, situações
    e eventual chamada existente.
*/

router.get(
    "/opcoes",
    opcoes
);

router.get(
    "/contexto",
    contexto
);


/*
    Iniciar chamada.
*/

router.post(
    "/iniciar",
    iniciarChamada
);


/*
    Buscar chamada específica.
*/

router.get(
    "/:id",
    buscar
);


/*
    Salvar parcialmente os militares.
*/

router.put(
    "/:id",
    salvarChamada
);


/*
    Finalizar definitivamente.
*/

router.post(
    "/:id/finalizar",
    finalizarChamada
);


export default router;