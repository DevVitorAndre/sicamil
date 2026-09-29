import { Router } from "express";

import {
    exigirAutenticacao
} from "../middleware/authMiddleware.js";

import {
    exigirPermissao
} from "../middleware/permissaoMiddleware.js";

import {
    opcoes,
    gerarRelatorio,
    exportarPlanilha,
    exportarPdf
} from "../controllers/relatorioController.js";


const router =
    Router();


router.use(
    exigirAutenticacao
);


router.use(
    exigirPermissao(
        "RELATORIOS_EXPORTAR"
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
   GERAR PLANILHA
========================================================= */

router.get(
    "/exportar/xlsx",
    exportarPlanilha
);

/* =========================================================
   GERAR PDF
========================================================= */

router.get(
    "/exportar/pdf",
    exportarPdf
);


/* =========================================================
   GERAR RELATÓRIO
========================================================= */

router.get(
    "/",
    gerarRelatorio
);


export default router;