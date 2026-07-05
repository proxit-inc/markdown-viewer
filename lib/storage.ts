const DOCS_KEY = "md-viewer-docs";
const LEGACY_CONTENT_KEY = "md-viewer-content";
const LEGACY_TIMESTAMP_KEY = "md-viewer-saved-at";

export interface DocumentData {
  id: string;
  name: string;
  content: string;
}

export interface Workspace {
  docs: DocumentData[];
  activeId: string;
  savedAt: string | null;
}

export function createDocument(name: string, content: string): DocumentData {
  return { id: crypto.randomUUID(), name, content };
}

export function saveWorkspace(docs: DocumentData[], activeId: string): string | null {
  try {
    const savedAt = new Date().toISOString();
    localStorage.setItem(DOCS_KEY, JSON.stringify({ version: 1, docs, activeId, savedAt }));
    return savedAt;
  } catch {
    // localStorage may be full or disabled
    return null;
  }
}

function isValidWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const docs = (value as Record<string, unknown>).docs;
  if (!Array.isArray(docs) || docs.length === 0) return false;
  return docs.every(
    (d) =>
      d &&
      typeof d === "object" &&
      typeof (d as DocumentData).id === "string" &&
      typeof (d as DocumentData).name === "string" &&
      typeof (d as DocumentData).content === "string"
  );
}

function migrateLegacyWorkspace(): Workspace | null {
  let legacyContent: string | null;
  try {
    legacyContent = localStorage.getItem(LEGACY_CONTENT_KEY);
  } catch {
    return null;
  }
  if (legacyContent === null) return null;

  let legacyTimestamp: string | null;
  try {
    legacyTimestamp = localStorage.getItem(LEGACY_TIMESTAMP_KEY);
  } catch {
    legacyTimestamp = null;
  }

  const doc = createDocument("document.md", legacyContent);
  const workspace: Workspace = { docs: [doc], activeId: doc.id, savedAt: legacyTimestamp };

  saveWorkspace(workspace.docs, workspace.activeId);
  try {
    localStorage.removeItem(LEGACY_CONTENT_KEY);
    localStorage.removeItem(LEGACY_TIMESTAMP_KEY);
  } catch {
    // ignore
  }

  return workspace;
}

export function loadWorkspace(): Workspace | null {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (isValidWorkspace(parsed)) {
        const activeId = parsed.docs.some((d) => d.id === parsed.activeId)
          ? parsed.activeId
          : parsed.docs[0].id;
        return { docs: parsed.docs, activeId, savedAt: parsed.savedAt ?? null };
      }
      return null;
    }
  } catch {
    return null;
  }

  return migrateLegacyWorkspace();
}
