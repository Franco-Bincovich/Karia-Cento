-- migrations/004_grant_permissions.sql
-- Permisos explícitos para PostgREST.
-- En Supabase, las tablas creadas via SQL Editor necesitan GRANTs
-- para que los roles anon / authenticated / service_role puedan operar.

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.users          TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversaciones TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.google_accounts TO postgres, anon, authenticated, service_role;

-- Secuencias (UUIDs con gen_random_uuid no las necesitan, pero por consistencia)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
