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
    buscar
} from "../controllers/dashboardController.js";


const router =
    Router();


router.use(
    exigirAutenticacao
);


router.use(
    exigirPermissao(
        "DASHBOARD_VISUALIZAR"
    )
);


router.get(
    "/",
    buscar
);


export default router;