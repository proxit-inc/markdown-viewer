"use client";

import { useEffect, useId, useState } from "react";

let mermaidModule: typeof import("mermaid") | null = null;
let mermaidLoadPromise: Promise<typeof import("mermaid")> | null = null;

function loadMermaid() {
  if (mermaidModule) return Promise.resolve(mermaidModule);
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = import("mermaid").then((mod) => {
      mod.default.initialize({ startOnLoad: false, theme: "default" });
      mermaidModule = mod;
      return mod;
    });
  }
  return mermaidLoadPromise;
}

interface Props {
  chart: string;
}

export default function MermaidBlock({ chart }: Props) {
  const id = useId();
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const elementId = `mermaid-${id.replace(/:/g, "")}`;

    loadMermaid()
      .then(async (mod) => {
        if (cancelled) return;
        const { svg: renderedSvg } = await mod.default.render(elementId, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid render error");
          setSvg("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="my-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
        <strong>Mermaid Error:</strong> {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-2 flex items-center justify-center p-4 text-gray-400">
        Loading diagram...
      </div>
    );
  }

  return (
    <div
      className="my-2 flex justify-center overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
