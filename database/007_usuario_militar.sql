ALTER TABLE usuarios
ADD COLUMN militar_id BIGINT NULL;


ALTER TABLE usuarios
ADD CONSTRAINT fk_usuarios_militar
FOREIGN KEY (militar_id)
REFERENCES militares(id)
ON DELETE SET NULL;


CREATE UNIQUE INDEX uq_usuarios_militar_id
ON usuarios(militar_id)
WHERE militar_id IS NOT NULL;