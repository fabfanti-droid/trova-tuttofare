export interface ProfiloTuttofare {
  id: string;
  user_id: string | null;
  nome: string;
  email: string | null;
  telefono: string | null;
  citta: string | null;
  descrizione: string | null;
  categorie: string[];
  stato_abbonamento: string;
  created_at: string;
  updated_at: string;
}
