BEGIN;

UPDATE postos_graduacoes
SET
    nome = dados.nome,
    ordem = dados.ordem,
    ativo = TRUE,
    updated_at = CURRENT_TIMESTAMP
FROM (
    VALUES
        ('CEL', 'Coronel', 1),
        ('TC',  'Tenente-Coronel', 2),
        ('MAJ', 'Major', 3),
        ('CAP', 'Capitão', 4),
        ('1T',  'Primeiro Tenente', 5),
        ('2T',  'Segundo Tenente', 6),
        ('SO',  'Suboficial', 7),
        ('1S',  'Primeiro Sargento', 8),
        ('2S',  'Segundo Sargento', 9),
        ('3S',  'Terceiro Sargento', 10),
        ('CB',  'Cabo', 11),
        ('S1',  'Soldado de Primeira Classe', 12),
        ('S2',  'Soldado de Segunda Classe', 13),
        ('REC', 'Recruta', 14)
) AS dados(sigla, nome, ordem)
WHERE LOWER(postos_graduacoes.sigla) =
      LOWER(dados.sigla);


INSERT INTO postos_graduacoes (
    sigla,
    nome,
    ordem,
    ativo
)
SELECT
    dados.sigla,
    dados.nome,
    dados.ordem,
    TRUE
FROM (
    VALUES
        ('CEL', 'Coronel', 1),
        ('TC',  'Tenente-Coronel', 2),
        ('MAJ', 'Major', 3),
        ('CAP', 'Capitão', 4),
        ('1T',  'Primeiro Tenente', 5),
        ('2T',  'Segundo Tenente', 6),
        ('SO',  'Suboficial', 7),
        ('1S',  'Primeiro Sargento', 8),
        ('2S',  'Segundo Sargento', 9),
        ('3S',  'Terceiro Sargento', 10),
        ('CB',  'Cabo', 11),
        ('S1',  'Soldado de Primeira Classe', 12),
        ('S2',  'Soldado de Segunda Classe', 13),
        ('REC', 'Recruta', 14)
) AS dados(sigla, nome, ordem)
WHERE NOT EXISTS (
    SELECT 1
    FROM postos_graduacoes pg
    WHERE LOWER(pg.sigla) =
          LOWER(dados.sigla)
);


COMMIT;