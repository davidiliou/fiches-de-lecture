import type { CSSProperties } from "react";
import type { DocumentModel, Template } from "../types";
import Selectable from "./Selectable";
import { asString, asStringList, mergeStyles } from "./common";

function hexWithAlpha(hex: string, alphaHex: string) {
  // "#RRGGBB" + "22" => "#RRGGBB22"
  if (typeof hex !== "string") return hex;
  const h = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return `${h}${alphaHex}`;
  return hex;
}

export default function SidoVrilles(
  props: Readonly<{
    doc: DocumentModel;
    template: Template;
    selectedKey?: string | null;
    onSelectKey?: (key: string) => void;
  }>
) {
  const { doc, template } = props;
  const theme = { ...template.colors, ...doc.theme };

  const base: Record<string, CSSProperties> = {
    title: { fontFamily: "ui-serif", fontSize: 28, fontWeight: 900 },
    subtitle: { fontFamily: "ui-sans-serif", fontSize: 12, fontWeight: 800 },
    keywords: { fontFamily: "ui-sans-serif", fontSize: 10 },
    writingContext: { fontFamily: "ui-sans-serif", fontSize: 12 },
    themes: { fontFamily: "ui-sans-serif", fontSize: 11, fontWeight: 800 },
    structure: { fontFamily: "ui-sans-serif", fontSize: 12 },
    linkToCourse: { fontFamily: "ui-sans-serif", fontSize: 12 },
    definitions: { fontFamily: "ui-sans-serif", fontSize: 12 },
    author: { fontFamily: "ui-sans-serif", fontSize: 14, fontWeight: 900 },
    authorFacts: { fontFamily: "ui-sans-serif", fontSize: 11, fontWeight: 800 },
    toRead: { fontFamily: "ui-sans-serif", fontSize: 12 }
  };

  const styleFor = (key: string) => mergeStyles(base[key] as any, doc.styles[key]);

  return (
    <div
      className="rounded-2xl border border-white/10 p-6"
      style={{ background: theme.background, color: theme.text }}
    >
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Selectable
            selected={props.selectedKey === "title"}
            onSelect={() => props.onSelectKey?.("title")}
            className="border-0 bg-transparent p-0"
          >
            <div
              className="inline-block rounded-2xl px-4 py-2"
              style={{ background: hexWithAlpha(theme.primary, "E6") }}
            >
              <div className="leading-tight" style={styleFor("title")}>
                {asString(doc.data.title) || "Titre"}
              </div>
            </div>
          </Selectable>

          <Selectable
            selected={props.selectedKey === "subtitle"}
            onSelect={() => props.onSelectKey?.("subtitle")}
            className="mt-2 border-0 bg-transparent p-0"
          >
            <div className="uppercase tracking-wide opacity-90" style={styleFor("subtitle")}>
              {asString(doc.data.subtitle) || "Sous-titre"}
            </div>
          </Selectable>
        </div>

        <Selectable
          selected={props.selectedKey === "keywords"}
          onSelect={() => props.onSelectKey?.("keywords")}
          className="border-0 bg-transparent p-0"
        >
          <div className="max-w-[320px] text-right" style={styleFor("keywords")}>
            {asStringList(doc.data.keywords).length ? (
              <div className="flex flex-wrap justify-end gap-x-2 gap-y-1 opacity-80">
                {asStringList(doc.data.keywords).map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </div>
            ) : (
              <div className="opacity-60">mots-clés…</div>
            )}
          </div>
        </Selectable>
      </div>

      {/* Contexte d'écriture */}
      <div className="mt-5">
        <Selectable
          selected={props.selectedKey === "writingContext"}
          onSelect={() => props.onSelectKey?.("writingContext")}
          className="p-0"
        >
          <div
            className="rounded-xl px-5 py-4"
            style={{
              background: hexWithAlpha(theme.primary, "D9"),
              color: theme.text
            }}
          >
            <div className="mb-2 text-center text-sm font-extrabold uppercase tracking-widest">
              Contexte d’écriture
            </div>
            <div className="whitespace-pre-wrap" style={styleFor("writingContext")}>
              {asString(doc.data.writingContext) || "…"}
            </div>
          </div>
        </Selectable>
      </div>

      {/* Milieu: thèmes + structure */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Selectable
          selected={props.selectedKey === "themes"}
          onSelect={() => props.onSelectKey?.("themes")}
        >
          <div className="mb-2 text-center text-sm font-extrabold uppercase tracking-widest">
            Thèmes
          </div>
          <div className="flex flex-col items-center gap-2">
            {asStringList(doc.data.themes).length ? (
              asStringList(doc.data.themes).map((t) => (
                <span
                  key={t}
                  className="inline-flex rounded-lg px-3 py-1 text-xs uppercase tracking-wide"
                  style={{
                    background: hexWithAlpha(theme.primary, "E6"),
                    color: theme.text,
                    ...(styleFor("themes") as any)
                  }}
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="opacity-60">…</span>
            )}
          </div>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "structure"}
          onSelect={() => props.onSelectKey?.("structure")}
        >
          <div className="mb-2 text-center text-sm font-extrabold uppercase tracking-widest">
            Structure
          </div>
          <div
            className="rounded-xl border-2 p-4"
            style={{
              borderColor: hexWithAlpha(theme.primary, "99"),
              background: hexWithAlpha(theme.background, "F2")
            }}
          >
            {asString(doc.data.structure) ? (
              <ul className="list-disc space-y-1 pl-5" style={styleFor("structure")}>
                {asString(doc.data.structure)
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((line, idx) => (
                    <li key={`${idx}-${line}`}>{line}</li>
                  ))}
              </ul>
            ) : (
              <div className="opacity-60">…</div>
            )}
          </div>
        </Selectable>
      </div>

      {/* Lien avec le parcours */}
      <div className="mt-5">
        <Selectable
          selected={props.selectedKey === "linkToCourse"}
          onSelect={() => props.onSelectKey?.("linkToCourse")}
          className="p-4"
        >
          <div className="mb-2 text-center text-sm font-extrabold uppercase tracking-widest">
            Lien avec le parcours
          </div>
          <div
            className="rounded-xl border-2 border-dotted p-4"
            style={{ borderColor: hexWithAlpha(theme.primary, "99") }}
          >
            <div className="whitespace-pre-wrap" style={styleFor("linkToCourse")}>
              {asString(doc.data.linkToCourse) || "…"}
            </div>
          </div>
        </Selectable>
      </div>

      {/* Définition */}
      <div className="mt-5">
        <Selectable
          selected={props.selectedKey === "definitions"}
          onSelect={() => props.onSelectKey?.("definitions")}
          className="p-0"
        >
          <div
            className="rounded-xl px-5 py-4"
            style={{
              background: hexWithAlpha(theme.primary, "D9"),
              color: theme.text
            }}
          >
            <div className="mb-2 text-center text-sm font-extrabold uppercase tracking-widest">
              Définition des termes
            </div>
            <div className="whitespace-pre-wrap" style={styleFor("definitions")}>
              {asString(doc.data.definitions) || "…"}
            </div>
          </div>
        </Selectable>
      </div>

      {/* Bas: auteur + à lire */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Selectable
          selected={props.selectedKey === "author" || props.selectedKey === "authorFacts"}
          onSelect={() => props.onSelectKey?.("author")}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div
              className="rounded-2xl px-4 py-2 text-sm font-extrabold uppercase tracking-widest"
              style={{ background: hexWithAlpha(theme.primary, "E6") }}
            >
              Auteur
            </div>
            <div className="text-xs opacity-70">Portrait (optionnel)</div>
          </div>

          <div className="flex items-start gap-4">
            <div
              className="h-24 w-24 shrink-0 rounded-2xl border"
              style={{ borderColor: hexWithAlpha(theme.primary, "66"), background: "#11182710" }}
              title="Zone image (non gérée)"
            />
            <div className="min-w-0">
              <div className="truncate" style={styleFor("author")}>
                {asString(doc.data.author) || "Nom de l’auteur·e"}
              </div>
              <Selectable
                selected={props.selectedKey === "authorFacts"}
                onSelect={() => props.onSelectKey?.("authorFacts")}
                className="mt-2 border-0 bg-transparent p-0"
              >
                <div className="flex flex-wrap gap-2">
                  {asStringList(doc.data.authorFacts).length ? (
                    asStringList(doc.data.authorFacts).map((f) => (
                      <span
                        key={f}
                        className="rounded-lg px-3 py-1 text-xs"
                        style={{ background: "#11182712", ...(styleFor("authorFacts") as any) }}
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="opacity-60">…</span>
                  )}
                </div>
              </Selectable>
            </div>
          </div>
        </Selectable>

        <Selectable
          selected={props.selectedKey === "toRead"}
          onSelect={() => props.onSelectKey?.("toRead")}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div
              className="rounded-2xl px-4 py-2 text-sm font-extrabold uppercase tracking-widest"
              style={{ background: hexWithAlpha(theme.background, "FF") }}
            >
              À lire
            </div>
            <span
              className="h-2 w-10 rounded-full"
              style={{ background: hexWithAlpha(theme.primary, "CC") }}
              aria-hidden="true"
            />
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: hexWithAlpha(theme.primary, "D9") }}
          >
            <ul className="list-disc space-y-1 pl-5" style={styleFor("toRead")}>
              {asStringList(doc.data.toRead).length ? (
                asStringList(doc.data.toRead).map((x, i) => (
                  <li key={`${i}-${x}`}>{x}</li>
                ))
              ) : (
                <li className="opacity-60">…</li>
              )}
            </ul>
          </div>
        </Selectable>
      </div>
    </div>
  );
}

