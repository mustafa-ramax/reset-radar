import { createMcpHandler } from "mcp-handler";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

// Phase 0.5: a disposable, intentionally static panel to test ChatGPT entrypoints.
// No external reset feeds, authentication, storage, timers or personal data are involved.
const UI_URI = "ui://reset-radar/hello.html";

const HELLO_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset Radar smoke test</title>
    <style>
      :root { color-scheme: light dark; font-family: system-ui, -apple-system, sans-serif; }
      body { margin: 0; padding: 22px; background: Canvas; color: CanvasText; }
      main { border: 1px solid color-mix(in srgb, CanvasText 15%, transparent); border-radius: 16px; padding: 24px; }
      .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .65; }
      h1 { font-size: 23px; margin: 16px 0 8px; }
      p { line-height: 1.5; margin: 0; }
      .dot { display: inline-block; width: 9px; height: 9px; background: #36a86e; border-radius: 50%; margin-right: 6px; }
      .foot { font-size: 12px; opacity: .7; margin-top: 18px; }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow"><span class="dot"></span>Reset Radar · Panel smoke test</div>
      <h1>Hello from Reset Radar! 👋</h1>
      <p>If you can see this <strong>beside your ChatGPT conversation</strong>, the custom <code>thread</code> entrypoint works.</p>
      <p class="foot">Static proof of concept only · no reset API calls or background requests.</p>
    </main>
  </body>
</html>`;

const handler = createMcpHandler(
  (server) => {
    registerAppResource(server, "Reset Radar Hello World", UI_URI, {}, async () => ({
      contents: [{ uri: UI_URI, mimeType: RESOURCE_MIME_TYPE, text: HELLO_HTML }],
    }));

    registerAppTool(
      server,
      "show_reset_radar_hello",
      {
        title: "Open Reset Radar Hello World Panel",
        description: "Open a read-only Hello World MCP App in the ChatGPT conversation side panel. This is a compatibility test, not a live reset tracker.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, openWorldHint: false },
        icons: [
          {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='20' fill='%232563eb'/%3E%3Ccircle cx='24' cy='24' r='12' fill='none' stroke='white' stroke-width='2'/%3E%3Ccircle cx='24' cy='24' r='4' fill='white'/%3E%3Cpath d='M24 24 37 11' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
            mimeType: "image/svg+xml",
            sizes: ["48x48"],
          },
        ],
        _meta: {
          ui: { resourceUri: UI_URI },
          "openai/ui": { entrypoints: [{ type: "thread" }, { type: "global" }] },
        },
      },
      async () => ({
        content: [{ type: "text", text: "Reset Radar Hello World panel requested. No live reset data is connected." }],
        structuredContent: { message: "Hello from Reset Radar!", stage: "thread-panel-smoke-test" },
      }),
    );
  },
  { serverInfo: { name: "reset-radar-smoke", version: "0.0.1" } },
);

export { handler as GET, handler as POST };
