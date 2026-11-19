import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { ProfiloTuttofare } from './types';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/b5dqn5jgy5ryb8u3qjm9c9kr7xixfmdr';

export function useProfiloUtente(userId: string | null | undefined) {
  const [profilo, setProfilo] = useState<ProfiloTuttofare | null>(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfilo(null);
      setCaricamento(false);
      return;
    }

    let attivo = true;
    setCaricamento(true);

    supabase
      .from('profili_tuttofare')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (attivo) {
          setProfilo(data);
          setCaricamento(false);
        }
      });

    return () => {
      attivo = false;
    };
  }, [userId]);

  return { profilo, caricamento };
}

export async function aggiornaProfilo(
  id: string,
  modifiche: Partial<Pick<ProfiloTuttofare, 'nome' | 'email' | 'telefono' | 'citta' | 'descrizione' | 'categorie'>>
) {
  const { data, error } = await supabase
    .from('profili_tuttofare')
    .update(modifiche)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as ProfiloTuttofare;
}

export async function inviaMessaggioContatto(dati: {
  nome: string;
  email: string;
  messaggio: string;
  destinatario: string;
  profilo_id?: string;
  profilo_nome?: string;
}) {
  const response = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...dati,
      inviato_il: new Date().toISOString(),
      origine: 'directory-tuttofare',
    }),
  });
  if (!response.ok) {
    throw new Error(`Invio non riuscito (${response.status})`);
  }
}
