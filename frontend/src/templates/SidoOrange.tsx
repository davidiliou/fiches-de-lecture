import type { CSSProperties } from "react";
import type { DocumentModel, Template } from "../types";
import Selectable from "./Selectable";
import { asString, asStringList, mergeStyles } from "./common";

export default function SidoOrange(props: {
  doc: DocumentModel;
  template: Template;
  selectedKey?: string | null;
  onSelectKey?: (key: string) => void;
}) {
  const { doc, template } = props;
  const theme = { ...template.colors, ...(doc.theme || {}) };

  const base: Record<string, CSSProperties> = {
    title: { fontFamily: "ui-serif", fontSize: 22, fontWeight: 800 },
    author: { fontFamily: "ui-sans-serif", fontSize: 13, fontWeight: 600 },
    context: { fontFamily: "ui-sans-serif", fontSize: 12 },
    themes: { fontFamily: "ui-sans-serif", fontSize: 12 },
    quotes: { fontFamily: "ui-serif", fontSize: 12 },
    opinion: { fontFamily: "ui-sans-serif", fontSize: 12 }
  };

  const styleFor = (key: string) =>
    mergeStyles(base[key] as any, (doc.styles || {})[key]);

  return (
    <div
      className="rounded-2xl border border-white/10 p-6"
      style={{ background: theme.background, color: theme.text }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="mb-1"
            style={{
              ...(styleFor("title") as any),
              color: theme.text
            }}
            onClick={() => props.onSelectKey?.("title")}
          >
            {asString(doc.data.title) || "Titre"}
          </div>
          <div
            className="opacity-80"
            style={styleFor("author")}
            onClick={() => props.onSelectKey?.("author")}
          >
            {asString(doc.data.author) || "Auteur"}
          </div>
        </div>
        <div
          className="h-10 w-10 shrink-0 rounded-xl"
          style={{ background: theme.primary }}
          title="Couleur primaire"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Selectable
          selected={props.selectedKey === "context"}
          onSelect={() => props.onSelectKey?.("context")}
          className="md:col-span-2"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Contexte / Résumé
          </div>
          <div className="whitespace-pre-wrap" style={styleFor("context")}>
            {asString(doc.data.context) || "…"}
          </div>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "themes"}
          onSelect={() => props.onSelectKey?.("themes")}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Thèmes
          </div>
          <div className="flex flex-wrap gap-2" style={styleFor("themes")}>
            {asStringList(doc.data.themes).length ? (
              asStringList(doc.data.themes).map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2 py-1 text-xs"
                  style={{ background: `${theme.primary}22`, color: theme.text }}
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="opacity-70">…</span>
            )}
          </div>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "quotes"}
          onSelect={() => props.onSelectKey?.("quotes")}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Citations
          </div>
          <ul className="list-disc pl-5" style={styleFor("quotes")}>
            {asStringList(doc.data.quotes).length ? (
              asStringList(doc.data.quotes).map((q, idx) => (
                <li key={`${idx}-${q}`} className="mb-1">
                  {q}
                </li>
              ))
            ) : (
              <li className="opacity-70">…</li>
            )}
          </ul>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "opinion"}
          onSelect={() => props.onSelectKey?.("opinion")}
          className="md:col-span-2"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Avis personnel
          </div>
          <div className="whitespace-pre-wrap" style={styleFor("opinion")}>
            {asString(doc.data.opinion) || "…"}
          </div>
        </Selectable>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs opacity-70">
        <span>Template: {template.name}</span>
        <span
          className="rounded-full px-2 py-1"
          style={{ background: `${theme.accent}22` }}
        >
          accent
        </span>
      </div>
    </div>
  );
}

