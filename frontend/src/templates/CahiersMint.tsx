import type { CSSProperties } from "react";
import type { DocumentModel, Template } from "../types";
import Selectable from "./Selectable";
import { asString, asStringList, mergeStyles } from "./common";

export default function CahiersMint(props: {
  doc: DocumentModel;
  template: Template;
  selectedKey?: string | null;
  onSelectKey?: (key: string) => void;
}) {
  const { doc, template } = props;
  const theme = { ...template.colors, ...(doc.theme || {}) };

  const base: Record<string, CSSProperties> = {
    title: { fontFamily: "ui-sans-serif", fontSize: 24, fontWeight: 900 },
    author: { fontFamily: "ui-sans-serif", fontSize: 13, fontWeight: 600 },
    characters: { fontFamily: "ui-sans-serif", fontSize: 12 },
    summary: { fontFamily: "ui-sans-serif", fontSize: 12 },
    structure: { fontFamily: "ui-sans-serif", fontSize: 12 },
    takeaways: { fontFamily: "ui-sans-serif", fontSize: 12 }
  };

  const styleFor = (key: string) =>
    mergeStyles(base[key] as any, (doc.styles || {})[key]);

  return (
    <div
      className="rounded-2xl border border-white/10 p-6"
      style={{ background: theme.background, color: theme.text }}
    >
      <div className="mb-5 rounded-xl p-4" style={{ background: `${theme.primary}12` }}>
        <div
          className="mb-1"
          style={styleFor("title")}
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

      <div className="grid gap-4 md:grid-cols-2">
        <Selectable
          selected={props.selectedKey === "characters"}
          onSelect={() => props.onSelectKey?.("characters")}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Personnages
          </div>
          <ul className="list-disc pl-5" style={styleFor("characters")}>
            {asStringList(doc.data.characters).length ? (
              asStringList(doc.data.characters).map((c, i) => (
                <li key={`${i}-${c}`} className="mb-1">
                  {c}
                </li>
              ))
            ) : (
              <li className="opacity-70">…</li>
            )}
          </ul>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "takeaways"}
          onSelect={() => props.onSelectKey?.("takeaways")}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Idées clés
          </div>
          <ul className="list-disc pl-5" style={styleFor("takeaways")}>
            {asStringList(doc.data.takeaways).length ? (
              asStringList(doc.data.takeaways).map((c, i) => (
                <li key={`${i}-${c}`} className="mb-1">
                  {c}
                </li>
              ))
            ) : (
              <li className="opacity-70">…</li>
            )}
          </ul>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "summary"}
          onSelect={() => props.onSelectKey?.("summary")}
          className="md:col-span-2"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Résumé
          </div>
          <div className="whitespace-pre-wrap" style={styleFor("summary")}>
            {asString(doc.data.summary) || "…"}
          </div>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "structure"}
          onSelect={() => props.onSelectKey?.("structure")}
          className="md:col-span-2"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            Structure
          </div>
          <div className="whitespace-pre-wrap" style={styleFor("structure")}>
            {asString(doc.data.structure) || "…"}
          </div>
        </Selectable>
      </div>
    </div>
  );
}

