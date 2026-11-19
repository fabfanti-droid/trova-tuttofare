import { NavLink, Link } from 'react-router-dom';
import { Hammer, LayoutGrid, Map, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-stone-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white">
            <Hammer className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Tuttofare Italia</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/profili-per-regione" className={linkClass}>
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Profili per Regione</span>
            <span className="sm:hidden">Regioni</span>
          </NavLink>
          {user && (
            <NavLink to="/il-mio-profilo" className={linkClass}>
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden md:inline">Il mio profilo</span>
            </NavLink>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Esci</span>
            </button>
          ) : (
            <NavLink to="/accedi" className={linkClass}>
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Accedi</span>
            </NavLink>
          )}
          {user && (
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white">
              <User className="h-4 w-4" />
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
