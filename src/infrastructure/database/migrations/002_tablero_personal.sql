-- Tableros personales, deudas con gente de fuera (contraparte) y su historial de abonos.

ALTER TABLE tableros
  ADD COLUMN tipo text NOT NULL DEFAULT 'compartido' CHECK (tipo IN ('personal', 'compartido'));

ALTER TABLE notas
  ADD COLUMN contraparte text CHECK (contraparte IS NULL OR length(trim(contraparte)) BETWEEN 1 AND 80),
  ADD COLUMN direccion   text CHECK (direccion IN ('debo', 'me_deben')),
  ADD COLUMN abonado     numeric(12,2) NOT NULL DEFAULT 0 CHECK (abonado >= 0),
  ADD CONSTRAINT notas_deuda_externa_chk CHECK ((contraparte IS NULL) = (direccion IS NULL)),
  ADD CONSTRAINT notas_abonado_chk CHECK (monto IS NULL OR abonado <= monto);

-- La regla "una nota pagada dice quién pagó" ahora exime a las deudas externas (no tienen pagador).
DO $$
DECLARE nombre text;
BEGIN
  SELECT conname INTO nombre FROM pg_constraint
   WHERE conrelid = 'notas'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) LIKE '%pagado_por IS NOT NULL%';
  EXECUTE format('ALTER TABLE notas DROP CONSTRAINT %I', nombre);
END $$;

ALTER TABLE notas ADD CONSTRAINT notas_pagador_chk
  CHECK (estado = 'por_pagar' OR tipo = 'recordatorio' OR contraparte IS NOT NULL OR pagado_por IS NOT NULL);

CREATE TABLE abonos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id        uuid NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  monto          numeric(12,2) NOT NULL CHECK (monto > 0),
  registrado_por uuid NOT NULL REFERENCES usuarios(id),
  fecha          date NOT NULL DEFAULT current_date,
  creado_en      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX abonos_nota_idx ON abonos (nota_id);
ALTER TABLE abonos ENABLE ROW LEVEL SECURITY;
