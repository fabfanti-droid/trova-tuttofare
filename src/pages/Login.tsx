import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hammer, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [modalita, setModalita] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [messaggioOk, setMessaggioOk] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrore(null);
    setMessaggioOk(null);
    setInvio(true);
    try {
      if (modalita === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessaggioOk('Account creato. Ora puoi accedere con le tue credenziali.');
        setModalita('login');
      }
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Si è verificato un errore. Riprova.');
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 text-white">
            <Hammer className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {modalita === 'login' ? 'Accedi' : 'Crea un account'}
          </h1>
          <p className="text-sm text-stone-500">
            {modalita === 'login'
              ? 'Gestisci il tuo profilo di tuttofare.'
              : 'Registrati per creare il tuo profilo.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                placeholder="tu@email.it"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                placeholder="Almeno 6 caratteri"
              />
            </div>
          </div>

          {errore && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{errore}</span>
            </div>
          )}
          {messaggioOk && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{messaggioOk}</div>
          )}

          <button
            type="submit"
            disabled={invio}
            className="w-full rounded-lg bg-amber-600 py-2.5 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {invio ? 'Attendere…' : modalita === 'login' ? 'Accedi' : 'Registrati'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          {modalita === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setModalita(modalita === 'login' ? 'signup' : 'login');
              setErrore(null);
              setMessaggioOk(null);
            }}
            className="font-semibold text-amber-700 hover:text-amber-800 hover:underline"
          >
            {modalita === 'login' ? 'Registrati' : 'Accedi'}
          </button>
        </p>

        <p className="mt-6 text-center text-sm text-stone-500">
          Oppure{' '}
          <Link to="/" className="font-medium text-amber-700 hover:underline">
            torna alla home
          </Link>
        </p>
      </div>
    </div>
  );
}
