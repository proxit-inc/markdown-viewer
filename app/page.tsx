"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import MarkdownPreview from "@/components/MarkdownPreview";
import ResizablePanes from "@/components/ResizablePanes";
import Toolbar from "@/components/Toolbar";
import StatusBar from "@/components/StatusBar";
import { saveMarkdown, loadMarkdown, getLastSavedTime } from "@/lib/storage";
import { exportMarkdown } from "@/lib/file-io";

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
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export default function Home() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollSourceRef = useRef<"editor" | "preview" | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<((percent: number) => void) | null>(null);

  const isMobile = !useMediaQuery("(min-width: 768px)");

  // Merge localStorage after paint (same DEFAULT as SSG avoids hydration mismatch).
  useEffect(() => {
    const saved = loadMarkdown();
    if (saved !== null) {
      setMarkdown(saved);
    }
    setLastSaved(getLastSavedTime());
  }, []);

  // Debounced auto-save
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdown(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMarkdown(value);
      setLastSaved(new Date().toISOString());
    }, 1000);
  }, []);

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

  // File operations
  const handleImport = useCallback((content: string) => {
    setMarkdown(content);
    saveMarkdown(content);
    setLastSaved(new Date().toISOString());
  }, []);

  const handleExport = useCallback(() => {
    exportMarkdown(markdown);
  }, [markdown]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(markdown);
  }, [markdown]);

  const handleClear = useCallback(() => {
    if (window.confirm("Clear all content?")) {
      setMarkdown("");
      saveMarkdown("");
      setLastSaved(new Date().toISOString());
    }
  }, []);

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
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".md") || file.name.endsWith(".markdown") || file.name.endsWith(".txt"))) {
        const content = await file.text();
        handleImport(content);
      }
    },
    [handleImport]
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
            Drop .md file here
          </div>
        </div>
      )}

      <Toolbar
        onImport={handleImport}
        onExport={handleExport}
        onCopy={handleCopy}
        onClear={handleClear}
      />

      <ResizablePanes
        isMobile={isMobile}
        left={
          <CodeMirrorEditor
            value={markdown}
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
            <MarkdownPreview markdown={markdown} />
          </div>
        }
      />

      <StatusBar
        line={cursor.line}
        col={cursor.col}
        charCount={markdown.length}
        lastSaved={lastSaved}
      />
    </div>
  );
}
