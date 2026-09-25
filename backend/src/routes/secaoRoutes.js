import {
    Router
} from "express";


import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";


import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";


import {

    listar,
    buscarPorId,
    cadastrar,
    editar,
    alterarStatus

} from "../controllers/secaoController.js";


const router =
    Router();


/* =========================================================
   TODAS AS ROTAS EXIGEM LOGIN
========================================================= */

router.use(
    exigirAutenticacao
);


/* =========================================================
   TODAS AS ROTAS DESTE MÓDULO EXIGEM
   PERMISSÃO PARA GERENCIAR SEÇÕES
========================================================= */

router.use(
    exigirPermissao(
        "SECOES_GERENCIAR"
    )
);


/* =========================================================
   ROTAS
========================================================= */

router.get(
    "/",
    listar
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


export default router;