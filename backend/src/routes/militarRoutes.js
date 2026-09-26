import { Router } from "express";

import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";

import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";

import {
    listar,
    buscarPorId,
    opcoes,
    criar,
    atualizar,
    alterarStatus,
    excluir
} from "../controllers/militarController.js";


const router =
    Router();


/* =========================================================
   LOGIN OBRIGATÓRIO
========================================================= */

router.use(
    exigirAutenticacao
);


/* =========================================================
   PERMISSÃO OBRIGATÓRIA
========================================================= */

router.use(
    exigirPermissao(
        "MILITARES_GERENCIAR"
    )
);


/* =========================================================
   ROTAS
========================================================= */

router.get(
    "/",
    listar
);


/*
 * IMPORTANTE:
 * /opcoes precisa ficar antes de /:id
 */
router.get(
    "/opcoes",
    opcoes
);


router.get(
    "/:id",
    buscarPorId
);


router.post(
    "/",
    criar
);


router.put(
    "/:id",
    atualizar
);


router.patch(
    "/:id/status",
    alterarStatus
);


router.delete(
    "/:id",
    excluir
);


export default router;