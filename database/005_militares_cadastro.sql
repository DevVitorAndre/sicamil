BEGIN;

-- =========================================================
-- SICAMIL
-- AJUSTE DO CADASTRO PERMANENTE DE MILITARES
-- =========================================================


-- Segurança:
-- Se já existirem militares cadastrados, interrompe a migração
-- para não perdermos informações sem analisar antes.

DO $$
BEGIN

    IF EXISTS (
        SELECT 1
        FROM militares
    ) THEN

        RAISE EXCEPTION
        'A tabela militares já possui registros. Migração interrompida para preservar os dados.';

    END IF;

END $$;


-- =========================================================
-- NOVOS CAMPOS
-- =========================================================

ALTER TABLE militares
ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(150);


ALTER TABLE militares
ADD COLUMN IF NOT EXISTS saram VARCHAR(20);


-- =========================================================
-- SITUAÇÃO NÃO PERTENCE MAIS AO CADASTRO PERMANENTE
-- =========================================================

ALTER TABLE militares
DROP COLUMN IF EXISTS situacao_id;


-- =========================================================
-- CAMPOS OBRIGATÓRIOS
-- =========================================================

ALTER TABLE militares
ALTER COLUMN nome_completo SET NOT NULL;


ALTER TABLE militares
ALTER COLUMN saram SET NOT NULL;


-- =========================================================
-- SARAM NÃO PODE SER REPETIDO
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS
uq_militares_saram
ON militares (saram);


COMMIT;