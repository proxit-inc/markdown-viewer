const STORAGE_KEY = "md-viewer-content";
const TIMESTAMP_KEY = "md-viewer-saved-at";

export function saveMarkdown(content: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, content);
    localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
  } catch {
    // localStorage may be full or disabled
  }
}

export function loadMarkdown(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getLastSavedTime(): string | null {
  try {
    return localStorage.getItem(TIMESTAMP_KEY);
  } catch {
    return null;
  }
}
