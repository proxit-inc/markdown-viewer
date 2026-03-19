"use client";

import { useRef, useEffect } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from "@codemirror/language";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (pos: { line: number; col: number }) => void;
  onScrollChange?: (percent: number) => void;
  onRegisterScroll?: (scrollToPercent: ((percent: number) => void) | null) => void;
  className?: string;
}

export default function CodeMirrorEditor({
  value,
  onChange,
  onCursorChange,
  onScrollChange,
  onRegisterScroll,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isExternalUpdate = useRef(false);

  const onChangeRef = useRef(onChange);
  const onCursorChangeRef = useRef(onCursorChange);
  const onScrollChangeRef = useRef(onScrollChange);
  const onRegisterScrollRef = useRef(onRegisterScroll);
  onChangeRef.current = onChange;
  onCursorChangeRef.current = onCursorChange;
  onScrollChangeRef.current = onScrollChange;
  onRegisterScrollRef.current = onRegisterScroll;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isExternalUpdate.current) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            onCursorChangeRef.current?.({
              line: line.number,
              col: head - line.from + 1,
            });
          }
        }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px" },
          ".cm-scroller": { overflow: "auto", fontFamily: "monospace" },
          ".cm-content": { minHeight: "100%" },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    const handleScroll = () => {
      const v = viewRef.current;
      if (!v) return;
      const cb = onScrollChangeRef.current;
      if (!cb) return;
      const { scrollTop, scrollHeight, clientHeight } = v.scrollDOM;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll > 0) {
        cb(scrollTop / maxScroll);
      }
    };
    view.scrollDOM.addEventListener("scroll", handleScroll);

    const scrollToPercent = (percent: number) => {
      const v = viewRef.current;
      if (!v) return;
      const { scrollHeight, clientHeight } = v.scrollDOM;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll > 0) {
        v.scrollDOM.scrollTop = percent * maxScroll;
      }
    };
    onRegisterScrollRef.current?.(scrollToPercent);

    return () => {
      onRegisterScrollRef.current?.(null);
      view.scrollDOM.removeEventListener("scroll", handleScroll);
      view.destroy();
      viewRef.current = null;
    };
    // Mount-only: CodeMirror init once; callbacks read via refs to avoid stale closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
      isExternalUpdate.current = false;
    }
  }, [value]);

  return <div ref={containerRef} className={className} />;
}
