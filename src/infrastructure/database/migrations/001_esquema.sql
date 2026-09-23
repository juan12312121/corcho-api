-- Tablero de deudas y gastos compartidos
-- Todos los montos en numeric(12,2). Las notas del tablero (post-its) son los gastos/deudas.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- usuarios ----------
CREATE TABLE usuarios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 80),
  email          text NOT NULL,
  password_hash  text NOT NULL,
  color          text NOT NULL DEFAULT '#F7B500',
  avatar_url     text,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuarios_email_uq ON usuarios (lower(email));

-- ---------- tableros ----------
CREATE TABLE tableros (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 80),
  descripcion    text,
  moneda         char(3) NOT NULL DEFAULT 'MXN',
  fondo          text NOT NULL DEFAULT 'corcho',
  propietario_id uuid NOT NULL REFERENCES usuarios(id),
  archivado      boolean NOT NULL DEFAULT false,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tablero_miembros (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol        text NOT NULL DEFAULT 'miembro' CHECK (rol IN ('propietario', 'admin', 'miembro')),
  apodo      text,
  unido_en   timestamptz NOT NULL DEFAULT now(),
  creado_en  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tablero_id, usuario_id)
);
CREATE INDEX tablero_miembros_usuario_idx ON tablero_miembros (usuario_id);

-- ---------- invitaciones ----------
-- email NULL = enlace abierto (cualquiera con el código, hasta usos_max); con email solo esa persona.
CREATE TABLE invitaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id    uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  invitado_por  uuid NOT NULL REFERENCES usuarios(id),
  email         text,
  codigo        text NOT NULL UNIQUE,
  rol           text NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin', 'miembro')),
  estado        text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  usos_max      int CHECK (usos_max IS NULL OR usos_max > 0),
  usos          int NOT NULL DEFAULT 0,
  expira_en     timestamptz NOT NULL,
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invitaciones_tablero_idx ON invitaciones (tablero_id);
CREATE INDEX invitaciones_email_idx ON invitaciones (lower(email)) WHERE email IS NOT NULL;

-- ---------- notas (gastos / servicios / préstamos / recordatorios) ----------
-- estado: por_pagar = nadie le ha pagado al proveedor (luz, internet...) todavía
--         pagada    = pagado_por puso el dinero; los demás le deben su parte
--         liquidada = todos los que debían ya le pagaron a pagado_por
CREATE TABLE notas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id     uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  creado_por     uuid NOT NULL REFERENCES usuarios(id),
  tipo           text NOT NULL DEFAULT 'gasto' CHECK (tipo IN ('gasto', 'servicio', 'prestamo', 'recordatorio')),
  titulo         text NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 120),
  descripcion    text,
  categoria      text,
  monto          numeric(12,2) CHECK (monto IS NULL OR monto > 0),
  modo_reparto   text NOT NULL DEFAULT 'igual' CHECK (modo_reparto IN ('igual', 'montos', 'porcentaje', 'proporcion')),
  pagado_por     uuid REFERENCES usuarios(id),
  estado         text NOT NULL DEFAULT 'pagada' CHECK (estado IN ('por_pagar', 'pagada', 'liquidada')),
  fecha          date NOT NULL DEFAULT current_date,
  vence_en       date,
  recurrencia    text NOT NULL DEFAULT 'ninguna' CHECK (recurrencia IN ('ninguna', 'semanal', 'quincenal', 'mensual')),
  pagada_en      timestamptz,
  liquidada_en   timestamptz,
  -- aspecto en el corcho
  color          text NOT NULL DEFAULT 'amarillo' CHECK (color IN ('amarillo', 'azul', 'verde', 'rosa', 'naranja', 'morado')),
  pin_color      text NOT NULL DEFAULT 'rojo',
  pos_x          real NOT NULL DEFAULT 40,
  pos_y          real NOT NULL DEFAULT 40,
  rotacion       real NOT NULL DEFAULT 0 CHECK (rotacion BETWEEN -15 AND 15),
  z              int NOT NULL DEFAULT 0,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  -- una nota con dinero pagada debe decir quién pagó; un recordatorio no lleva monto
  CHECK (estado = 'por_pagar' OR tipo = 'recordatorio' OR pagado_por IS NOT NULL),
  CHECK (tipo <> 'recordatorio' OR monto IS NULL),
  CHECK (tipo = 'recordatorio' OR monto IS NOT NULL)
);
CREATE INDEX notas_tablero_idx ON notas (tablero_id, creado_en DESC);

-- Cuánto le toca a cada quien de una nota
CREATE TABLE nota_partes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id     uuid NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES usuarios(id),
  monto       numeric(12,2) NOT NULL CHECK (monto >= 0),
  porcentaje  numeric(6,3),
  proporcion  numeric(8,3),
  liquidada   boolean NOT NULL DEFAULT false,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nota_id, usuario_id)
);
CREATE INDEX nota_partes_usuario_idx ON nota_partes (usuario_id);

-- ---------- pagos entre miembros ----------
-- Lo registra quien pagó (queda pendiente hasta que quien recibe confirme)
-- o quien recibió (queda confirmado de una vez). Solo los confirmados cuentan en el balance.
CREATE TABLE pagos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id     uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  de_usuario_id  uuid NOT NULL REFERENCES usuarios(id),
  a_usuario_id   uuid NOT NULL REFERENCES usuarios(id),
  monto          numeric(12,2) NOT NULL CHECK (monto > 0),
  nota_id        uuid REFERENCES notas(id) ON DELETE SET NULL,
  concepto       text,
  metodo         text NOT NULL DEFAULT 'efectivo' CHECK (metodo IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  estado         text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
  registrado_por uuid NOT NULL REFERENCES usuarios(id),
  fecha          date NOT NULL DEFAULT current_date,
  confirmado_en  timestamptz,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (de_usuario_id <> a_usuario_id)
);
CREATE INDEX pagos_tablero_idx ON pagos (tablero_id, creado_en DESC);

-- ---------- bitácora del tablero ----------
CREATE TABLE actividad (
  id          bigserial PRIMARY KEY,
  tablero_id  uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo        text NOT NULL,
  datos       jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX actividad_tablero_idx ON actividad (tablero_id, creado_en DESC);

-- Supabase expone el esquema public por su API REST con la anon key.
-- RLS encendido y sin políticas = nadie entra por ahí; este backend usa el rol postgres (se salta RLS).
ALTER TABLE usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tableros         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablero_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE nota_partes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad        ENABLE ROW LEVEL SECURITY;
ALTER TABLE _migraciones     ENABLE ROW LEVEL SECURITY;
