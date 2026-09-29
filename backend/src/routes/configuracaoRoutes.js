import {
    Router
} from "express";


import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";


import {
    minhaConta,
    alterarMinhaSenha
} from "../controllers/configuracaoController.js";


const router =
    Router();


router.use(
    exigirAutenticacao
);


router.get(
    "/conta",
    minhaConta
);


router.put(
    "/senha",
    alterarMinhaSenha
);


export default router;