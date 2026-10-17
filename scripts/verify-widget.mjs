import { readFile } from "node:fs/promises";

const path = new URL("../dist/widget/dashboard.html", import.meta.url);
const html = await readFile(path, "utf8");

const required = [
  "<title>Reset Radar</title>",
  'id="refresh"',
  'id="source-link"',
  "get_reset_radar",
  "https://codex-reset.com/",
];

for (const marker of required) {
  if (!html.includes(marker)) {
    throw new Error("Bundled MCP widget missing marker: " + marker);
  }
}
if (/<script\b[^>]*\bsrc\s*=/i.test(html)) {
  throw new Error("MCP widget must be self-contained; found an external script");
}
if (!/<script\b/i.test(html)) {
  throw new Error("MCP widget has no bundled script");
}
if (!/<style\b[^>]*>\s*\S[\s\S]*?<\/style>/i.test(html)) {
  throw new Error("MCP widget has no embedded CSS");
}
if (/<link\b[^>]*\brel\s*=\s*(?:"[^"]*\bstylesheet\b[^"]*"|'[^']*\bstylesheet\b[^']*'|stylesheet\b)/i.test(html)) {
  throw new Error("MCP widget must be self-contained; found an external stylesheet");
}
console.log("MCP dashboard bundle validated (" + html.length + " characters)");
