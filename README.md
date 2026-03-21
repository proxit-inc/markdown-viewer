# Markdown Viewer

Real-time Markdown editor and previewer. Browser-only, privacy-first.

## Features

- Two-pane real-time preview (editor / preview)
- GFM support (tables, task lists, strikethrough)
- Mermaid diagram rendering
- Code syntax highlighting
- .md file import/export
- localStorage auto-save
- Pane width resize (drag)
- Mobile responsive (tab switching)
- Drag & drop file import
- Clipboard copy

## Tech Stack

- Next.js 15 (App Router, static export)
- TypeScript
- Tailwind CSS v4
- CodeMirror 6
- react-markdown + remark-gfm + rehype-highlight
- Mermaid.js

## Development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open **http://localhost:3000/markdown-viewer** (`basePath` is `/markdown-viewer`).

## Build

```bash
pnpm build
```

`pnpm build` runs `next build` then `scripts/relayout-export-for-basepath.mjs` (Next 16 static export puts assets at `out/_next` while HTML references `/markdown-viewer/_next/…`; the script moves them under **`out/markdown-viewer/`**). On Cloudflare Pages, the public URL is **`https://<project>.pages.dev/markdown-viewer/`**.

## Deploy

Connect the repository to Cloudflare Pages:

- Build command: `pnpm build`
- Build output directory: `out`
- Environment variables:
  - `NODE_VERSION`: `22`
  - `ENABLE_EXPERIMENTAL_COREPACK`: `1`

After deploy, verify **`/markdown-viewer/`** on the Pages hostname (not site root). If you use a custom domain via the **little-tool-kit** Worker, sync the Worker with [`docs/LITTLE_TOOL_KIT_WORKER.md`](docs/LITTLE_TOOL_KIT_WORKER.md) and confirm `https://proxit.tech/markdown-viewer` loads the editor.

## License

MIT
