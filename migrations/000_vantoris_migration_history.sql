-- VANTORIS migration bootstrap 000: append-only ordered migration history.
-- The migration runner applies this bootstrap before versioned migrations 001–023.
BEGIN;

CREATE TABLE IF NOT EXISTS public.vantoris_schema_migrations (
  version text PRIMARY KEY CHECK (version ~ '^[0-9]{3}$'),
  filename text NOT NULL UNIQUE,
  checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE OR REPLACE FUNCTION public.reject_vantoris_schema_migration_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,public
AS $$
BEGIN
  RAISE EXCEPTION 'VANTORIS_MIGRATION_HISTORY_APPEND_ONLY'
    USING ERRCODE='42501';
END
$$;

CREATE TRIGGER vantoris_schema_migrations_no_update_delete
BEFORE UPDATE OR DELETE ON public.vantoris_schema_migrations
FOR EACH ROW
EXECUTE FUNCTION public.reject_vantoris_schema_migration_mutation();

CREATE TRIGGER vantoris_schema_migrations_no_truncate
BEFORE TRUNCATE ON public.vantoris_schema_migrations
FOR EACH STATEMENT
EXECUTE FUNCTION public.reject_vantoris_schema_migration_mutation();

REVOKE ALL ON TABLE public.vantoris_schema_migrations FROM PUBLIC, vantoris_backend;
GRANT SELECT ON TABLE public.vantoris_schema_migrations TO vantoris_backend;
REVOKE ALL ON FUNCTION public.reject_vantoris_schema_migration_mutation() FROM PUBLIC;

COMMIT;
