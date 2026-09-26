import { Router } from "express";

import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";

import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";

import {
    listar,
    opcoes,
    buscarPorId,
    cadastrar,
    editar,
    alterarStatus,
    alterarPermissoes,
    excluir
} from "../controllers/usuarioController.js";


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
        "USUARIOS_GERENCIAR"
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
    cadastrar
);


router.put(
    "/:id",
    editar
);


router.patch(
    "/:id/status",
    alterarStatus
);


router.put(
    "/:id/permissoes",
    alterarPermissoes
);

router.delete(
    "/:id",
    excluir
);


export default router;

