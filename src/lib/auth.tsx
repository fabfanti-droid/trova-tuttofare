import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  caricamento: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  caricamento: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCaricamento(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nuovaSessione) => {
      setSession(nuovaSessione);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, caricamento }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
