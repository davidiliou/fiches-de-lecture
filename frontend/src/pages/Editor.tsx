import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createDocument, getDocument, getTemplate, saveDocument } from "../api";
import Renderer from "../templates/Renderer";
import type { DocumentModel, FieldStyle, Template, TemplateField } from "../types";

function fieldDefaultStyle(template: Template, key: string): FieldStyle {
  const f = template.fields.find((x) => x.key === key);
  return (f?.defaultStyle || {}) as FieldStyle;
}

function parseMultiValue(raw: string, opts?: { keepTrailingEmpty?: boolean }): string[] {
  // Autorise: séparateurs multi (retour ligne, virgule, point-virgule).
  // Important (UX): en champ contrôlé, si l'utilisateur tape juste un séparateur
  // (ex: Entrée pour passer à la ligne suivante), il faut préserver un item vide
  // pour que le séparateur ne "disparaisse" pas au rerender.
  const keepTrailingEmpty = Boolean(opts?.keepTrailingEmpty);
  const endsWithSeparator = /[\r\n,;]\s*$/.test(raw);

  const parts = raw.split(/[\r\n,;]+/).map((s) => s.trim());
  const out = parts.filter(Boolean);
  if (keepTrailingEmpty && endsWithSeparator) out.push("");
  return out;
}

function normalizeMultiValue(v: unknown): string[] | undefined {
  // Nettoyage pour la persistance: pas de valeurs vides dans les listes/tags.
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const x of v) {
      const s = typeof x === "string" ? x : x == null ? "" : String(x);
      for (const part of s.split(/[\r\n,;]+/)) {
        const t = part.trim();
        if (t) out.push(t);
      }
    }
    return out;
  }
  if (typeof v === "string") {
    return v
      .split(/[\r\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

function coerceFieldValue(field: TemplateField, raw: string): unknown {
  switch (field.type) {
    case "list":
      return parseMultiValue(raw, { keepTrailingEmpty: true });
    case "tags":
      return parseMultiValue(raw, { keepTrailingEmpty: true });
    default:
      return raw;
  }
}

function fieldToString(field: TemplateField, value: unknown): string {
  if (field.type === "list" && Array.isArray(value)) return value.join("\n");
  if (field.type === "tags" && Array.isArray(value)) return value.join(", ");
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

const FONT_CHOICES = [
  { label: "Sans (system)", value: "ui-sans-serif" },
  { label: "Serif", value: "ui-serif" },
  { label: "Mono", value: "ui-monospace" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times", value: "\"Times New Roman\"" }
];

type ThemeColors = { primary: string; accent: string; background: string; text: string };

type PalettePreset = { name: string; colors: [string, string, string, string, string] };

const PALETTE_PRESETS: PalettePreset[] = [
  { name: "Neutres & ocre", colors: ["#E5E7EB", "#F5F5F4", "#D6A537", "#B7791F", "#7C2D12"] },
  { name: "Prune & vert doux", colors: ["#1F102A", "#B3002D", "#E6F0C2", "#7AAE52", "#8C4A4A"] },
  { name: "Rose & menthe", colors: ["#C73C6E", "#E56F95", "#F2B7C7", "#B7E6E6", "#49A3A3"] },
  { name: "Corail & cyan", colors: ["#3B0A0A", "#D36A4A", "#FFC36E", "#00C2D1", "#003A46"] },
  { name: "Poudre & marine", colors: ["#CF6B6B", "#F3B0A8", "#CFE0CF", "#4B8C96", "#1F2D5A"] },
  { name: "Pastel (bleu/rose)", colors: ["#F9F3C6", "#BFE3FF", "#F7C7D9", "#4F80BF", "#9FD3F2"] },
  { name: "Saumon & lagon", colors: ["#FF9C93", "#F57A3A", "#204A52", "#79D6D1", "#1CC9C8"] },
  { name: "Terre & sable", colors: ["#6A6258", "#EAD494", "#556B4D", "#C58A44", "#F4BE86"] },
  { name: "Or & bleu", colors: ["#E3A81C", "#2E78C7", "#2F3B49", "#D8D3E0", "#A9936A"] },
  { name: "Sapin & caramel", colors: ["#0F4B46", "#1F6E67", "#F2F7F5", "#FFE8A3", "#D19A5B"] }
];

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim();
  const m = /^#([0-9a-fA-F]{6})$/.exec(h);
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luma(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  // Luma approximative 0..1 (suffisant pour trier clair/foncé)
  const y = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return clamp01(y);
}

function themeFromPalette(p: PalettePreset): ThemeColors {
  const withLum = p.colors
    .map((c) => ({ c, y: luma(c) }))
    .map((x, idx) => ({ ...x, idx }))
    .filter((x) => typeof x.y === "number") as Array<{ c: string; y: number; idx: number }>;

  // Fallback si parsing impossible
  if (withLum.length < 5) {
    return { background: p.colors[1], text: p.colors[4], primary: p.colors[2], accent: p.colors[3] };
  }

  withLum.sort((a, b) => a.y - b.y); // du plus sombre au plus clair
  const text = withLum[0].c;
  const background = withLum.at(-1)?.c ?? p.colors[1];

  const remaining = withLum.slice(1, -1);
  // Choix simple: 2 couleurs du milieu pour primary/accent
  remaining.sort((a, b) => a.y - b.y);
  const midA = remaining[Math.floor((remaining.length - 1) / 2)]?.c ?? p.colors[2];
  const midB = remaining[Math.ceil((remaining.length - 1) / 2)]?.c ?? p.colors[3];

  return { background, text, primary: midA, accent: midB };
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentModel | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) return;
      try {
        setError(null);
        setStatus("Chargement…");
        const d = await getDocument(id);
        const t = await getTemplate(d.templateId);
        if (cancelled) return;
        setDoc(d);
        setTemplate(t);
        setSelectedKey(t.fields[0]?.key ?? null);
        setStatus(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || String(e));
        setStatus(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectedField = useMemo(() => {
    if (!template || !selectedKey) return null;
    return template.fields.find((f) => f.key === selectedKey) ?? null;
  }, [template, selectedKey]);

  async function onSave() {
    if (!id || !doc) return;
    try {
      setStatus("Sauvegarde…");
      const sanitizedData: Record<string, unknown> = { ...doc.data };
      if (template) {
        for (const f of template.fields) {
          if (f.type !== "list" && f.type !== "tags") continue;
          const normalized = normalizeMultiValue(sanitizedData[f.key]);
          if (normalized) sanitizedData[f.key] = normalized;
        }
      }
      await saveDocument(id, {
        title: doc.title,
        data: sanitizedData,
        styles: doc.styles,
        theme: doc.theme
      });
      setStatus("Sauvegardé.");
      setTimeout(() => setStatus(null), 1200);
    } catch (e: any) {
      setStatus(null);
      setError(e?.message || String(e));
    }
  }

  async function onDuplicate() {
    if (!doc) return;
    const res = await createDocument({
      title: `${doc.title} (copie)`,
      templateId: doc.templateId,
      data: doc.data,
      styles: doc.styles,
      theme: doc.theme
    });
    navigate(`/edit/${res.id}`);
  }

  if (!id) return <div className="text-sm text-slate-300">ID manquant.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-400">Éditeur</div>
          <div className="truncate text-lg font-semibold">
            {doc?.title || "…"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            href={`/api/documents/${id}`}
            target="_blank"
            rel="noreferrer"
          >
            JSON
          </a>
          <Link
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            to={`/print/${id}`}
            target="_blank"
          >
            Export PDF
          </Link>
          <button
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            onClick={onDuplicate}
            disabled={!doc}
          >
            Dupliquer
          </button>
          <button
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
            onClick={onSave}
            disabled={!doc}
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {status ? (
        <div className="text-xs text-slate-300">{status}</div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!doc || !template ? (
        <div className="text-sm text-slate-300">Chargement…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Formulaire */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-semibold">Meta</div>
              <label className="block">
                <div className="mb-1 text-xs text-slate-300">Titre (liste)</div>
                <input
                  className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-white/30"
                  value={doc.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setDoc((prev) =>
                      prev
                        ? {
                            ...prev,
                            title,
                            data: {
                              ...prev.data,
                              ...(Object.prototype.hasOwnProperty.call(prev.data, "title")
                                ? { title }
                                : {})
                            }
                          }
                        : prev
                    );
                  }}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Formulaire</div>
                <div className="text-xs text-slate-400">{template.name}</div>
              </div>

              <div className="space-y-3">
                {template.fields.map((field) => {
                  const value = doc.data[field.key];
                  const raw = fieldToString(field, value);
                  const isSelected = selectedKey === field.key;

                  return (
                    <div
                      key={field.key}
                      className={[
                        "rounded-xl border p-3",
                        isSelected
                          ? "border-white/30 bg-white/5"
                          : "border-white/10 bg-slate-950/20"
                      ].join(" ")}
                      onClick={() => setSelectedKey(field.key)}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">{field.label}</div>
                        <div className="text-xs text-slate-500">{field.type}</div>
                      </div>
                      {field.helpText ? (
                        <div className="mb-2 text-xs text-slate-400">
                          {field.helpText}
                        </div>
                      ) : null}

                      {field.type === "text" || field.type === "tags" ? (
                        <input
                          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-white/30"
                          placeholder={field.placeholder}
                          value={raw}
                          onChange={(e) => {
                            const v = coerceFieldValue(field, e.target.value);
                            setDoc((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    data: { ...prev.data, [field.key]: v }
                                  }
                                : prev
                            );
                          }}
                        />
                      ) : (
                        <textarea
                          className="min-h-24 w-full resize-y rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-white/30"
                          placeholder={field.placeholder}
                          value={raw}
                          onChange={(e) => {
                            const v = coerceFieldValue(field, e.target.value);
                            setDoc((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    data: { ...prev.data, [field.key]: v }
                                  }
                                : prev
                            );
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-semibold">Styles</div>

              {selectedField && selectedKey ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Zone sélectionnée:{" "}
                    <span className="font-mono text-slate-200">{selectedKey}</span>
                  </div>

                  <label className="block">
                    <div className="mb-1 text-xs text-slate-300">Police</div>
                    <select
                      className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-white/30"
                      value={
                        doc.styles?.[selectedKey]?.fontFamily ||
                        fieldDefaultStyle(template, selectedKey).fontFamily ||
                        "ui-sans-serif"
                      }
                      onChange={(e) => {
                        const fontFamily = e.target.value;
                        setDoc((prev) =>
                          prev
                            ? {
                                ...prev,
                                styles: {
                                  ...(prev.styles || {}),
                                  [selectedKey]: {
                                    ...(prev.styles?.[selectedKey] || {}),
                                    fontFamily
                                  }
                                }
                              }
                            : prev
                        );
                      }}
                    >
                      {FONT_CHOICES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <div className="mb-1 text-xs text-slate-300">Taille</div>
                      <input
                        type="number"
                        min={8}
                        max={48}
                        className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-white/30"
                        value={
                          doc.styles?.[selectedKey]?.fontSize ??
                          fieldDefaultStyle(template, selectedKey).fontSize ??
                          12
                        }
                        onChange={(e) => {
                          const fontSize = Number(e.target.value);
                          setDoc((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  styles: {
                                    ...(prev.styles || {}),
                                    [selectedKey]: {
                                      ...(prev.styles?.[selectedKey] || {}),
                                      fontSize
                                    }
                                  }
                                }
                              : prev
                          );
                        }}
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 text-xs text-slate-300">Couleur</div>
                      <input
                        type="color"
                        className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1"
                        value={doc.styles?.[selectedKey]?.textColor || "#111827"}
                        onChange={(e) => {
                          const textColor = e.target.value;
                          setDoc((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  styles: {
                                    ...(prev.styles || {}),
                                    [selectedKey]: {
                                      ...(prev.styles?.[selectedKey] || {}),
                                      textColor
                                    }
                                  }
                                }
                              : prev
                          );
                        }}
                      />
                    </label>
                  </div>

                  <button
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                    onClick={() => {
                      setDoc((prev) => {
                        if (!prev) return prev;
                        const next = { ...(prev.styles || {}) };
                        delete next[selectedKey];
                        return { ...prev, styles: next };
                      });
                    }}
                  >
                    Réinitialiser cette zone
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-300">
                  Clique une zone dans l’aperçu (ou un champ) pour régler la police.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-semibold">Couleurs du template</div>
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">Préréglages</div>
                  <button
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                    onClick={() => {
                      setDoc((prev) =>
                        prev
                          ? {
                              ...prev,
                              theme: { ...template.colors }
                            }
                          : prev
                      );
                    }}
                    type="button"
                  >
                    Réinitialiser
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className="shrink-0 rounded-xl border border-white/10 bg-slate-950/20 px-3 py-2 text-left hover:bg-white/5"
                      onClick={() => {
                        const nextTheme = themeFromPalette(p);
                        setDoc((prev) =>
                          prev
                            ? {
                                ...prev,
                                theme: { ...(prev.theme || {}), ...nextTheme }
                              }
                            : prev
                        );
                      }}
                      title={`${p.name} — ${p.colors.join(" ")}`}
                    >
                      <div className="mb-1 flex gap-1">
                        {p.colors.map((c) => (
                          <span
                            key={c}
                            className="h-4 w-5 rounded border border-white/10"
                            style={{ background: c }}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <div className="max-w-[160px] truncate text-xs text-slate-200">
                        {p.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["primary", "accent", "background", "text"] as const).map((k) => (
                  <label key={k} className="block">
                    <div className="mb-1 text-xs text-slate-300">{k}</div>
                    <input
                      type="color"
                      className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1"
                      value={(doc.theme?.[k] as string) || template.colors[k]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDoc((prev) =>
                          prev
                            ? {
                                ...prev,
                                theme: { ...(prev.theme || {}), [k]: v }
                              }
                            : prev
                        );
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Aperçu</div>
            <Renderer
              doc={doc}
              template={template}
              selectedKey={selectedKey}
              onSelectKey={(k) => setSelectedKey(k)}
            />
            <div className="text-xs text-slate-400">
              Astuce: l’aperçu est cliquable pour sélectionner une zone.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

