"use client";

interface Props {
  docs: { id: string; name: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export default function TabBar({ docs, activeId, onSelect, onClose, onNew }: Props) {
  return (
    <div className="flex items-end gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 pt-1 text-sm">
      {docs.map((doc) => {
        const isActive = doc.id === activeId;
        return (
          <div
            key={doc.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(doc.id)}
            className={`flex max-w-[12rem] shrink-0 cursor-pointer items-center gap-1 rounded-t border border-b-0 px-3 py-1 ${
              isActive
                ? "border-gray-200 bg-white text-gray-900"
                : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span className="truncate">{doc.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(doc.id);
              }}
              aria-label={`Close ${doc.name}`}
              className="shrink-0 rounded px-1 text-gray-400 hover:bg-gray-300 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        onClick={onNew}
        aria-label="New tab"
        className="shrink-0 rounded px-2 py-1 text-gray-500 hover:bg-gray-200"
      >
        +
      </button>
    </div>
  );
}
