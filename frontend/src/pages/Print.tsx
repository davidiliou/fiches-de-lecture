import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocument, getTemplate } from "../api";
import Renderer from "../templates/Renderer";
import type { DocumentModel, Template } from "../types";

export default function Print() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentModel | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) return;
      try {
        const d = await getDocument(id);
        const t = await getTemplate(d.templateId);
        if (cancelled) return;
        setDoc(d);
        setTemplate(t);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || String(e));
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return <div className="text-sm">ID manquant.</div>;

  return (
    <div className="space-y-4">
      <style>
        {`
          @page { size: A4; margin: 12mm; }
          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-400">Impression</div>
          <div className="truncate text-lg font-semibold">{doc?.title || "…"}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            to={`/edit/${id}`}
          >
            Retour éditeur
          </Link>
          <button
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
            onClick={() => window.print()}
          >
            Imprimer / Export PDF
          </button>
        </div>
      </div>

      {error ? (
        <div className="no-print rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!doc || !template ? (
        <div className="no-print text-sm text-slate-300">Chargement…</div>
      ) : (
        <div className="mx-auto w-[210mm] max-w-full bg-white p-0 text-black shadow-2xl shadow-black/40 print:shadow-none">
          <div className="p-[12mm]">
            <Renderer doc={doc} template={template} />
          </div>
        </div>
      )}
    </div>
  );
}

