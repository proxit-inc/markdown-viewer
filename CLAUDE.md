# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Static export to out/
pnpm type-check   # TypeScript strict check (tsc --noEmit)
pnpm lint         # ESLint (next/core-web-vitals + next/typescript)
```

No test framework is currently configured.

## Architecture

Browser-only Markdown editor+previewer. All processing runs client-side; no API routes or server-side logic. Static export via `next build` produces the `out/` directory for Cloudflare Pages deployment.

### State & Data Flow

`app/page.tsx` is the single orchestrator. It holds all application state in React hooks and passes callbacks down:

```
page.tsx (markdown state, scroll sync, auto-save, drag&drop)
  ├── Toolbar        — file menu (open/save/clear), copy button
  ├── ResizablePanes — desktop: drag-resizable split; mobile (<768px): tab switching
  │   ├── CodeMirrorEditor (dynamic import, ssr:false)
  │   └── MarkdownPreview
  │       └── MermaidBlock (lazy-loaded per block)
  └── StatusBar      — line/col, char count, last saved time
```

### Key Patterns

- **CodeMirror 6** is integrated directly (no wrapper library). It's dynamically imported with `ssr: false` to avoid hydration issues with `document` access. External value updates use `view.dispatch()` guarded by an `isExternalUpdate` ref to prevent echo loops.

- **Scroll sync** is bidirectional and percentage-based (0–1). A `scrollSourceRef` tracks which pane initiated the scroll; a 50ms timeout resets it to prevent infinite loops.

- **Mermaid** is lazy-loaded via dynamic `import("mermaid")` with a module-level singleton promise. Each `MermaidBlock` calls `mermaid.render()` in a useEffect with cancellation cleanup.

- **Auto-save** debounces at 1000ms to localStorage (`md-viewer-content` key). Initial render uses `DEFAULT_MARKDOWN` (matches SSG); a mount `useEffect` merges saved content from localStorage (brief flash possible when saved differs).

- **MarkdownPreview** uses a custom `components.code` handler to intercept `language-mermaid` blocks and route them to `MermaidBlock`; all other code blocks pass through to rehype-highlight.

### Tech Stack

- Next.js 15 (App Router, `output: "export"`)
- React 19, TypeScript 5 (strict)
- Tailwind CSS v4 with `@tailwindcss/typography` (prose styles via `@plugin` in globals.css)
- CodeMirror 6 (`@codemirror/*` packages)
- react-markdown + remark-gfm + rehype-highlight + rehype-raw
- Mermaid.js for diagrams
- highlight.js for code syntax colors

### Deployment

Cloudflare Pages with Git integration. CI runs type-check, lint, and build on PRs (`.ts`/`.tsx`/`.js` paths only). CF Pages handles deployment separately — no deploy step in CI.
