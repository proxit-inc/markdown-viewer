"use client";

interface Props {
  line: number;
  col: number;
  charCount: number;
  lastSaved: string | null;
}

export default function StatusBar({ line, col, charCount, lastSaved }: Props) {
  const savedDisplay = lastSaved
    ? `Auto-saved ${new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "";

  return (
    <footer className="flex items-center gap-4 border-t border-gray-200 px-4 py-1 text-xs text-gray-500">
      <span>
        Line {line}, Col {col}
      </span>
      <span>{charCount.toLocaleString()} chars</span>
      {savedDisplay && <span>{savedDisplay}</span>}
    </footer>
  );
}
