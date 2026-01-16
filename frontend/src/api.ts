import type { DocumentIndexEntry, DocumentModel, Template } from "./types";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString()?.trim() || "/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

export function getTemplates() {
  return http<Array<Pick<Template, "id" | "name" | "description" | "colors">>>(
    "/templates"
  );
}

export function getTemplate(id: string) {
  return http<Template>(`/templates/${encodeURIComponent(id)}`);
}

export function listDocuments() {
  return http<DocumentIndexEntry[]>("/documents");
}

export async function createDocument(input: {
  title?: string;
  templateId: string;
  data?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  theme?: Record<string, string>;
}) {
  return http<{ id: string }>("/documents", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getDocument(id: string) {
  return http<DocumentModel>(`/documents/${encodeURIComponent(id)}`);
}

export function saveDocument(id: string, doc: Partial<DocumentModel>) {
  return http<{ ok: true }>(`/documents/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(doc)
  });
}

