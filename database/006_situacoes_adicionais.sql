BEGIN;

INSERT INTO situacoes
    (
        codigo,
        nome,
        disponivel,
        ativa,
        ordem
    )
VALUES
    ('LUTO', 'Luto', FALSE, TRUE, 21),
    ('PATERNIDADE', 'Paternidade', FALSE, TRUE, 22),
    ('MATERNIDADE', 'Maternidade', FALSE, TRUE, 23),
    ('NUPCIAS', 'Núpcias', FALSE, TRUE, 24)

ON CONFLICT DO NOTHING;

COMMIT;