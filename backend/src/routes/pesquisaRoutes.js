import { Router } from "express";

import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";

import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";

import {
    opcoes,
    pesquisarRegistros
} from "../controllers/pesquisaController.js";


const router =
    Router();


router.use(
    exigirAutenticacao
);


router.use(
    exigirPermissao(
        "PESQUISA_REALIZAR"
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
   PESQUISAR
========================================================= */

router.get(
    "/",
    pesquisarRegistros
);


export default router;