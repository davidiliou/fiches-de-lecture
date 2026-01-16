import cors from "cors";
import express, { type Request, type Response } from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type FieldType = "text" | "textarea" | "list" | "tags";

type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultStyle?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textColor?: string;
  };
};

type Template = {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  fields: TemplateField[];
};

type DocumentModel = {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
  styles: Record<string, unknown>;
  theme: Record<string, string>;
};

type DocumentIndexEntry = Pick<
  DocumentModel,
  "id" | "title" | "templateId" | "createdAt" | "updatedAt"
>;

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const PORT = Number(env("PORT", "3000"));
const DATA_DIR = env("DATA_DIR", path.join(process.cwd(), "data"));
const TEMPLATES_DIR = env("TEMPLATES_DIR", path.join(process.cwd(), "templates"));

const DOCUMENTS_DIR = path.join(DATA_DIR, "documents");
const INDEX_PATH = path.join(DATA_DIR, "index.json");

async function ensureDirs() {
  await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
  // En Docker on peut monter les templates en lecture seule.
  try {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
  } catch (e: any) {
    if (e?.code !== "EROFS" && e?.code !== "EACCES") throw e;
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === "ENOENT") return fallback;
    throw e;
  }
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${filePath}.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

async function listTemplateFiles(): Promise<string[]> {
  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => path.join(TEMPLATES_DIR, e.name));
}

async function loadTemplates(): Promise<Template[]> {
  const files = await listTemplateFiles();
  const templates: Template[] = [];
  for (const file of files) {
    const t = await readJsonFile<Template>(file, null as any);
    if (t && typeof t.id === "string") templates.push(t);
  }
  templates.sort((a, b) => a.name.localeCompare(b.name));
  return templates;
}

async function loadTemplateById(id: string): Promise<Template | null> {
  const templates = await loadTemplates();
  return templates.find((t) => t.id === id) ?? null;
}

async function loadIndex(): Promise<DocumentIndexEntry[]> {
  return readJsonFile<DocumentIndexEntry[]>(INDEX_PATH, []);
}

async function saveIndex(entries: DocumentIndexEntry[]) {
  await writeJsonAtomic(INDEX_PATH, entries);
}

function docPath(id: string) {
  return path.join(DOCUMENTS_DIR, `${id}.json`);
}

async function loadDocument(id: string): Promise<DocumentModel | null> {
  const p = docPath(id);
  const doc = await readJsonFile<DocumentModel | null>(p, null);
  return doc;
}

async function saveDocument(doc: DocumentModel): Promise<void> {
  await writeJsonAtomic(docPath(doc.id), doc);
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  try {
    return randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/templates", async (_req: Request, res: Response) => {
  const templates = await loadTemplates();
  res.json(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      colors: t.colors
    }))
  );
});

app.get("/api/templates/:id", async (req: Request, res: Response) => {
  const t = await loadTemplateById(req.params.id);
  if (!t) return res.status(404).json({ error: "Template not found" });
  res.json(t);
});

app.get("/api/documents", async (_req: Request, res: Response) => {
  const index = await loadIndex();
  index.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(index);
});

app.post("/api/documents", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Partial<DocumentModel>;
  if (!body.templateId || typeof body.templateId !== "string") {
    return res.status(400).json({ error: "templateId is required" });
  }
  const template = await loadTemplateById(body.templateId);
  if (!template) return res.status(400).json({ error: "Unknown templateId" });

  const id = newId();
  const createdAt = nowIso();
  const updatedAt = createdAt;
  const doc: DocumentModel = {
    id,
    title: typeof body.title === "string" && body.title.trim() ? body.title : "Nouvelle fiche",
    templateId: body.templateId,
    createdAt,
    updatedAt,
    data: (body.data ?? {}) as Record<string, unknown>,
    styles: (body.styles ?? {}) as Record<string, unknown>,
    theme: (body.theme ?? template.colors) as Record<string, string>
  };

  await saveDocument(doc);
  const index = await loadIndex();
  index.push({
    id: doc.id,
    title: doc.title,
    templateId: doc.templateId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  });
  await saveIndex(index);

  res.status(201).json({ id: doc.id });
});

app.get("/api/documents/:id", async (req: Request, res: Response) => {
  const doc = await loadDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

app.put("/api/documents/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const existing = await loadDocument(id);
  if (!existing) return res.status(404).json({ error: "Document not found" });

  const body = (req.body ?? {}) as Partial<DocumentModel>;
  const updated: DocumentModel = {
    ...existing,
    title: typeof body.title === "string" ? body.title : existing.title,
    data: (body.data ?? existing.data) as Record<string, unknown>,
    styles: (body.styles ?? existing.styles) as Record<string, unknown>,
    theme: (body.theme ?? existing.theme) as Record<string, string>,
    updatedAt: nowIso()
  };

  await saveDocument(updated);

  const index = await loadIndex();
  const nextIndex = index.map((e) =>
    e.id === id
      ? {
          ...e,
          title: updated.title,
          templateId: updated.templateId,
          updatedAt: updated.updatedAt
        }
      : e
  );
  await saveIndex(nextIndex);

  res.json({ ok: true });
});

async function main() {
  await ensureDirs();
  app.listen(PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://0.0.0.0:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`DATA_DIR=${DATA_DIR}`);
    // eslint-disable-next-line no-console
    console.log(`TEMPLATES_DIR=${TEMPLATES_DIR}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

