-- migrations/002_create_conversaciones.sql
-- Historial de conversaciones del agente por usuario.
-- messages: array JSONB con { role: 'user'|'assistant', content: string, timestamp }
-- El agente carga los últimos N mensajes de la sesión activa para mantener contexto.

CREATE TABLE IF NOT EXISTS conversaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversaciones_user_id ON conversaciones(user_id);
CREATE INDEX idx_conversaciones_updated_at ON conversaciones(updated_at DESC);

ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversaciones_own_rows" ON conversaciones
  FOR ALL USING (user_id = auth.uid()::uuid);
