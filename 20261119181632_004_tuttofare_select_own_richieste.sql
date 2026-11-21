/*
# Allow tuttofare to read their own contact requests

## Purpose
The review system requires tuttofare to see incoming contact requests in their
profile page so they can mark them as "risposta inviata" and get a review link.
Until now only admins could SELECT from richieste_contatto. This adds a
SELECT policy for the authenticated tuttofare whose profile matches the
request (by id or email), mirroring the existing UPDATE policy.

## Changes
1. New RLS SELECT policy `tuttofare_select_own_richieste` on `richieste_contatto`
   - TO authenticated
   - USING: EXISTS a profili_tuttofare row where p.id = auth.uid() AND
     (richieste_contatto.tuttofare_id = p.id OR richieste_contatto.email_tuttofare = p.email)

## Security notes
- No new grants needed: anon/authenticated already have SELECT granted on the table.
- The policy is scoped to the tuttofare's own requests only; other tuttofare
  cannot see them. Admins already have a broader SELECT policy.
*/

DROP POLICY IF EXISTS "tuttofare_select_own_richieste" ON richieste_contatto;

CREATE POLICY "tuttofare_select_own_richieste"
ON richieste_contatto FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profili_tuttofare p
    WHERE p.id = auth.uid()
    AND (richieste_contatto.tuttofare_id = p.id OR richieste_contatto.email_tuttofare = p.email)
  )
);