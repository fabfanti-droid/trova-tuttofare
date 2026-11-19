/*
# Create profili_tuttofare table

1. New Tables
- `profili_tuttofare`: directory of handymen ("tuttofare")
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable, references auth.users, nullable so directory entries can exist without a login)
  - `nome` (text, display name)
  - `email` (text, contact email)
  - `telefono` (text, contact phone)
  - `citta` (text, city of operation; region is derived in the app)
  - `descrizione` (text, bio)
  - `categorie` (text array, offered services)
  - `stato_abbonamento` (text, 'Attivo' or 'Scaduto', default 'Attivo')
  - `created_at`, `updated_at` (timestamps)

2. Security
- RLS enabled.
- SELECT: public (anon + authenticated) because the directory is a public listing page.
- INSERT/DELETE: authenticated, owner-scoped (auth.uid() = user_id).
- UPDATE: authenticated, owner-scoped, restricted to profile columns only —
  `stato_abbonamento` and `user_id` are not updatable by users.

3. Seed data
- A few demo directory rows with user_id NULL so the "Profili per Regione" page shows content.
*/

CREATE TABLE IF NOT EXISTS profili_tuttofare (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text,
  telefono text,
  citta text,
  descrizione text,
  categorie text[] NOT NULL DEFAULT '{}',
  stato_abbonamento text NOT NULL DEFAULT 'Attivo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profili_tuttofare ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profili_tuttofare TO anon, authenticated;
GRANT INSERT, DELETE ON profili_tuttofare TO authenticated;
GRANT UPDATE (nome, email, telefono, citta, descrizione, categorie) ON profili_tuttofare TO authenticated;

DROP POLICY IF EXISTS "select_public_profili" ON profili_tuttofare;
CREATE POLICY "select_public_profili" ON profili_tuttofare
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "insert_own_profilo" ON profili_tuttofare;
CREATE POLICY "insert_own_profilo" ON profili_tuttofare
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profilo" ON profili_tuttofare;
CREATE POLICY "update_own_profilo" ON profili_tuttofare
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profilo" ON profili_tuttofare;
CREATE POLICY "delete_own_profilo" ON profili_tuttofare
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

INSERT INTO profili_tuttofare (nome, email, telefono, citta, descrizione, categorie, stato_abbonamento)
SELECT * FROM (VALUES
  ('Marco Bianchi', 'marco.bianchi@example.com', '+39 333 111 2233', 'Milano', 'Idraulica ed elettricità a domicilio, interventi rapidi in giornata.', ARRAY['Idraulica','Elettricità'], 'Attivo'),
  ('Giulia Rossi', 'giulia.rossi@example.com', '+39 347 555 8899', 'Roma', 'Pulizie profonde di case e uffici, con prodotti ecologici.', ARRAY['Pulizie'], 'Attivo'),
  ('Luca Ferrari', 'luca.ferrari@example.com', '+39 348 222 3344', 'Torino', 'Giardinaggio, potature e cura del verde privato.', ARRAY['Giardinaggio'], 'Attivo'),
  ('Anna Conti', 'anna.conti@example.com', '+39 320 444 5566', 'Napoli', 'Sostituzione serramenti e piccole falegnameria su misura.', ARRAY['Serramenti','Falegnameria'], 'Attivo'),
  ('Paolo Esposito', 'paolo.esposito@example.com', '+39 331 666 7788', 'Palermo', 'Traslochi con auto attrezzata e montaggio mobili.', ARRAY['Traslochi','Montaggio mobili'], 'Attivo'),
  ('Sara Greco', 'sara.greco@example.com', '+39 349 777 8899', 'Firenze', 'Pittura interna ed esterna con finiture di qualità.', ARRAY['Pittura'], 'Attivo'),
  ('Davide Moretti', 'davide.moretti@example.com', '+39 335 888 9900', 'Bologna', 'Riparazione elettrodomestici di ogni marca.', ARRAY['Elettrodomestici'], 'Attivo'),
  ('Elena De Luca', 'elena.deluca@example.com', '+39 342 999 0011', 'Verona', 'Piccole riparazioni e manutenzione ordinaria di appartamenti.', ARRAY['Manutenzione','Pittura'], 'Attivo')
) AS seed(nome, email, telefono, citta, descrizione, categorie, stato_abbonamento)
WHERE NOT EXISTS (SELECT 1 FROM profili_tuttofare WHERE nome = 'Marco Bianchi');
