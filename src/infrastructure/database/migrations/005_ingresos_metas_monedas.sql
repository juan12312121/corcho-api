-- Ingreso mensual por persona (reparto proporcional), notas en otra moneda,
-- ingresos del tablero personal (flujo del mes) y metas de ahorro con aportes.

-- ---------- ingreso mensual (privado: los demás solo ven su porcentaje) ----------
ALTER TABLE usuarios
  ADD COLUMN ingreso_mensual numeric(12,2) CHECK (ingreso_mensual IS NULL OR ingreso_mensual > 0);

-- ---------- notas en otra moneda ----------
-- monto sigue en la moneda del tablero; aquí queda lo original y el tipo de cambio usado
ALTER TABLE notas
  ADD COLUMN moneda_original text CHECK (moneda_original IS NULL OR moneda_original ~ '^[A-Z]{3}$'),
  ADD COLUMN monto_original  numeric(12,2) CHECK (monto_original IS NULL OR monto_original > 0),
  ADD COLUMN tipo_cambio     numeric(14,6) CHECK (tipo_cambio IS NULL OR tipo_cambio > 0),
  ADD CONSTRAINT notas_moneda_completa CHECK (
    (moneda_original IS NULL AND monto_original IS NULL AND tipo_cambio IS NULL)
    OR (moneda_original IS NOT NULL AND monto_original IS NOT NULL AND tipo_cambio IS NOT NULL));

-- ---------- ingresos (tablero personal) ----------
CREATE TABLE ingresos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id  uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  creado_por  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  concepto    text NOT NULL CHECK (length(trim(concepto)) BETWEEN 1 AND 80),
  monto       numeric(12,2) NOT NULL CHECK (monto > 0),
  fecha       date NOT NULL DEFAULT current_date,
  -- true = se repite cada mes a partir de `fecha` (sueldo, renta que cobras…)
  recurrente  boolean NOT NULL DEFAULT false,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ingresos_tablero_idx ON ingresos (tablero_id, fecha);

-- ---------- metas de ahorro ----------
CREATE TABLE metas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id     uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  creado_por     uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre         text NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 60),
  objetivo       numeric(12,2) NOT NULL CHECK (objetivo > 0),
  fecha_limite   date,
  color          text NOT NULL DEFAULT '#2E9E5B' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX metas_tablero_idx ON metas (tablero_id);

-- Un aporte positivo suma; uno negativo es un retiro (nunca deja la meta en negativo: lo cuida el dominio)
CREATE TABLE meta_aportes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id     uuid NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  monto       numeric(12,2) NOT NULL CHECK (monto <> 0),
  fecha       date NOT NULL DEFAULT current_date,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meta_aportes_meta_idx ON meta_aportes (meta_id);

-- Mismo criterio que el resto: el API entra con el usuario de la BD; nadie entra por PostgREST
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_aportes ENABLE ROW LEVEL SECURITY;
