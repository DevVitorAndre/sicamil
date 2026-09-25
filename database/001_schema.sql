\encoding UTF8

/* =========================================================
   SICAMIL
   Estrutura inicial do banco de dados
========================================================= */


/* =========================================================
   FUNÇÃO PARA UPDATED_AT
========================================================= */

CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;



/* =========================================================
   SEÇÕES
========================================================= */

CREATE TABLE IF NOT EXISTS secoes (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(120) NOT NULL,

    sigla VARCHAR(30) NOT NULL,

    ativa BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_secao_nome
        CHECK (BTRIM(nome) <> ''),

    CONSTRAINT chk_secao_sigla
        CHECK (BTRIM(sigla) <> '')

);


CREATE UNIQUE INDEX IF NOT EXISTS uq_secoes_sigla_lower
ON secoes (LOWER(sigla));



/* =========================================================
   POSTOS / GRADUAÇÕES

   A ordem hierárquica será cadastrada depois.
   Não vamos inventar a ordem agora.
========================================================= */

CREATE TABLE IF NOT EXISTS postos_graduacoes (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    sigla VARCHAR(20) NOT NULL,

    nome VARCHAR(80) NOT NULL,

    ordem INTEGER NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_posto_sigla
        CHECK (BTRIM(sigla) <> ''),

    CONSTRAINT chk_posto_nome
        CHECK (BTRIM(nome) <> ''),

    CONSTRAINT chk_posto_ordem
        CHECK (ordem > 0)

);


CREATE UNIQUE INDEX IF NOT EXISTS uq_postos_sigla_lower
ON postos_graduacoes (LOWER(sigla));


CREATE UNIQUE INDEX IF NOT EXISTS uq_postos_ordem
ON postos_graduacoes (ordem);



/* =========================================================
   SITUAÇÕES

   Exemplo futuro:
   expediente, férias, missão, licença etc.

   Nenhuma situação será inserida agora.
========================================================= */

CREATE TABLE IF NOT EXISTS situacoes (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    codigo VARCHAR(50) NOT NULL,

    nome VARCHAR(100) NOT NULL,

    disponivel BOOLEAN NOT NULL,

    ativa BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_situacao_codigo
        CHECK (BTRIM(codigo) <> ''),

    CONSTRAINT chk_situacao_nome
        CHECK (BTRIM(nome) <> '')

);


CREATE UNIQUE INDEX IF NOT EXISTS uq_situacoes_codigo_lower
ON situacoes (LOWER(codigo));



/* =========================================================
   USUÁRIOS
========================================================= */

CREATE TABLE IF NOT EXISTS usuarios (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    nome_guerra VARCHAR(80),

    login VARCHAR(80) NOT NULL,

    email VARCHAR(180) NOT NULL,

    senha_hash VARCHAR(255) NOT NULL,

    tipo VARCHAR(30) NOT NULL,

    secao_id BIGINT,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    ultimo_login TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    CONSTRAINT fk_usuario_secao

        FOREIGN KEY (secao_id)

        REFERENCES secoes(id)

        ON DELETE SET NULL,


    CONSTRAINT chk_usuario_nome
        CHECK (BTRIM(nome) <> ''),

    CONSTRAINT chk_usuario_login
        CHECK (BTRIM(login) <> ''),

    CONSTRAINT chk_usuario_email
        CHECK (BTRIM(email) <> ''),

    CONSTRAINT chk_usuario_senha
        CHECK (BTRIM(senha_hash) <> ''),

    CONSTRAINT chk_usuario_tipo
        CHECK (BTRIM(tipo) <> '')

);


CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_login_lower
ON usuarios (LOWER(login));


CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email_lower
ON usuarios (LOWER(email));


CREATE INDEX IF NOT EXISTS idx_usuarios_secao
ON usuarios (secao_id);



/* =========================================================
   PERMISSÕES
========================================================= */

CREATE TABLE IF NOT EXISTS permissoes (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    codigo VARCHAR(80) NOT NULL,

    nome VARCHAR(120) NOT NULL,

    descricao VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_permissao_codigo
        CHECK (BTRIM(codigo) <> ''),

    CONSTRAINT chk_permissao_nome
        CHECK (BTRIM(nome) <> '')

);


CREATE UNIQUE INDEX IF NOT EXISTS uq_permissoes_codigo_lower
ON permissoes (LOWER(codigo));



/* =========================================================
   USUÁRIO X PERMISSÕES
========================================================= */

CREATE TABLE IF NOT EXISTS usuario_permissoes (

    usuario_id BIGINT NOT NULL,

    permissao_id BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    PRIMARY KEY (
        usuario_id,
        permissao_id
    ),


    CONSTRAINT fk_usuario_permissao_usuario

        FOREIGN KEY (usuario_id)

        REFERENCES usuarios(id)

        ON DELETE CASCADE,


    CONSTRAINT fk_usuario_permissao_permissao

        FOREIGN KEY (permissao_id)

        REFERENCES permissoes(id)

        ON DELETE CASCADE

);



/* =========================================================
   MILITARES
========================================================= */

CREATE TABLE IF NOT EXISTS militares (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    posto_graduacao_id BIGINT NOT NULL,

    nome_guerra VARCHAR(100) NOT NULL,

    secao_id BIGINT NOT NULL,

    situacao_id BIGINT NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    CONSTRAINT fk_militar_posto

        FOREIGN KEY (posto_graduacao_id)

        REFERENCES postos_graduacoes(id)

        ON DELETE RESTRICT,


    CONSTRAINT fk_militar_secao

        FOREIGN KEY (secao_id)

        REFERENCES secoes(id)

        ON DELETE RESTRICT,


    CONSTRAINT fk_militar_situacao

        FOREIGN KEY (situacao_id)

        REFERENCES situacoes(id)

        ON DELETE RESTRICT,


    CONSTRAINT chk_militar_nome_guerra
        CHECK (BTRIM(nome_guerra) <> '')

);


CREATE INDEX IF NOT EXISTS idx_militares_posto
ON militares (posto_graduacao_id);


CREATE INDEX IF NOT EXISTS idx_militares_secao
ON militares (secao_id);


CREATE INDEX IF NOT EXISTS idx_militares_situacao
ON militares (situacao_id);


CREATE INDEX IF NOT EXISTS idx_militares_nome_guerra_lower
ON militares (LOWER(nome_guerra));



/* =========================================================
   CHAMADAS
========================================================= */

CREATE TABLE IF NOT EXISTS chamadas (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    data DATE NOT NULL,

    secao_id BIGINT NOT NULL,

    responsavel_usuario_id BIGINT,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    data_hora_inicio TIMESTAMPTZ,

    data_hora_conclusao TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    CONSTRAINT fk_chamada_secao

        FOREIGN KEY (secao_id)

        REFERENCES secoes(id)

        ON DELETE RESTRICT,


    CONSTRAINT fk_chamada_responsavel

        FOREIGN KEY (responsavel_usuario_id)

        REFERENCES usuarios(id)

        ON DELETE SET NULL,


    CONSTRAINT chk_chamada_status

        CHECK (
            status IN (
                'PENDENTE',
                'EM_ANDAMENTO',
                'REALIZADA'
            )
        ),


    CONSTRAINT uq_chamada_secao_data

        UNIQUE (
            data,
            secao_id
        )

);


CREATE INDEX IF NOT EXISTS idx_chamadas_data
ON chamadas (data);


CREATE INDEX IF NOT EXISTS idx_chamadas_secao
ON chamadas (secao_id);


CREATE INDEX IF NOT EXISTS idx_chamadas_status
ON chamadas (status);



/* =========================================================
   MILITARES REGISTRADOS NA CHAMADA
========================================================= */

CREATE TABLE IF NOT EXISTS chamada_militares (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    chamada_id BIGINT NOT NULL,

    militar_id BIGINT NOT NULL,

    situacao_id BIGINT NOT NULL,

    presente BOOLEAN NOT NULL,

    observacao VARCHAR(500),

    registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    CONSTRAINT fk_chamada_militar_chamada

        FOREIGN KEY (chamada_id)

        REFERENCES chamadas(id)

        ON DELETE CASCADE,


    CONSTRAINT fk_chamada_militar_militar

        FOREIGN KEY (militar_id)

        REFERENCES militares(id)

        ON DELETE RESTRICT,


    CONSTRAINT fk_chamada_militar_situacao

        FOREIGN KEY (situacao_id)

        REFERENCES situacoes(id)

        ON DELETE RESTRICT,


    CONSTRAINT uq_chamada_militar

        UNIQUE (
            chamada_id,
            militar_id
        )

);


CREATE INDEX IF NOT EXISTS idx_chamada_militares_chamada
ON chamada_militares (chamada_id);


CREATE INDEX IF NOT EXISTS idx_chamada_militares_militar
ON chamada_militares (militar_id);



/* =========================================================
   RECUPERAÇÃO DE SENHA
========================================================= */

CREATE TABLE IF NOT EXISTS recuperacao_senha_tokens (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    token_hash VARCHAR(255) NOT NULL,

    expira_em TIMESTAMPTZ NOT NULL,

    utilizado_em TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    CONSTRAINT fk_recuperacao_usuario

        FOREIGN KEY (usuario_id)

        REFERENCES usuarios(id)

        ON DELETE CASCADE

);


CREATE UNIQUE INDEX IF NOT EXISTS uq_recuperacao_token_hash
ON recuperacao_senha_tokens (token_hash);


CREATE INDEX IF NOT EXISTS idx_recuperacao_usuario
ON recuperacao_senha_tokens (usuario_id);



/* =========================================================
   TRIGGERS UPDATED_AT
========================================================= */

DROP TRIGGER IF EXISTS trg_secoes_updated_at
ON secoes;

CREATE TRIGGER trg_secoes_updated_at

BEFORE UPDATE ON secoes

FOR EACH ROW

EXECUTE FUNCTION atualizar_updated_at();



DROP TRIGGER IF EXISTS trg_postos_updated_at
ON postos_graduacoes;

CREATE TRIGGER trg_postos_updated_at

BEFORE UPDATE ON postos_graduacoes

FOR EACH ROW

EXECUTE FUNCTION atualizar_updated_at();



DROP TRIGGER IF EXISTS trg_situacoes_updated_at
ON situacoes;

CREATE TRIGGER trg_situacoes_updated_at

BEFORE UPDATE ON situacoes

FOR EACH ROW

EXECUTE FUNCTION atualizar_updated_at();



DROP TRIGGER IF EXISTS trg_usuarios_updated_at
ON usuarios;

CREATE TRIGGER trg_usuarios_updated_at

BEFORE UPDATE ON usuarios

FOR EACH ROW

EXECUTE FUNCTION atualizar_updated_at();



DROP TRIGGER IF EXISTS trg_militares_updated_at
ON militares;

CREATE TRIGGER trg_militares_updated_at

BEFORE UPDATE ON militares

FOR EACH ROW

EXECUTE FUNCTION atualizar_updated_at();



DROP TRIGGER IF EXISTS trg_chamadas_updated_at
ON chamadas;

CREATE TRIGGER trg_chamadas_updated_at

BEFORE UPDATE ON chamadas

FOR EACH ROW

EXECUTE FUNCTION atualizar_updated_at();