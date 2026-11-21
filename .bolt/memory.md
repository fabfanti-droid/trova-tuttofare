# Project memory

## Product intent & audience

- Italian-language handyman directory ("vetrina tuttofare") connecting qualified handymen with potential clients.
- Two user types: **public visitors** searching for professionals, and **handymen** managing their own profiles behind auth.
- No public registration; admin-created accounts only.

## Brand personality & voice

- Professional, clean, trustworthy directory tone.
- All UI text in Italian (e.g. "Diventa un Tuttofare", "Area Tuttofare", "Contatta [nome]").

## Visual design & UX direction

- Header: logo/title left, two CTA buttons right ("Diventa un Tuttofare", "Area Tuttofare").
- Hero with search bar (service/keyword input + city dropdown populated dynamically, includes "Tutte le città").
- Professional cards grid: avatar with elegant fallback, name, city with location icon, colored service badges (comma-separated → tags), description, "Contatta [nome]" button. Email never shown publicly.
- Contact: modal popup with client fields; green success confirmation; auto-close on success.
- Auth area: minimal login screen (email/password + "Password dimenticata?"); post-login shows only "Il Mio Profilo" — no other navigation except home/logout.
- Profile form: live photo preview, clean field layout, success save alert.
- Red warning banner when subscription status ≠ "Attivo", with edit form disabled.
- Icons from lucide-react; `@/` path alias for imports.

## Decisions, constraints & rationale

- **Supabase client**: `@supabase/supabase-js` with provided URL and anon key.
- **DB table**: `profili_tuttofare` — columns: id (uuid), email, nome, citta, servizi, descrizione, foto_url, stato.
- **Public listing query**: filters `stato = 'Attivo'` AND `nome` not empty.
- **Contact webhook**: POST JSON to `https://hook.eu1.make.com/1rm8txdh64dhfb6u3uxy55rw95xomse4` with fields: nome_tuttofare, email_tuttofare (from profile), nome_cliente, email_cliente, telefono_cliente, messaggio.
- **Auth**: `supabase.auth.signInWithPassword`; password reset via `supabase.auth.resetPasswordForEmail`; no public signup UI.
- **Profile edit scope**: only nome, citta, servizi, descrizione, foto_url editable; email/stato not editable by user.
- **Editable fields gated by `stato === 'Attivo'`**; otherwise form locked with expired-subscription warning.

## Open questions & assumptions

- "Diventa un Tuttofare" is a placeholder link — destination TBD.
- Supabase RLS policies assumed configured to allow public SELECT on active profiles and authenticated users to UPDATE their own row.
- Webhook assumed always reachable; no retry/fallback implemented.
- City dropdown sourced from distinct `citta` values of active profiles — assumes data consistency in that field.