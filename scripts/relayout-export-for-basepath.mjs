/**
 * Next.js static export with basePath emits HTML referencing /markdown-viewer/_next/...
 * but writes assets to out/_next (out root). Cloudflare Pages needs files under out/markdown-viewer/.
 * Run after `next build`.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
const nestedDir = join(outDir, "markdown-viewer");

if (!existsSync(join(outDir, "_next")) || !existsSync(join(outDir, "index.html"))) {
  console.error(
    "relayout-export-for-basepath: expected out/_next and out/index.html — run `next build` first."
  );
  process.exit(1);
}

if (existsSync(nestedDir)) {
  rmSync(nestedDir, { recursive: true });
}
mkdirSync(nestedDir, { recursive: true });

const moveIntoNested = (name) => {
  const from = join(outDir, name);
  const to = join(nestedDir, name);
  if (existsSync(from)) {
    renameSync(from, to);
  }
};

for (const name of [
  "_next",
  "index.html",
  "index.txt",
  "_not-found",
  "_not-found.html",
  "_not-found.txt",
  "404.html",
]) {
  moveIntoNested(name);
}

for (const name of readdirSync(outDir)) {
  if (name === "markdown-viewer" || !name.startsWith("__next")) {
    continue;
  }
  moveIntoNested(name);
}

console.log("relayout-export-for-basepath: assets are under out/markdown-viewer/");
