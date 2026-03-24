-- migrations/003_create_google_accounts.sql
-- Credenciales OAuth2 de Google para el agente.
-- KarIA Scout usa exactamente 2 cuentas para esta prueba.
-- alias: nombre legible para identificar la cuenta ('cuenta_ventas', 'cuenta_admin').
-- El refresh_token se almacena server-side, nunca se expone al cliente (Base 9).

CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  email TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solo admins pueden ver y gestionar cuentas Google
ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_accounts_admin_only" ON google_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND rol = 'admin'
    )
  );
