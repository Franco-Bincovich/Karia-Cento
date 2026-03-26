-- migrations/001_schema_cento.sql
-- Schema principal de KarIA Cento.
-- Tablas: usuarios_cento, conversaciones_cento, sesiones_cento.
-- Ejecutar en orden; conversaciones_cento y sesiones_cento referencian usuarios_cento.

-- ─── USUARIOS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios_cento (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT        UNIQUE NOT NULL,
  password_hash        TEXT        NOT NULL,
  nombre               TEXT        NOT NULL,
  rol                  TEXT        NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  needs_password_reset BOOLEAN     NOT NULL DEFAULT false,
  activo               BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios_cento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_cento_own_row" ON usuarios_cento
  FOR ALL USING (auth.uid()::text = id::text);

-- ─── CONVERSACIONES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversaciones_cento (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES usuarios_cento(id) ON DELETE CASCADE,
  titulo     TEXT,
  messages   JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversaciones_cento_user_id   ON conversaciones_cento(user_id);
CREATE INDEX idx_conversaciones_cento_updated_at ON conversaciones_cento(updated_at DESC);

ALTER TABLE conversaciones_cento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversaciones_cento_own_rows" ON conversaciones_cento
  FOR ALL USING (user_id = auth.uid()::uuid);

-- ─── SESIONES ────────────────────────────────────────────────────────────────
-- Almacena refresh tokens server-side (Base 9: tokens solo server-side).
-- Un usuario puede tener múltiples sesiones activas (multi-device).

CREATE TABLE IF NOT EXISTS sesiones_cento (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES usuarios_cento(id) ON DELETE CASCADE,
  refresh_token TEXT        NOT NULL UNIQUE,
  user_agent    TEXT,
  ip_address    TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  revocada      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sesiones_cento_user_id       ON sesiones_cento(user_id);
CREATE INDEX idx_sesiones_cento_refresh_token ON sesiones_cento(refresh_token);

ALTER TABLE sesiones_cento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sesiones_cento_own_rows" ON sesiones_cento
  FOR ALL USING (user_id = auth.uid()::uuid);

-- ─── PERMISOS POSTGREST ──────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.usuarios_cento      TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversaciones_cento TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.sesiones_cento      TO postgres, anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
