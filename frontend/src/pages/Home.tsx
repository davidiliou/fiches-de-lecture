import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createDocument, getTemplates, listDocuments } from "../api";
import type { DocumentIndexEntry, Template } from "../types";

export default function Home() {
  const [templates, setTemplates] = useState<
    Array<Pick<Template, "id" | "name" | "description" | "colors">>
  >([]);
  const [documents, setDocuments] = useState<DocumentIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const [t, d] = await Promise.all([getTemplates(), listDocuments()]);
        if (cancelled) return;
        setTemplates(t);
        setDocuments(d);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const docsByTemplate = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of documents) map.set(d.templateId, (map.get(d.templateId) || 0) + 1);
    return map;
  }, [documents]);

  async function onCreate(templateId: string) {
    const res = await createDocument({ templateId, title: "Nouvelle fiche" });
    navigate(`/edit/${res.id}`);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-sm text-slate-300">
          Choisis un modèle, remplis le formulaire, puis exporte en PDF via la page
          “Impression”.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-300">Chargement…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{t.name}</div>
                  <div className="mt-1 text-sm text-slate-300">{t.description}</div>
                </div>
                <div className="flex gap-2">
                  <span
                    className="h-6 w-6 rounded-lg border border-white/10"
                    style={{ background: t.colors.primary }}
                    title="primary"
                  />
                  <span
                    className="h-6 w-6 rounded-lg border border-white/10"
                    style={{ background: t.colors.accent }}
                    title="accent"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {docsByTemplate.get(t.id) || 0} fiche(s)
                </div>
                <button
                  className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                  onClick={() => onCreate(t.id)}
                >
                  Utiliser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-white/10 pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Mes fiches</h2>
            <p className="mt-1 text-sm text-slate-300">Réouvre une fiche existante.</p>
          </div>
          <a
            className="text-sm text-slate-300 hover:text-white"
            href="/api/documents"
            target="_blank"
            rel="noreferrer"
          >
            Voir l’index JSON
          </a>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          {documents.length ? (
            <ul className="divide-y divide-white/10">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      template: {d.templateId} • modifié:{" "}
                      {new Date(d.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                      to={`/print/${d.id}`}
                      target="_blank"
                    >
                      Impression
                    </Link>
                    <Link
                      className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                      to={`/edit/${d.id}`}
                    >
                      Ouvrir
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-slate-300">
              Aucune fiche pour l’instant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

