/*
# Fix: allow anon to execute is_admin()

## Problema
La policy `select_profili_pubblici` su `profili_tuttofare` richiama `is_admin()`
nelle sue condizioni (`OR is_admin()`). La funzione `is_admin()` e' SECURITY DEFINER
con EXECUTE revocata da PUBLIC/anon e concessa solo a `authenticated`.
Quando un utente anonimo (non loggato) tenta una SELECT, la policy chiama `is_admin()`
e Postgres restituisce "permission denied for function is_admin", bloccando l'intera query.

## Soluzione
Concedere EXECUTE su `is_admin()` anche ad `anon`. La funzione resta sicura:
ritorna `false` quando `auth.uid()` e' null (utente non autenticato).

## Nessun dato modificato
*/

GRANT EXECUTE ON FUNCTION is_admin() TO anon;
