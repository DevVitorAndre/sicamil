\encoding UTF8

/* =========================================================
   SICAMIL
   Sessoes de autenticacao
========================================================= */

CREATE TABLE IF NOT EXISTS sessoes_web (

    sid VARCHAR NOT NULL
        COLLATE "default",

    sess JSON NOT NULL,

    expire TIMESTAMP(6) NOT NULL,

    CONSTRAINT sessoes_web_pkey
        PRIMARY KEY (sid)

);


CREATE INDEX IF NOT EXISTS idx_sessoes_web_expire
ON sessoes_web (expire);