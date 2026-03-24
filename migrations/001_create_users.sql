-- migrations/001_create_users.sql
-- Tabla de usuarios del sistema KarIA Scout.
-- needs_password_reset: flag para forzar cambio de contraseña en primer login.
-- rol: 'admin' puede gestionar cuentas Google. 'vendedor' solo usa el agente.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  needs_password_reset BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: cada usuario solo ve su propio registro
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_row" ON users
  FOR ALL USING (auth.uid()::text = id::text);
