import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProfiloTuttofare } from '../lib/types';

export function useProfiliPubblici() {
  const [profili, setProfili] = useState<ProfiloTuttofare[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let attivo = true;
    supabase
      .from('profili_tuttofare')
      .select('*')
      .eq('stato_abbonamento', 'Attivo')
      .order('nome')
      .then(({ data, error }) => {
        if (!attivo) return;
        if (error) {
          setErrore('Impossibile caricare i profili. Riprova più tardi.');
        } else {
          setProfili(data ?? []);
        }
        setCaricamento(false);
      });
    return () => {
      attivo = false;
    };
  }, []);

  return { profili, caricamento, errore };
}
