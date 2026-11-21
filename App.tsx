import { useEffect, useState } from "react";
import { Hammer, MapPin, LogOut, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { HomePage } from "@/components/HomePage";
import { RegioniPage } from "@/components/RegioniPage";
import { LoginPage } from "@/components/LoginPage";
import { ProfilePage } from "@/components/ProfilePage";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ContactModal } from "@/components/ContactModal";
import { ReviewPage } from "@/components/ReviewPage";
import { DetailPage } from "@/components/DetailPage";
import type { ProfiloTuttofare } from "@/lib/supabase";

type Page = "home" | "regioni" | "login" | "profilo" | "admin" | "recensione" | "dettaglio";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [session, setSession] = useState<{ userId: string; email: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [contatto, setContatto] = useState<ProfiloTuttofare | null>(null);
  const [dettaglio, setDettaglio] = useState<ProfiloTuttofare | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [reviewToken, setReviewToken] = useState<string | null>(null);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#recensione=(.+)$/);
      if (match) {
        setReviewToken(match[1]);
        setPage("recensione");
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  useEffect(() => {
    // Se c'è un token recensione nell'hash, salta del tutto il check session
    const hash = window.location.hash;
    if (hash.match(/^#recensione=(.+)$/)) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession({
          userId: data.session.user.id,
          email: data.session.user.email ?? "",
        });
        setPage("profilo");
      }
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        setSession({
          userId: s.user.id,
          email: s.user.email ?? "",
        });
      } else {
        setSession(null);
        setIsAdmin(false);
        setPage("home");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Controlla se l'utente autenticato è admin
  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (!cancelled) {
        if (!error && data === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setAdminChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setPage("home");
  };

  const navItems: { label: string; page: Page }[] = [
    { label: "Profili per Regione", page: "regioni" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPage("home")}
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 shadow-md shadow-teal-700/25">
                <Hammer className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Trova<span className="text-teal-700">Tuttofare</span>
              </span>
            </button>
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setPage(item.page)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    page === item.page
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://fabfanti.systeme.io/03cb2609"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:block"
            >
              Diventa un Tuttofare
            </a>
            {session && isAdmin && (
              <button
                onClick={() => setPage("admin")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  page === "admin"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                }`}
              >
                <ShieldAlert className="h-4 w-4" /> Admin
              </button>
            )}
            {session ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
              >
                <LogOut className="h-4 w-4" /> Esci
              </button>
            ) : (
              <button
                onClick={() => setPage("login")}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
              >
                Area Tuttofare
              </button>
            )}
          </div>
        </div>
        {/* Nav mobile */}
        <nav className="flex items-center gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                page === item.page
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {page === "recensione" && reviewToken ? (
          <ReviewPage token={reviewToken} />
        ) : checkingSession ? (
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : page === "home" ? (
          <HomePage onContact={setContatto} onApriDettaglio={(p) => { setDettaglio(p); setPage("dettaglio"); }} />
        ) : page === "regioni" ? (
          <RegioniPage onContact={setContatto} onApriDettaglio={(p) => { setDettaglio(p); setPage("dettaglio"); }} />
        ) : page === "dettaglio" && dettaglio ? (
          <DetailPage profilo={dettaglio} onBack={() => { setDettaglio(null); setPage("home"); }} />
        ) : page === "login" ? (
          <LoginPage onSuccess={() => setPage("profilo")} />
        ) : page === "admin" ? (
          session && isAdmin ? (
            <AdminDashboard onVaiProfilo={() => setPage("profilo")} />
          ) : (
            <LoginPage onSuccess={() => setPage("profilo")} />
          )
        ) : session ? (
          <ProfilePage session={session} onLogout={logout} />
        ) : (
          <LoginPage onSuccess={() => setPage("profilo")} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} TrovaTuttofare. Tutti i diritti riservati.</p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-teal-700" /> Il tuo tuttofare a portata di click in tutta Italia
          </p>
        </div>
      </footer>

      {contatto && <ContactModal profilo={contatto} onClose={() => setContatto(null)} />}
    </div>
  );
}
