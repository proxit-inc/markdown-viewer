"use client";

import { useRef, useState } from "react";

interface Props {
  onImport: (content: string) => void;
  onExport: () => void;
  onCopy: () => void;
  onClear: () => void;
}

export default function Toolbar({ onImport, onExport, onCopy, onClear }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImport(text);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileMenuOpen(false);
  };

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
      <h1 className="text-lg font-bold mr-4">Markdown Viewer</h1>

      <div className="relative">
        <button
          onClick={() => setFileMenuOpen(!fileMenuOpen)}
          className="rounded px-3 py-1 text-sm hover:bg-gray-100"
        >
          File ▼
        </button>
        {fileMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setFileMenuOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Open .md
              </button>
              <button
                onClick={() => { onExport(); setFileMenuOpen(false); }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Save as .md
              </button>
              <hr className="border-gray-100" />
              <button
                onClick={() => { onClear(); setFileMenuOpen(false); }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleCopy}
        className="rounded px-3 py-1 text-sm hover:bg-gray-100"
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </header>
  );
}
