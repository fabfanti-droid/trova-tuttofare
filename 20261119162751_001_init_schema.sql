/*
# Schema iniziale: profili_tuttofare, richieste_contatto, amministratori

## Tabelle create

1. `profili_tuttofare` — profili pubblici dei tuttofare
   - id (uuid, PK, correlato ad auth.users)
   - email (text, not null)
   - nome (text, nullable)
   - citta (text, nullable)
   - servizi (text, nullable — lista separata da virgole)
   - descrizione (text, nullable)
   - foto_url (text, nullable — URL pubblico della foto caricata nello storage)
   - stato (text, default 'Attivo' — valori: 'Attivo', 'Scaduto')
   - created_at, updated_at (timestamptz)

2. `richieste_contatto` — richieste di contatto inviate dai clienti
   - id (uuid, PK)
   - tuttofare_id (uuid, FK → profili_tuttofare)
   - nome_tuttofare, email_tuttofare (text)
   - nome_cliente (text, not null)
   - email_cliente (text, not null)
   - telefono_cliente (text, nullable)
   - messaggio (text, not null)
   - created_at (timestamptz)

3. `amministratori` — designa quali utenti auth sono admin
   - id (uuid, PK, FK → auth.users)
   - email (text, not null)
   - created_at (timestamptz)

## Funzione
- `is_admin()` — SECURITY DEFINER, restituisce true se auth.uid() è in amministratori

## Storage
- Bucket `foto-tuttofare` (public) per foto profilo

## Security (RLS)
- profili_tuttofare: SELECT pubblico per attivi+nome, proprietario vede sempre, admin vede tutto; UPDATE proprietario o admin; INSERT/DELETE admin
- richieste_contatto: INSERT pubblico, SELECT/UPDATE/DELETE admin
- amministratori: SELECT per id=auth.uid() o admin; INSERT admin
- Storage: lettura pubblica, upload/update/delete solo proprietario nella propria cartella
*/

-- ============================================================
-- amministratori (creata prima perché is_admin la referenzia)
-- ============================================================
CREATE TABLE IF NOT EXISTS amministratori (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE amministratori ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON amministratori TO authenticated;

-- ============================================================
-- Funzione is_admin (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM amministratori WHERE id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================
-- profili_tuttofare
-- ============================================================
CREATE TABLE IF NOT EXISTS profili_tuttofare (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text,
  citta text,
  servizi text,
  descrizione text,
  foto_url text,
  stato text NOT NULL DEFAULT 'Attivo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profili_tuttofare ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON profili_tuttofare TO authenticated;
GRANT SELECT ON profili_tuttofare TO anon;

DROP POLICY IF EXISTS "select_profili_pubblici" ON profili_tuttofare;
CREATE POLICY "select_profili_pubblici"
ON profili_tuttofare FOR SELECT
TO anon, authenticated
USING (
  (stato = 'Attivo' AND COALESCE(nome, '') <> '')
  OR id = auth.uid()
  OR is_admin()
);

DROP POLICY IF EXISTS "admin_insert_profili" ON profili_tuttofare;
CREATE POLICY "admin_insert_profili"
ON profili_tuttofare FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_own_profilo" ON profili_tuttofare;
CREATE POLICY "update_own_profilo"
ON profili_tuttofare FOR UPDATE
TO authenticated
USING (id = auth.uid() OR is_admin())
WITH CHECK (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "admin_delete_profilo" ON profili_tuttofare;
CREATE POLICY "admin_delete_profilo"
ON profili_tuttofare FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- richieste_contatto
-- ============================================================
CREATE TABLE IF NOT EXISTS richieste_contatto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tuttofare_id uuid REFERENCES profili_tuttofare(id) ON DELETE CASCADE,
  nome_tuttofare text,
  email_tuttofare text,
  nome_cliente text NOT NULL,
  email_cliente text NOT NULL,
  telefono_cliente text,
  messaggio text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE richieste_contatto ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON richieste_contatto TO authenticated;
GRANT INSERT ON richieste_contatto TO anon;

DROP POLICY IF EXISTS "admin_select_richieste" ON richieste_contatto;
CREATE POLICY "admin_select_richieste"
ON richieste_contatto FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "public_insert_richieste" ON richieste_contatto;
CREATE POLICY "public_insert_richieste"
ON richieste_contatto FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_richieste" ON richieste_contatto;
CREATE POLICY "admin_update_richieste"
ON richieste_contatto FOR UPDATE
TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_richieste" ON richieste_contatto;
CREATE POLICY "admin_delete_richieste"
ON richieste_contatto FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================================
-- amministratori policies
-- ============================================================
DROP POLICY IF EXISTS "admin_select_admins" ON amministratori;
CREATE POLICY "admin_select_admins"
ON amministratori FOR SELECT
TO authenticated
USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "admin_insert_admin" ON amministratori;
CREATE POLICY "admin_insert_admin"
ON amministratori FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- ============================================================
-- Storage bucket per foto profilo
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('foto-tuttofare', 'foto-tuttofare', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_foto" ON storage.objects;
CREATE POLICY "public_read_foto"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'foto-tuttofare');

DROP POLICY IF EXISTS "auth_upload_foto" ON storage.objects;
CREATE POLICY "auth_upload_foto"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'foto-tuttofare' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "auth_update_foto" ON storage.objects;
CREATE POLICY "auth_update_foto"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'foto-tuttofare' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'foto-tuttofare' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "auth_delete_foto" ON storage.objects;
CREATE POLICY "auth_delete_foto"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'foto-tuttofare' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Indici
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profili_stato ON profili_tuttofare(stato);
CREATE INDEX IF NOT EXISTS idx_richieste_tuttofare_id ON richieste_contatto(tuttofare_id);
CREATE INDEX IF NOT EXISTS idx_richieste_created_at ON richieste_contatto(created_at DESC);
