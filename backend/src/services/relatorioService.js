import { pool } from "../config/database.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


/* =========================================================
   ERROS
========================================================= */

function criarErro(
    status,
    mensagem
) {

    const erro =
        new Error(mensagem);

    erro.status =
        status;

    return erro;

}


/* =========================================================
   USUÁRIO
========================================================= */

function obterSecaoUsuario(
    usuario
) {

    return (
        usuario?.secao?.id ??
        usuario?.secaoId ??
        usuario?.secao_id ??
        null
    );

}


function possuiPermissao(
    usuario,
    codigo
) {

    const permissoes =
        usuario?.permissoes || [];


    return permissoes.some(
        permissao => {

            if (
                typeof permissao === "string"
            ) {

                return permissao === codigo;

            }


            return (
                permissao?.codigo === codigo
            );

        }
    );

}


function podeVisualizarTodasSecoes(
    usuario
) {

    return possuiPermissao(
        usuario,
        "SECOES_VISUALIZAR_TODAS"
    );

}


/* =========================================================
   DATA
========================================================= */

function validarData(
    valor,
    nomeCampo
) {

    if (!valor) {

        return null;

    }


    const texto =
        String(valor);


    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {

        throw criarErro(
            400,
            `${nomeCampo} inválida. Utilize o formato YYYY-MM-DD.`
        );

    }


    return texto;

}


/* =========================================================
   OPÇÕES DO RELATÓRIO
========================================================= */

async function buscarOpcoes({
    usuario
}) {

    if (!usuario) {

        throw criarErro(
            401,
            "Usuário não autenticado."
        );

    }


    let resultadoSecoes;


    if (
        podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        resultadoSecoes =
            await pool.query(
                `
                    SELECT
                        id,
                        sigla,
                        nome

                    FROM secoes

                    WHERE ativa = TRUE

                    ORDER BY sigla ASC
                `
            );

    } else {

        const secaoUsuario =
            obterSecaoUsuario(
                usuario
            );


        if (!secaoUsuario) {

            throw criarErro(
                403,
                "O usuário não possui uma seção vinculada."
            );

        }


        resultadoSecoes =
            await pool.query(
                `
                    SELECT
                        id,
                        sigla,
                        nome

                    FROM secoes

                    WHERE
                        id = $1
                        AND ativa = TRUE

                    LIMIT 1
                `,
                [
                    secaoUsuario
                ]
            );

    }


    const resultadoSituacoes =
        await pool.query(
            `
                SELECT
                    id,
                    codigo,
                    nome,
                    disponivel,
                    ordem

                FROM situacoes

                WHERE ativa = TRUE

                ORDER BY ordem ASC
            `
        );


    return {

        secoes:
            resultadoSecoes.rows.map(
                secao => ({

                    id:
                        String(
                            secao.id
                        ),

                    sigla:
                        secao.sigla,

                    nome:
                        secao.nome

                })
            ),

        situacoes:
            resultadoSituacoes.rows.map(
                situacao => ({

                    id:
                        String(
                            situacao.id
                        ),

                    codigo:
                        situacao.codigo,

                    nome:
                        situacao.nome,

                    disponivel:
                        situacao.disponivel,

                    ordem:
                        situacao.ordem

                })
            )

    };

}


/* =========================================================
   MONTAR FILTROS
========================================================= */

function montarFiltros({

    usuario,

    dataInicio,

    dataFim,

    secaoId,

    situacaoId

}) {

    const condicoes = [];

    const valores = [];


    function adicionar(
        valor
    ) {

        valores.push(valor);

        return `$${valores.length}`;

    }


    /* =====================================================
       SEÇÃO
    ===================================================== */

    if (
        !podeVisualizarTodasSecoes(
            usuario
        )
    ) {

        const secaoUsuario =
            obterSecaoUsuario(
                usuario
            );


        if (!secaoUsuario) {

            throw criarErro(
                403,
                "O usuário não possui uma seção vinculada."
            );

        }


        const parametro =
            adicionar(
                secaoUsuario
            );


        condicoes.push(
            `c.secao_id = ${parametro}`
        );

    } else if (secaoId) {

        const parametro =
            adicionar(
                secaoId
            );


        condicoes.push(
            `c.secao_id = ${parametro}`
        );

    }


    /* =====================================================
       DATA INICIAL
    ===================================================== */

    if (dataInicio) {

        const parametro =
            adicionar(
                dataInicio
            );


        condicoes.push(
            `c.data >= ${parametro}`
        );

    }


    /* =====================================================
       DATA FINAL
    ===================================================== */

    if (dataFim) {

        const parametro =
            adicionar(
                dataFim
            );


        condicoes.push(
            `c.data <= ${parametro}`
        );

    }


    /* =====================================================
       SITUAÇÃO
    ===================================================== */

    if (situacaoId) {

        const parametro =
            adicionar(
                situacaoId
            );


        condicoes.push(
            `cm.situacao_id = ${parametro}`
        );

    }


    return {

        where:
            condicoes.length
                ? `WHERE ${condicoes.join(
                    " AND "
                )}`
                : "",

        valores

    };

}


/* =========================================================
   GERAR RELATÓRIO
========================================================= */

async function gerar({

    usuario,

    dataInicio = null,

    dataFim = null,

    secaoId = null,

    situacaoId = null

}) {

    if (!usuario) {

        throw criarErro(
            401,
            "Usuário não autenticado."
        );

    }


    dataInicio =
        validarData(
            dataInicio,
            "Data inicial"
        );


    dataFim =
        validarData(
            dataFim,
            "Data final"
        );


    if (
        dataInicio &&
        dataFim &&
        dataInicio > dataFim
    ) {

        throw criarErro(
            400,
            "A data inicial não pode ser maior que a data final."
        );

    }


    const filtros =
        montarFiltros({

            usuario,

            dataInicio,

            dataFim,

            secaoId,

            situacaoId

        });


    /* =====================================================
       RESUMO GERAL
    ===================================================== */

    const resultadoResumo =
        await pool.query(
            `
                SELECT

                    COUNT(
                        cm.id
                    )::INTEGER
                        AS total_registros,

                    COUNT(
                        cm.id
                    ) FILTER (
                        WHERE sit.disponivel = TRUE
                    )::INTEGER
                        AS disponiveis,

                    COUNT(
                        cm.id
                    ) FILTER (
                        WHERE sit.disponivel = FALSE
                    )::INTEGER
                        AS indisponiveis,

                    COUNT(
                        DISTINCT cm.militar_id
                    )::INTEGER
                        AS militares_distintos,

                    COUNT(
                        DISTINCT c.id
                    )::INTEGER
                        AS chamadas,

                    COUNT(
                        DISTINCT c.secao_id
                    )::INTEGER
                        AS secoes

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id =
                        cm.chamada_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                ${filtros.where}
            `,
            filtros.valores
        );


    const resumo =
        resultadoResumo.rows[0] || {};


    /* =====================================================
       CONSOLIDADO POR SEÇÃO
    ===================================================== */

    const resultadoSecoes =
        await pool.query(
            `
                SELECT

                    s.id AS secao_id,

                    s.sigla AS secao_sigla,

                    s.nome AS secao_nome,

                    COUNT(
                        cm.id
                    )::INTEGER
                        AS total,

                    COUNT(
                        cm.id
                    ) FILTER (
                        WHERE sit.disponivel = TRUE
                    )::INTEGER
                        AS disponiveis,

                    COUNT(
                        cm.id
                    ) FILTER (
                        WHERE sit.disponivel = FALSE
                    )::INTEGER
                        AS indisponiveis

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id =
                        cm.chamada_id

                INNER JOIN secoes s
                    ON s.id =
                        c.secao_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                ${filtros.where}

                GROUP BY
                    s.id,
                    s.sigla,
                    s.nome

                ORDER BY
                    s.sigla ASC
            `,
            filtros.valores
        );


    /* =====================================================
       CONSOLIDADO POR SITUAÇÃO
    ===================================================== */

    const resultadoSituacoes =
        await pool.query(
            `
                SELECT

                    sit.id AS situacao_id,

                    sit.codigo,

                    sit.nome,

                    sit.disponivel,

                    sit.ordem,

                    COUNT(
                        cm.id
                    )::INTEGER
                        AS total

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id =
                        cm.chamada_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                ${filtros.where}

                GROUP BY

                    sit.id,

                    sit.codigo,

                    sit.nome,

                    sit.disponivel,

                    sit.ordem

                ORDER BY
                    sit.ordem ASC
            `,
            filtros.valores
        );


    /* =====================================================
       RELAÇÃO NOMINAL
    ===================================================== */

    const resultadoMilitares =
        await pool.query(
            `
                SELECT

                    cm.id,

                    TO_CHAR(
                        c.data,
                        'YYYY-MM-DD'
                    ) AS data,

                    c.id AS chamada_id,

                    c.status AS chamada_status,

                    s.id AS secao_id,

                    s.sigla AS secao_sigla,

                    s.nome AS secao_nome,

                    m.id AS militar_id,

                    m.nome_completo,

                    m.nome_guerra,

                    m.saram,

                    pg.id AS posto_id,

                    pg.sigla AS posto_sigla,

                    pg.nome AS posto_nome,

                    pg.ordem AS posto_ordem,

                    sit.id AS situacao_id,

                    sit.codigo AS situacao_codigo,

                    sit.nome AS situacao_nome,

                    sit.disponivel,

                    cm.presente,

                    cm.observacao,

                    cm.registrado_em

                FROM chamada_militares cm

                INNER JOIN chamadas c
                    ON c.id =
                        cm.chamada_id

                INNER JOIN secoes s
                    ON s.id =
                        c.secao_id

                INNER JOIN militares m
                    ON m.id =
                        cm.militar_id

                INNER JOIN postos_graduacoes pg
                    ON pg.id =
                        m.posto_graduacao_id

                INNER JOIN situacoes sit
                    ON sit.id =
                        cm.situacao_id

                ${filtros.where}

                ORDER BY

                    c.data DESC,

                    s.sigla ASC,

                    pg.ordem ASC,

                    m.nome_guerra ASC
            `,
            filtros.valores
        );


    /* =====================================================
       RETORNO
    ===================================================== */

    return {

        filtros: {

            dataInicio,

            dataFim,

            secaoId:
                secaoId
                    ? String(secaoId)
                    : null,

            situacaoId:
                situacaoId
                    ? String(situacaoId)
                    : null

        },


        resumo: {

            totalRegistros:
                resumo.total_registros || 0,

            militaresDistintos:
                resumo.militares_distintos || 0,

            disponiveis:
                resumo.disponiveis || 0,

            indisponiveis:
                resumo.indisponiveis || 0,

            chamadas:
                resumo.chamadas || 0,

            secoes:
                resumo.secoes || 0

        },


        porSecao:
            resultadoSecoes.rows.map(
                item => ({

                    secao: {

                        id:
                            String(
                                item.secao_id
                            ),

                        sigla:
                            item.secao_sigla,

                        nome:
                            item.secao_nome

                    },

                    total:
                        item.total,

                    disponiveis:
                        item.disponiveis,

                    indisponiveis:
                        item.indisponiveis

                })
            ),


        porSituacao:
            resultadoSituacoes.rows.map(
                item => ({

                    situacao: {

                        id:
                            String(
                                item.situacao_id
                            ),

                        codigo:
                            item.codigo,

                        nome:
                            item.nome,

                        disponivel:
                            item.disponivel,

                        ordem:
                            item.ordem

                    },

                    total:
                        item.total

                })
            ),


        militares:
            resultadoMilitares.rows.map(
                item => ({

                    id:
                        String(
                            item.id
                        ),

                    data:
                        item.data,

                    chamada: {

                        id:
                            String(
                                item.chamada_id
                            ),

                        status:
                            item.chamada_status

                    },

                    secao: {

                        id:
                            String(
                                item.secao_id
                            ),

                        sigla:
                            item.secao_sigla,

                        nome:
                            item.secao_nome

                    },

                    militar: {

                        id:
                            String(
                                item.militar_id
                            ),

                        nomeCompleto:
                            item.nome_completo,

                        nomeGuerra:
                            item.nome_guerra,

                        saram:
                            item.saram,

                        postoGraduacao: {

                            id:
                                String(
                                    item.posto_id
                                ),

                            sigla:
                                item.posto_sigla,

                            nome:
                                item.posto_nome,

                            ordem:
                                item.posto_ordem

                        }

                    },

                    situacao: {

                        id:
                            String(
                                item.situacao_id
                            ),

                        codigo:
                            item.situacao_codigo,

                        nome:
                            item.situacao_nome,

                        disponivel:
                            item.disponivel

                    },

                    presente:
                        item.presente,

                    observacao:
                        item.observacao,

                    registradoEm:
                        item.registrado_em

                })
            )

    };

}
/* =========================================================
   FORMATADORES DE EXPORTAÇÃO
========================================================= */

function formatarDataBR(valor) {

    if (!valor) {
        return "—";
    }


    const [
        ano,
        mes,
        dia
    ] = String(valor).split("-");


    if (
        !ano ||
        !mes ||
        !dia
    ) {

        return String(valor);

    }


    return `${dia}/${mes}/${ano}`;

}


function obterNomeArquivo(
    extensao
) {

    const agora =
        new Date();


    const data =
        agora
            .toISOString()
            .slice(0, 10);


    return `sicamil-relatorio-${data}.${extensao}`;

}


/* =========================================================
   EXPORTAR PLANILHA
========================================================= */

async function gerarPlanilha({
    usuario,
    dataInicio = null,
    dataFim = null,
    secaoId = null,
    situacaoId = null
}) {

    const relatorio =
        await gerar({

            usuario,

            dataInicio,

            dataFim,

            secaoId,

            situacaoId

        });


    const workbook =
        new ExcelJS.Workbook();


    workbook.creator =
        "SICAMIL";


    workbook.created =
        new Date();


    /* =====================================================
       RESUMO
    ===================================================== */

    const resumo =
        workbook.addWorksheet(
            "Resumo"
        );


    resumo.mergeCells(
        "A1:D1"
    );


    resumo.getCell(
        "A1"
    ).value =
        "SICAMIL - RELATÓRIO DE EFETIVO";


    resumo.getCell(
        "A1"
    ).font = {

        bold: true,

        size: 16

    };


    resumo.getCell(
        "A3"
    ).value =
        "Período";


    resumo.getCell(
        "B3"
    ).value =
        dataInicio || dataFim
            ? `${
                dataInicio
                    ? formatarDataBR(
                        dataInicio
                    )
                    : "Início"
            } até ${
                dataFim
                    ? formatarDataBR(
                        dataFim
                    )
                    : "Hoje"
            }`
            : "Todos os registros";


    resumo.addRow([]);


    resumo.addRow([
        "Indicador",
        "Quantidade"
    ]);


    resumo.addRows([

        [
            "Registros",
            relatorio
                .resumo
                .totalRegistros
        ],

        [
            "Militares distintos",
            relatorio
                .resumo
                .militaresDistintos
        ],

        [
            "Disponíveis",
            relatorio
                .resumo
                .disponiveis
        ],

        [
            "Indisponíveis",
            relatorio
                .resumo
                .indisponiveis
        ],

        [
            "Chamadas",
            relatorio
                .resumo
                .chamadas
        ],

        [
            "Seções",
            relatorio
                .resumo
                .secoes
        ]

    ]);


    resumo.columns = [

        {
            width: 30
        },

        {
            width: 18
        },

        {
            width: 18
        },

        {
            width: 18
        }

    ];


    /* =====================================================
       POR SEÇÃO
    ===================================================== */

    const porSecao =
        workbook.addWorksheet(
            "Por Seção"
        );


    porSecao.addRow([

        "Seção",

        "Nome",

        "Total",

        "Disponíveis",

        "Indisponíveis"

    ]);


    for (
        const item
        of relatorio.porSecao
    ) {

        porSecao.addRow([

            item.secao.sigla,

            item.secao.nome,

            item.total,

            item.disponiveis,

            item.indisponiveis

        ]);

    }


    porSecao.columns = [

        {
            width: 15
        },

        {
            width: 45
        },

        {
            width: 14
        },

        {
            width: 16
        },

        {
            width: 18
        }

    ];


    /* =====================================================
       POR SITUAÇÃO
    ===================================================== */

    const porSituacao =
        workbook.addWorksheet(
            "Por Situação"
        );


    porSituacao.addRow([

        "Código",

        "Situação",

        "Condição",

        "Quantidade"

    ]);


    for (
        const item
        of relatorio.porSituacao
    ) {

        porSituacao.addRow([

            item.situacao.codigo,

            item.situacao.nome,

            item.situacao.disponivel
                ? "Disponível"
                : "Indisponível",

            item.total

        ]);

    }


    porSituacao.columns = [

        {
            width: 25
        },

        {
            width: 35
        },

        {
            width: 18
        },

        {
            width: 15
        }

    ];


    /* =====================================================
       RELAÇÃO NOMINAL
    ===================================================== */

    const nominal =
        workbook.addWorksheet(
            "Relação Nominal"
        );


    nominal.addRow([

        "Data",

        "PT/GRAD",

        "Nome de Guerra",

        "Nome Completo",

        "SARAM",

        "Seção",

        "Situação",

        "Condição",

        "Observação"

    ]);


    for (
        const item
        of relatorio.militares
    ) {

        nominal.addRow([

            formatarDataBR(
                item.data
            ),

            item
                .militar
                .postoGraduacao
                .sigla,

            item
                .militar
                .nomeGuerra,

            item
                .militar
                .nomeCompleto,

            item
                .militar
                .saram,

            item
                .secao
                .sigla,

            item
                .situacao
                .nome,

            item
                .situacao
                .disponivel
                    ? "Disponível"
                    : "Indisponível",

            item.observacao || ""

        ]);

    }


    nominal.columns = [

        {
            width: 14
        },

        {
            width: 10
        },

        {
            width: 25
        },

        {
            width: 45
        },

        {
            width: 15
        },

        {
            width: 14
        },

        {
            width: 30
        },

        {
            width: 18
        },

        {
            width: 40
        }

    ];


    /* =====================================================
       ESTILO DAS PLANILHAS
    ===================================================== */

    for (
        const sheet
        of workbook.worksheets
    ) {

        const primeiraLinhaTabela =
            sheet.name === "Resumo"
                ? 5
                : 1;


        const linha =
            sheet.getRow(
                primeiraLinhaTabela
            );


        linha.font = {

            bold: true,

            color: {
                argb:
                    "FFFFFFFF"
            }

        };


        linha.fill = {

            type:
                "pattern",

            pattern:
                "solid",

            fgColor: {
                argb:
                    "FF176FAB"
            }

        };


        linha.alignment = {

            vertical:
                "middle"

        };


        linha.height =
            22;


        sheet.views = [

            {
                state:
                    "frozen",

                ySplit:
                    primeiraLinhaTabela
            }

        ];

    }


    const buffer =
        await workbook.xlsx
            .writeBuffer();


    return {

        buffer:
            Buffer.from(
                buffer
            ),

        nomeArquivo:
            obterNomeArquivo(
                "xlsx"
            )

    };

}


/* =========================================================
   EXPORTAR PDF
========================================================= */

async function gerarPdf({
    usuario,
    dataInicio = null,
    dataFim = null,
    secaoId = null,
    situacaoId = null
}) {

    const relatorio =
        await gerar({

            usuario,

            dataInicio,

            dataFim,

            secaoId,

            situacaoId

        });


    return await new Promise(
        (
            resolve,
            reject
        ) => {

            const doc =
                new PDFDocument({

                    size:
                        "A4",

                    layout:
                        "landscape",

                    margin:
                        35

                });


            const partes = [];


            doc.on(
                "data",
                parte => {

                    partes.push(
                        parte
                    );

                }
            );


            doc.on(
                "end",
                () => {

                    resolve({

                        buffer:
                            Buffer.concat(
                                partes
                            ),

                        nomeArquivo:
                            obterNomeArquivo(
                                "pdf"
                            )

                    });

                }
            );


            doc.on(
                "error",
                reject
            );


            /* =================================================
               CABEÇALHO
            ================================================= */

            doc
                .font(
                    "Helvetica-Bold"
                )
                .fontSize(
                    18
                )
                .fillColor(
                    "#173E63"
                )
                .text(
                    "SICAMIL - Relatório de Efetivo",
                    {
                        align:
                            "center"
                    }
                );


            doc
                .moveDown(
                    0.4
                );


            doc
                .font(
                    "Helvetica"
                )
                .fontSize(
                    9
                )
                .fillColor(
                    "#536D82"
                )
                .text(

                    dataInicio || dataFim
                        ? `Período: ${
                            dataInicio
                                ? formatarDataBR(
                                    dataInicio
                                )
                                : "Início"
                        } até ${
                            dataFim
                                ? formatarDataBR(
                                    dataFim
                                )
                                : "Hoje"
                        }`
                        : "Período: todos os registros",

                    {
                        align:
                            "center"
                    }

                );


            doc
                .moveDown(
                    1
                );


            /* =================================================
               RESUMO
            ================================================= */

            doc
                .font(
                    "Helvetica-Bold"
                )
                .fontSize(
                    11
                )
                .fillColor(
                    "#173E63"
                )
                .text(
                    "Resumo Geral"
                );


            doc
                .moveDown(
                    0.4
                );


            doc
                .font(
                    "Helvetica"
                )
                .fontSize(
                    9
                )
                .fillColor(
                    "#263F53"
                )
                .text(
                    `Registros: ${relatorio.resumo.totalRegistros}     ` +
                    `Militares distintos: ${relatorio.resumo.militaresDistintos}     ` +
                    `Disponíveis: ${relatorio.resumo.disponiveis}     ` +
                    `Indisponíveis: ${relatorio.resumo.indisponiveis}     ` +
                    `Chamadas: ${relatorio.resumo.chamadas}     ` +
                    `Seções: ${relatorio.resumo.secoes}`
                );


            doc
                .moveDown(
                    1
                );


            /* =================================================
               RELAÇÃO NOMINAL
            ================================================= */

            doc
                .font(
                    "Helvetica-Bold"
                )
                .fontSize(
                    11
                )
                .fillColor(
                    "#173E63"
                )
                .text(
                    "Relação Nominal"
                );


            doc
                .moveDown(
                    0.5
                );


            const margemEsquerda =
                35;


            const colunas = [

                {
                    titulo:
                        "DATA",

                    largura:
                        58
                },

                {
                    titulo:
                        "PT/GRAD",

                    largura:
                        48
                },

                {
                    titulo:
                        "MILITAR",

                    largura:
                        145
                },

                {
                    titulo:
                        "SARAM",

                    largura:
                        65
                },

                {
                    titulo:
                        "SEÇÃO",

                    largura:
                        62
                },

                {
                    titulo:
                        "SITUAÇÃO",

                    largura:
                        120
                },

                {
                    titulo:
                        "CONDIÇÃO",

                    largura:
                        82
                },

                {
                    titulo:
                        "OBSERVAÇÃO",

                    largura:
                        180
                }

            ];


            function desenharCabecalhoTabela() {

                let x =
                    margemEsquerda;


                const y =
                    doc.y;


                doc
                    .save()
                    .fillColor(
                        "#DCEAF5"
                    )
                    .rect(
                        margemEsquerda,
                        y,
                        760,
                        22
                    )
                    .fill()
                    .restore();


                for (
                    const coluna
                    of colunas
                ) {

                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(
                            7
                        )
                        .fillColor(
                            "#315673"
                        )
                        .text(

                            coluna.titulo,

                            x + 4,

                            y + 7,

                            {
                                width:
                                    coluna.largura - 8,

                                height:
                                    12
                            }

                        );


                    x +=
                        coluna.largura;

                }


                doc.y =
                    y + 26;

            }


            function novaPagina() {

                doc.addPage({

                    size:
                        "A4",

                    layout:
                        "landscape",

                    margin:
                        35

                });


                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(
                        9
                    )
                    .fillColor(
                        "#173E63"
                    )
                    .text(
                        "SICAMIL - Relação Nominal",
                        {
                            align:
                                "right"
                        }
                    );


                doc.moveDown(
                    0.7
                );


                desenharCabecalhoTabela();

            }


            desenharCabecalhoTabela();


            for (
                const item
                of relatorio.militares
            ) {

                if (
                    doc.y >
                    535
                ) {

                    novaPagina();

                }


                const y =
                    doc.y;


                let x =
                    margemEsquerda;


                const valores = [

                    formatarDataBR(
                        item.data
                    ),

                    item
                        .militar
                        .postoGraduacao
                        .sigla,

                    item
                        .militar
                        .nomeGuerra,

                    item
                        .militar
                        .saram,

                    item
                        .secao
                        .sigla,

                    item
                        .situacao
                        .nome,

                    item
                        .situacao
                        .disponivel
                            ? "Disponível"
                            : "Indisponível",

                    item.observacao ||
                    "—"

                ];


                for (
                    let indice = 0;

                    indice <
                    colunas.length;

                    indice++
                ) {

                    const coluna =
                        colunas[
                            indice
                        ];


                    doc
                        .font(
                            "Helvetica"
                        )
                        .fontSize(
                            7
                        )
                        .fillColor(
                            "#344E69"
                        )
                        .text(

                            String(
                                valores[
                                    indice
                                ]
                            ),

                            x + 4,

                            y + 5,

                            {
                                width:
                                    coluna.largura - 8,

                                height:
                                    24,

                                ellipsis:
                                    true
                            }

                        );


                    x +=
                        coluna.largura;

                }


                doc
                    .moveTo(
                        margemEsquerda,
                        y + 28
                    )
                    .lineTo(
                        margemEsquerda +
                        760,
                        y + 28
                    )
                    .strokeColor(
                        "#D7E1E8"
                    )
                    .stroke();


                doc.y =
                    y + 31;

            }


            if (
                relatorio
                    .militares
                    .length === 0
            ) {

                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(
                        9
                    )
                    .fillColor(
                        "#70869A"
                    )
                    .text(
                        "Nenhum militar encontrado para os filtros selecionados."
                    );

            }


            doc.end();

        }
    );

}

/* =========================================================
   EXPORTS
========================================================= */

export {

    buscarOpcoes,

    gerar,

    gerarPlanilha,

    gerarPdf

};