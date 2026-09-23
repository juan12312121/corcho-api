-- Pagos con tarjeta (Stripe Connect Express): cada quien conecta su cuenta para cobrar,
-- y el pago que confirma Stripe queda registrado una sola vez (por la sesión de Checkout).

ALTER TABLE usuarios
  ADD COLUMN stripe_cuenta_id text UNIQUE,
  -- true cuando Stripe ya le permite recibir pagos (terminó su alta)
  ADD COLUMN stripe_listo boolean NOT NULL DEFAULT false;

ALTER TABLE pagos
  ADD COLUMN stripe_sesion_id text UNIQUE;
