"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface Props {
  left: ReactNode;
  right: ReactNode;
  isMobile?: boolean;
}

export default function ResizablePanes({ left, right, isMobile }: Props) {
  const [leftPercent, setLeftPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const onPointerMove = (ev: PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((ev.clientX - rect.left) / rect.width) * 100;
        setLeftPercent(Math.min(80, Math.max(20, percent)));
      };

      const onPointerUp = () => {
        setIsDragging(false);
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    []
  );

  if (isMobile) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("edit")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "edit"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "preview"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className={activeTab === "edit" ? "h-full" : "hidden"}>{left}</div>
          <div className={activeTab === "preview" ? "h-full" : "hidden"}>{right}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div
        style={{ width: `${leftPercent}%` }}
        className={`overflow-hidden ${isDragging ? "pointer-events-none select-none" : ""}`}
      >
        {left}
      </div>
      <div
        onPointerDown={handlePointerDown}
        className="w-1 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-blue-400 transition-colors"
      />
      <div
        style={{ width: `${100 - leftPercent}%` }}
        className={`overflow-hidden ${isDragging ? "pointer-events-none select-none" : ""}`}
      >
        {right}
      </div>
    </div>
  );
}
