import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Print from "./pages/Print";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Fiches de lecture
          </Link>
          <nav className="flex items-center gap-3 text-sm text-slate-300">
            <Link className="hover:text-white" to="/">
              Templates & fiches
            </Link>
            <a
              className="hover:text-white"
              href="/api/templates"
              target="_blank"
              rel="noreferrer"
            >
              API
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/edit/:id" element={<Editor />} />
          <Route path="/print/:id" element={<Print />} />
        </Routes>
      </main>
    </div>
  );
}
