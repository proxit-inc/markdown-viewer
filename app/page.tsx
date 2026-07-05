"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import MarkdownPreview from "@/components/MarkdownPreview";
import ResizablePanes from "@/components/ResizablePanes";
import Toolbar from "@/components/Toolbar";
import TabBar from "@/components/TabBar";
import StatusBar from "@/components/StatusBar";
import {
  createDocument,
  saveWorkspace,
  loadWorkspace,
  type DocumentData,
} from "@/lib/storage";
import { exportMarkdown, importMarkdown, isMarkdownFile, toExportFilename } from "@/lib/file-io";

const CodeMirrorEditor = dynamic(() => import("@/components/CodeMirrorEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

const DEFAULT_MARKDOWN = `# Welcome to Markdown Viewer

A real-time Markdown editor and previewer.

## Features

- **GFM support**: tables, task lists, strikethrough
- **Code syntax highlighting**
- **Mermaid diagrams**
- **File import/export**
- **Auto-save to localStorage**

## Table Example

| Feature | Status |
|---------|--------|
| GFM     | ✅     |
| Mermaid | ✅     |
| Code HL | ✅     |

## Task List

- [x] Setup project
- [x] Editor + Preview
- [ ] Deploy to Cloudflare Pages

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
  A[Editor] --> B[Markdown]
  B --> C[Preview]
  B --> D[Mermaid]
  B --> E[Code HL]
\`\`\`
`;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    const raf = requestAnimationFrame(() => setMatches(mql.matches));
    return () => {
      cancelAnimationFrame(raf);
      mql.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

export default function Home() {
  const [docs, setDocs] = useState<DocumentData[]>(() => [
    createDocument("Untitled", DEFAULT_MARKDOWN),
  ]);
  const [activeId, setActiveId] = useState<string>(() => docs[0].id);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const hydratedRef = useRef(false);
  const scrollSourceRef = useRef<"editor" | "preview" | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<((percent: number) => void) | null>(null);

  const isMobile = !useMediaQuery("(min-width: 768px)");
  const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0];

  // Merge localStorage after paint (same DEFAULT as SSG avoids hydration mismatch).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const workspace = loadWorkspace();
      if (workspace) {
        setDocs(workspace.docs);
        setActiveId(workspace.activeId);
        setLastSaved(workspace.savedAt);
      }
      hydratedRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Debounced auto-save of the whole workspace (covers edits, tab open/close/switch, clear)
  useEffect(() => {
    if (!hydratedRef.current) return;
    const timeout = setTimeout(() => {
      const savedAt = saveWorkspace(docs, activeId);
      if (savedAt) setLastSaved(savedAt);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [docs, activeId]);

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setDocs((prev) => prev.map((d) => (d.id === activeId ? { ...d, content: value } : d)));
    },
    [activeId]
  );

  // Scroll sync
  const handleEditorScroll = useCallback((percent: number) => {
    if (scrollSourceRef.current === "preview") return;
    scrollSourceRef.current = "editor";
    const el = previewRef.current;
    if (el) {
      el.scrollTop = percent * (el.scrollHeight - el.clientHeight);
    }
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      scrollSourceRef.current = null;
    }, 50);
  }, []);

  const registerEditorScroll = useCallback((fn: ((percent: number) => void) | null) => {
    editorScrollRef.current = fn;
  }, []);

  const handlePreviewScroll = useCallback((percent: number) => {
    if (scrollSourceRef.current === "editor") return;
    scrollSourceRef.current = "preview";
    editorScrollRef.current?.(percent);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      scrollSourceRef.current = null;
    }, 50);
  }, []);

  const handlePreviewScrollEvent = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) handlePreviewScroll(el.scrollTop / maxScroll);
  }, [handlePreviewScroll]);

  const resetEditorPosition = useCallback(() => {
    setCursor({ line: 1, col: 1 });
    if (previewRef.current) previewRef.current.scrollTop = 0;
  }, []);

  // Tab operations
  const handleSelectTab = useCallback(
    (id: string) => {
      setActiveId(id);
      resetEditorPosition();
    },
    [resetEditorPosition]
  );

  const handleNewTab = useCallback(() => {
    const doc = createDocument("Untitled", "");
    setDocs((prev) => [...prev, doc]);
    setActiveId(doc.id);
    resetEditorPosition();
  }, [resetEditorPosition]);

  const handleCloseTab = useCallback(
    (id: string) => {
      const closing = docs.find((d) => d.id === id);
      if (!closing) return;
      if (closing.content !== "" && !window.confirm("Close this tab? Its content will be discarded.")) {
        return;
      }

      const closingIndex = docs.findIndex((d) => d.id === id);
      const remaining = docs.filter((d) => d.id !== id);

      if (remaining.length === 0) {
        const fresh = createDocument("Untitled", "");
        setDocs([fresh]);
        setActiveId(fresh.id);
      } else {
        setDocs(remaining);
        if (id === activeId) {
          const nextActive = remaining[Math.min(closingIndex, remaining.length - 1)];
          setActiveId(nextActive.id);
        }
      }
      resetEditorPosition();
    },
    [docs, activeId, resetEditorPosition]
  );

  // File operations
  const handleOpenFiles = useCallback(
    async (files: File[]) => {
      const mdFiles = files.filter((f) => isMarkdownFile(f.name));
      if (!mdFiles.length) return;
      const contents = await Promise.all(mdFiles.map(importMarkdown));
      const newDocs = mdFiles.map((f, i) => createDocument(f.name, contents[i]));
      setDocs((prev) => [...prev, ...newDocs]);
      setActiveId(newDocs[newDocs.length - 1].id);
      resetEditorPosition();
    },
    [resetEditorPosition]
  );

  const handleExport = useCallback(() => {
    exportMarkdown(activeDoc.content, toExportFilename(activeDoc.name));
  }, [activeDoc]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeDoc.content);
  }, [activeDoc]);

  const handleClear = useCallback(() => {
    if (window.confirm("Clear all content?")) {
      setDocs((prev) => prev.map((d) => (d.id === activeId ? { ...d, content: "" } : d)));
    }
  }, [activeId]);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      await handleOpenFiles(Array.from(e.dataTransfer.files));
    },
    [handleOpenFiles]
  );

  return (
    <div
      className="flex h-screen flex-col relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-dashed border-blue-500 bg-white px-8 py-6 text-lg font-medium text-blue-600 shadow-lg">
            Drop .md files here
          </div>
        </div>
      )}

      <Toolbar
        onOpenFiles={handleOpenFiles}
        onExport={handleExport}
        onCopy={handleCopy}
        onClear={handleClear}
      />

      <TabBar
        docs={docs}
        activeId={activeDoc.id}
        onSelect={handleSelectTab}
        onClose={handleCloseTab}
        onNew={handleNewTab}
      />

      <ResizablePanes
        isMobile={isMobile}
        left={
          <CodeMirrorEditor
            key={activeDoc.id}
            value={activeDoc.content}
            onChange={handleMarkdownChange}
            onCursorChange={setCursor}
            onScrollChange={handleEditorScroll}
            onRegisterScroll={registerEditorScroll}
            className="h-full"
          />
        }
        right={
          <div
            ref={previewRef}
            className="h-full overflow-auto"
            onScroll={handlePreviewScrollEvent}
          >
            <MarkdownPreview markdown={activeDoc.content} />
          </div>
        }
      />

      <StatusBar
        line={cursor.line}
        col={cursor.col}
        charCount={activeDoc.content.length}
        lastSaved={lastSaved}
      />
    </div>
  );
}
