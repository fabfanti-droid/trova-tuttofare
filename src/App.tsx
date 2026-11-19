import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProfiliPerRegione from './pages/ProfiliPerRegione';
import DettaglioTuttofare from './pages/DettaglioTuttofare';
import ProfiloUtente from './pages/ProfiloUtente';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profili-per-regione" element={<ProfiliPerRegione />} />
              <Route path="/tuttofare/:id" element={<DettaglioTuttofare />} />
              <Route path="/il-mio-profilo" element={<ProfiloUtente />} />
              <Route path="/accedi" element={<Login />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <footer className="border-t border-stone-200 bg-white py-6 text-center text-sm text-stone-500">
            Tuttofare Italia — trova il professionista giusto vicino a te.
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
