/*
# Recensioni tuttofare

## Modifiche alle tabelle

### richieste_contatto
- Aggiunta colonna `risposta_inviata` (boolean, default false) — il tuttofare segna quando ha risposto al cliente
- Aggiunta colonna `token_recensione` (text, nullable) — token univoco che il tuttofare invia al cliente per lasciare una recensione

### Nuova tabella `recensioni`
- id (uuid, PK)
- richiesta_id (uuid, FK → richieste_contatto.id ON DELETE CASCADE)
- tuttofare_id (uuid, FK → profili_tuttofare.id ON DELETE CASCADE)
- nome_cliente (text)
- email_cliente (text)
- voto (integer, 1-5)
- testo (text, nullable)
- created_at (timestamptz)

## Funzione `inserisci_recensione`
SECURITY DEFINER function che:
1. Verifica il token_recensione corrisponde alla richiesta
2. Verifica la richiesta ha risposta_inviata = true
3. Verifica non esiste gia una recensione per quella richiesta
4. Inserisce la recensione
5. Invalida il token (imposta a NULL)

## Security (RLS)

### richieste_contatto UPDATE
- Il tuttofare puo aggiornare risposta_inviata e token_recensione solo sulle proprie richieste

### recensioni
- SELECT: pubblico (anon + authenticated) — le recensioni sono pubbliche
- INSERT: solo tramite la funzione inserisci_recensione (nessun INSERT diretto)
- UPDATE/DELETE: solo admin
*/

-- ============================================================
-- Aggiungi colonne a richieste_contatto
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'richieste_contatto'
    AND column_name = 'risposta_inviata'
  ) THEN
    ALTER TABLE richieste_contatto ADD COLUMN risposta_inviata boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'richieste_contatto'
    AND column_name = 'token_recensione'
  ) THEN
    ALTER TABLE richieste_contatto ADD COLUMN token_recensione text;
  END IF;
END $$;

-- ============================================================
-- Tabella recensioni
-- ============================================================
CREATE TABLE IF NOT EXISTS recensioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  richiesta_id uuid UNIQUE REFERENCES richieste_contatto(id) ON DELETE CASCADE,
  tuttofare_id uuid REFERENCES profili_tuttofare(id) ON DELETE CASCADE,
  nome_cliente text NOT NULL,
  email_cliente text NOT NULL,
  voto integer NOT NULL CHECK (voto >= 1 AND voto <= 5),
  testo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recensioni ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON recensioni TO anon, authenticated;

-- SELECT pubblico: tutti vedono le recensioni
DROP POLICY IF EXISTS "public_select_recensioni" ON recensioni;
CREATE POLICY "public_select_recensioni"
ON recensioni FOR SELECT
TO anon, authenticated
USING (true);

-- UPDATE/DELETE: solo admin
DROP POLICY IF EXISTS "admin_update_recensioni" ON recensioni;
CREATE POLICY "admin_update_recensioni"
ON recensioni FOR UPDATE
TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_recensioni" ON recensioni;
CREATE POLICY "admin_delete_recensioni"
ON recensioni FOR DELETE
TO authenticated
USING (is_admin());

-- Nessuna INSERT policy diretta: le recensioni si inseriscono solo via RPC

-- ============================================================
-- Funzione inserisci_recensione
-- ============================================================
CREATE OR REPLACE FUNCTION inserisci_recensione(
  p_token text,
  p_voto integer,
  p_testo text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_richiesta richieste_contatto%ROWTYPE;
  v_esiste integer;
  v_result json;
BEGIN
  -- Verifica voto valido
  IF p_voto < 1 OR p_voto > 5 THEN
    RETURN json_build_object('success', false, 'error', 'Voto non valido');
  END IF;

  -- Trova la richiesta tramite token
  SELECT * INTO v_richiesta
  FROM richieste_contatto
  WHERE token_recensione = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token non valido o scaduto');
  END IF;

  -- Verifica che il tuttofare abbia risposto
  IF v_richiesta.risposta_inviata = false THEN
    RETURN json_build_object('success', false, 'error', 'Il tuttofare non ha ancora risposto');
  END IF;

  -- Verifica che non esista gia una recensione
  SELECT count(*) INTO v_esiste
  FROM recensioni
  WHERE richiesta_id = v_richiesta.id;

  IF v_esiste > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Recensione gia inserita');
  END IF;

  -- Inserisci la recensione
  INSERT INTO recensioni (richiesta_id, tuttofare_id, nome_cliente, email_cliente, voto, testo)
  VALUES (v_richiesta.id, v_richiesta.tuttofare_id, v_richiesta.nome_cliente, v_richiesta.email_cliente, p_voto, p_testo);

  -- Invalida il token
  UPDATE richieste_contatto SET token_recensione = NULL WHERE id = v_richiesta.id;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION inserisci_recensione(text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION inserisci_recensione(text, integer, text) TO anon, authenticated;

-- ============================================================
-- Aggiorna policy UPDATE su richieste_contatto
-- Il tuttofare puo aggiornare risposta_inviata e token_recensione sulle proprie richieste
-- ============================================================
-- La policy esistente update_own_profilo e su profili, non su richieste.
-- Serve una policy su richieste_contatto per il tuttofare.
-- Attualmente solo admin puo UPDATE su richieste_contatto.
-- Aggiungiamo: il tuttofare puo aggiornare le richieste associate al suo profilo.

DROP POLICY IF EXISTS "tuttofare_update_own_richieste" ON richieste_contatto;
CREATE POLICY "tuttofare_update_own_richieste"
ON richieste_contatto FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profili_tuttofare p
    WHERE p.id = auth.uid()
    AND (richieste_contatto.tuttofare_id = p.id OR richieste_contatto.email_tuttofare = p.email)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profili_tuttofare p
    WHERE p.id = auth.uid()
    AND (richieste_contatto.tuttofare_id = p.id OR richieste_contatto.email_tuttofare = p.email)
  )
);

-- ============================================================
-- Indici
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recensioni_tuttofare_id ON recensioni(tuttofare_id);
CREATE INDEX IF NOT EXISTS idx_richieste_token ON richieste_contatto(token_recensione) WHERE token_recensione IS NOT NULL;
