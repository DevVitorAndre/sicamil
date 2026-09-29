import { Router } from "express";

import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";

import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";

import {
    opcoes,
    listarRegistros,
    buscarRegistro
} from "../controllers/registroController.js";




const router =
    Router();


router.use(
    exigirAutenticacao
);


router.use(
    exigirPermissao(
        "REGISTROS_VISUALIZAR"
    )
);


/* =========================================================
   OPÇÕES
========================================================= */

router.get(
    "/opcoes",
    opcoes
);

/* =========================================================
   LISTAR
========================================================= */

router.get(
    "/",
    listarRegistros
);


/* =========================================================
   DETALHAR
========================================================= */

router.get(
    "/:id",
    buscarRegistro
);


export default router;