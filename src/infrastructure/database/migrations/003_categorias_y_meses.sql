-- Categorías personalizadas por tablero y compras/deudas a meses.

-- ---------- categorías ----------
CREATE TABLE categorias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id  uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  nombre      text NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 40),
  icono       text NOT NULL DEFAULT 'sell',
  color       text NOT NULL DEFAULT '#775836' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  creado_por  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX categorias_nombre_uq ON categorias (tablero_id, lower(nombre));
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Las notas pasan de texto libre a una categoría del tablero
ALTER TABLE notas ADD COLUMN categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL;

INSERT INTO categorias (tablero_id, nombre)
SELECT DISTINCT tablero_id, trim(categoria) FROM notas WHERE categoria IS NOT NULL AND trim(categoria) <> ''
ON CONFLICT DO NOTHING;

UPDATE notas n SET categoria_id = c.id
  FROM categorias c
 WHERE c.tablero_id = n.tablero_id AND lower(c.nombre) = lower(trim(n.categoria));

ALTER TABLE notas DROP COLUMN categoria;

-- Categorías de base para los tableros que ya existen
INSERT INTO categorias (tablero_id, nombre, icono, color)
SELECT t.id, d.nombre, d.icono, d.color
  FROM tableros t
 CROSS JOIN (VALUES
   ('Súper', 'shopping_cart', '#2E9E5B'),
   ('Comida', 'restaurant', '#F26B21'),
   ('Servicios', 'bolt', '#F2B705'),
   ('Renta', 'home', '#1E4FA3'),
   ('Transporte', 'directions_car', '#00A6A6'),
   ('Salud', 'medical_services', '#D64545'),
   ('Diversión', 'celebration', '#8A4FD6'),
   ('Otros', 'category', '#775836')
 ) AS d(nombre, icono, color)
ON CONFLICT DO NOTHING;

-- ---------- a meses ----------
-- Compra a meses (gasto/servicio): cada mensualidad es una nota; comparten plan_id.
--   monto = la mensualidad de ESA nota, monto_plan = total de la compra, numero_cuota = k de plazo_meses.
-- Deuda a meses (préstamo): una sola nota con plazo_meses; se va pagando (pagos o abonos).
ALTER TABLE notas
  ADD COLUMN plazo_meses  int CHECK (plazo_meses BETWEEN 2 AND 60),
  ADD COLUMN numero_cuota int,
  ADD COLUMN plan_id      uuid,
  ADD COLUMN monto_plan   numeric(12,2) CHECK (monto_plan IS NULL OR monto_plan > 0),
  ADD CONSTRAINT notas_cuota_chk CHECK (numero_cuota IS NULL OR (plazo_meses IS NOT NULL AND numero_cuota BETWEEN 1 AND plazo_meses)),
  ADD CONSTRAINT notas_plan_chk CHECK ((plan_id IS NULL) = (numero_cuota IS NULL) AND (plan_id IS NULL) = (monto_plan IS NULL));

CREATE INDEX notas_plan_idx ON notas (plan_id) WHERE plan_id IS NOT NULL;
