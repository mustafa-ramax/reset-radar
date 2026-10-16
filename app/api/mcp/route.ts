import { createMcpHandler } from "mcp-handler";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTiboStatus } from "../../../lib/tibo-status";

// Keep the existing tool identifier for installed plugin compatibility.
// A new resource URI avoids accidentally loading the cached Hello World iframe.
const UI_URI = "ui://reset-radar/dashboard.html";

const handler = createMcpHandler(
  (server) => {
    registerAppResource(server, "Reset Radar", UI_URI, {}, async () => {
      const html = await readFile(path.join(process.cwd(), "dist/widget/dashboard.html"), "utf8");
      return { contents: [{ uri: UI_URI, mimeType: RESOURCE_MIME_TYPE, text: html }] };
    });

    registerAppTool(
      server,
      "show_reset_radar_hello",
      {
        title: "Reset Radar",
        description: "Open the read-only Reset Radar dashboard in the ChatGPT conversation panel or left sidebar. Shows third-party TIBO status, latest recorded post, source freshness and manual refresh.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, openWorldHint: false },
        _meta: {
          ui: { resourceUri: UI_URI },
          "openai/ui": { entrypoints: [{ type: "thread" }, { type: "global" }] },
        },
      },
      async () => {
        const status = await getTiboStatus();
        return {
          content: [{ type: "text", text: "Reset Radar TIBO status: " + status.state
            + ". Public source-recorded latest post; personal account reset is not verified." }],
          structuredContent: { ...status },
        };
      },
    );

    // Step 1 only: data-only tools use the MCP SDK directly (no UI metadata).
    // The Hello World MCP App and both entrypoints remain unchanged.
    server.registerTool(
      "get_tibo_status",
      {
        title: "Reset Radar status",
        description: "Read the current public TIBO reset status with source freshness and original post links. Third-party observations only, not a personal ChatGPT quota status.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async () => {
        const status = await getTiboStatus();
        return {
          content: [{ type: "text", text: JSON.stringify(status) }],
          structuredContent: { ...status },
        };
      },
    );
  },
  { serverInfo: { name: "reset-radar", version: "0.1.0" } },
);

export { handler as GET, handler as POST };
