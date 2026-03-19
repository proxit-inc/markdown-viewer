"use client";

import { useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import MermaidBlock from "./MermaidBlock";
import "highlight.js/styles/github.css";

interface Props {
  markdown: string;
  onScrollChange?: (percent: number) => void;
  className?: string;
}

export default function MarkdownPreview({ markdown, onScrollChange, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !onScrollChange) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      onScrollChange(el.scrollTop / maxScroll);
    }
  }, [onScrollChange]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`overflow-auto p-6 ${className ?? ""}`}
    >
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            code({ className: codeClassName, children, ...props }) {
              const match = /language-(\w+)/.exec(codeClassName || "");
              if (match && match[1] === "mermaid") {
                return <MermaidBlock chart={String(children).trim()} />;
              }
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
