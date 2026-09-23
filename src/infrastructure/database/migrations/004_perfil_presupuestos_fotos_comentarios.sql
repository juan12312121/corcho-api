-- Perfil (teléfono, avisos por WhatsApp, datos para recibir pagos), recuperación de contraseña,
-- presupuestos por categoría, fotos de tickets (Cloudinary), comentarios y archivo de notas.

-- ---------- perfil ----------
ALTER TABLE usuarios
  ADD COLUMN telefono        text CHECK (telefono IS NULL OR telefono ~ '^[0-9]{10,15}$'),
  ADD COLUMN avisos_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN clabe           text CHECK (clabe IS NULL OR clabe ~ '^[0-9]{18}$'),
  ADD COLUMN banco           text CHECK (banco IS NULL OR length(banco) <= 60),
  ADD COLUMN titular_cuenta  text CHECK (titular_cuenta IS NULL OR length(titular_cuenta) <= 80);

-- ---------- recuperación de contraseña ----------
-- Solo se guarda el hash del token; el token viaja en el enlace del correo.
CREATE TABLE recuperaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expira_en   timestamptz NOT NULL,
  usada_en    timestamptz,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recuperaciones_usuario_idx ON recuperaciones (usuario_id);

-- ---------- presupuestos ----------
CREATE TABLE presupuestos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id     uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  categoria_id   uuid NOT NULL UNIQUE REFERENCES categorias(id) ON DELETE CASCADE,
  monto_mensual  numeric(12,2) NOT NULL CHECK (monto_mensual > 0),
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX presupuestos_tablero_idx ON presupuestos (tablero_id);

-- ---------- fotos de tickets (los archivos viven en Cloudinary) ----------
CREATE TABLE adjuntos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id  uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  nota_id     uuid NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  subido_por  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  public_id   text NOT NULL UNIQUE,
  url         text NOT NULL CHECK (url LIKE 'https://res.cloudinary.com/%'),
  ancho       int,
  alto        int,
  formato     text,
  bytes       int,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX adjuntos_nota_idx ON adjuntos (nota_id);

-- ---------- comentarios ----------
CREATE TABLE comentarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id  uuid NOT NULL REFERENCES tableros(id) ON DELETE CASCADE,
  nota_id     uuid NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  texto       text NOT NULL CHECK (length(trim(texto)) BETWEEN 1 AND 1000),
  menciones   uuid[] NOT NULL DEFAULT '{}',
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comentarios_nota_idx ON comentarios (nota_id, creado_en);

-- ---------- archivo ----------
ALTER TABLE notas ADD COLUMN archivada boolean NOT NULL DEFAULT false;
CREATE INDEX notas_activas_idx ON notas (tablero_id) WHERE NOT archivada;

ALTER TABLE recuperaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjuntos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios    ENABLE ROW LEVEL SECURITY;
