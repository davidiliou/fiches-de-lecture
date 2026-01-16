import type { CSSProperties } from "react";
import type { FieldStyle } from "../types";

export function mergeStyles(
  base: FieldStyle | CSSProperties | undefined,
  override: FieldStyle | undefined
): CSSProperties {
  const s = { ...(base || {}), ...(override || {}) };
  const css: CSSProperties = {};
  if (s.fontFamily) css.fontFamily = s.fontFamily;
  if (typeof s.fontSize === "number") css.fontSize = `${s.fontSize}px`;
  if (typeof s.fontWeight === "number") css.fontWeight = s.fontWeight;
  if (s.textColor) css.color = s.textColor;
  return css;
}

export function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

export function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    // Compat: anciennes fiches où une "liste" était stockée comme ["a, b, c"]
    // => on re-split chaque entrée.
    const out: string[] = [];
    for (const x of v) {
      const s = asString(x);
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
  return [];
}

