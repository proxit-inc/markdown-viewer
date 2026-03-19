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

## Build

```bash
pnpm build
```

Output is generated in the `out/` directory as a static site.

## Deploy

Connect the repository to Cloudflare Pages:

- Build command: `pnpm build`
- Build output directory: `out`
- Environment variables:
  - `NODE_VERSION`: `22`
  - `ENABLE_EXPERIMENTAL_COREPACK`: `1`

## License

MIT
