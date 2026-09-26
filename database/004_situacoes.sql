BEGIN;

-- =========================================================
-- SICAMIL
-- SITUAÇÕES FIXAS DA CHAMADA
-- =========================================================


-- Adiciona ordem para controlar a posição no select da chamada
ALTER TABLE situacoes
ADD COLUMN IF NOT EXISTS ordem INTEGER;


-- =========================================================
-- ATUALIZA SITUAÇÕES QUE JÁ EXISTIREM
-- =========================================================

UPDATE situacoes
SET
    nome = dados.nome,
    disponivel = dados.disponivel,
    ativa = TRUE,
    ordem = dados.ordem,
    updated_at = CURRENT_TIMESTAMP
FROM (
    VALUES

        ('PRESENTE', 'Presente', TRUE, 1),

        ('FALTA', 'Falta', FALSE, 2),

        ('ESV', 'Entrando de Serviço', FALSE, 3),

        ('SSV', 'Saindo de Serviço', FALSE, 4),

        ('DISPENSADO', 'Dispensado', FALSE, 5),

        (
            'DISPENSA_RECOMPENSA',
            'Dispensa Recompensa',
            FALSE,
            6
        ),

        (
            'DISPESA_MEDICA',
            'Dispesa Médica',
            FALSE,
            7
        ),

        ('HACO', 'HACO', FALSE, 8),

        (
            'JUNTA_SAUDE',
            'Junta de Saúde',
            FALSE,
            9
        ),

        (
            'MISSAO_SEDE',
            'Missão em Sede',
            FALSE,
            10
        ),

        (
            'MISSAO_FORA_SEDE',
            'Missão Fora de Sede',
            FALSE,
            11
        ),

        (
            'MISSAO_EXTERIOR',
            'Missão no Exterior',
            FALSE,
            12
        ),

        ('CURSO', 'Curso', FALSE, 13),

        (
            'SOBREAVISO',
            'Sobreaviso',
            FALSE,
            14
        ),

        (
            'ESTAGIO',
            'Estágio',
            TRUE,
            15
        ),

        (
            'PSF',
            'Prestando Serviço Fora',
            FALSE,
            16
        ),

        (
            'FERIAS',
            'Férias',
            FALSE,
            17
        ),

        ('BAIXA', 'Baixa', FALSE, 18),

        (
            'DETENCAO',
            'Detenção',
            FALSE,
            19
        ),

        (
            'PRISAO',
            'Prisão',
            FALSE,
            20
        )

) AS dados(
    codigo,
    nome,
    disponivel,
    ordem
)

WHERE LOWER(
    situacoes.codigo
) = LOWER(
    dados.codigo
);


-- =========================================================
-- INSERE AS SITUAÇÕES QUE AINDA NÃO EXISTIREM
-- =========================================================

INSERT INTO situacoes (
    codigo,
    nome,
    disponivel,
    ativa,
    ordem
)

SELECT
    dados.codigo,
    dados.nome,
    dados.disponivel,
    TRUE,
    dados.ordem

FROM (
    VALUES

        ('PRESENTE', 'Presente', TRUE, 1),

        ('FALTA', 'Falta', FALSE, 2),

        ('ESV', 'Entrando de Serviço', FALSE, 3),

        ('SSV', 'Saindo de Serviço', FALSE, 4),

        ('DISPENSADO', 'Dispensado', FALSE, 5),

        (
            'DISPENSA_RECOMPENSA',
            'Dispensa Recompensa',
            FALSE,
            6
        ),

        (
            'DISPESA_MEDICA',
            'Dispesa Médica',
            FALSE,
            7
        ),

        ('HACO', 'HACO', FALSE, 8),

        (
            'JUNTA_SAUDE',
            'Junta de Saúde',
            FALSE,
            9
        ),

        (
            'MISSAO_SEDE',
            'Missão em Sede',
            FALSE,
            10
        ),

        (
            'MISSAO_FORA_SEDE',
            'Missão Fora de Sede',
            FALSE,
            11
        ),

        (
            'MISSAO_EXTERIOR',
            'Missão no Exterior',
            FALSE,
            12
        ),

        ('CURSO', 'Curso', FALSE, 13),

        (
            'SOBREAVISO',
            'Sobreaviso',
            FALSE,
            14
        ),

        (
            'ESTAGIO',
            'Estágio',
            TRUE,
            15
        ),

        (
            'PSF',
            'Prestando Serviço Fora',
            FALSE,
            16
        ),

        (
            'FERIAS',
            'Férias',
            FALSE,
            17
        ),

        ('BAIXA', 'Baixa', FALSE, 18),

        (
            'DETENCAO',
            'Detenção',
            FALSE,
            19
        ),

        (
            'PRISAO',
            'Prisão',
            FALSE,
            20
        )

) AS dados(
    codigo,
    nome,
    disponivel,
    ordem
)

WHERE NOT EXISTS (

    SELECT 1

    FROM situacoes s

    WHERE LOWER(
        s.codigo
    ) = LOWER(
        dados.codigo
    )

);


COMMIT;