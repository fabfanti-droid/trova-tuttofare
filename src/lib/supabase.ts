import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type ProfiloTuttofare = {
  id: string;
  email: string | null;
  nome: string | null;
  citta: string | null;
  servizi: string | null;
  descrizione: string | null;
  foto_url: string | null;
  stato: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RichiestaContatto = {
  id: string;
  tuttofare_id: string | null;
  nome_tuttofare: string | null;
  email_tuttofare: string | null;
  nome_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  messaggio: string;
  created_at: string;
  risposta_inviata?: boolean;
  token_recensione?: string | null;
};

export type Recensione = {
  id: string;
  richiesta_id: string | null;
  tuttofare_id: string | null;
  nome_cliente: string;
  email_cliente: string;
  voto: number;
  testo: string | null;
  created_at: string;
};

const FOTO_BUCKET = 'foto-tuttofare';

export async function uploadFotoProfilo(
  userId: string,
  file: Blob,
  ext = 'jpg',
  contentType = 'image/jpeg'
): Promise<{ url: string | null; error: string | null }> {
  const path = `${userId}/foto.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(FOTO_BUCKET)
    .upload(path, file, { upsert: true, contentType });
  if (upErr) {
    return { url: null, error: upErr.message };
  }

  const { data } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
