# Reset Radar

Open-source ChatGPT/Codex reset radar. **Current branch is a temporary Hello World compatibility smoke test, not the tracker MVP.**

## Why this tiny test exists

Before implementing the dashboard or integrating third-party reset feeds, we need to verify whether a personal ChatGPT plugin can render an MCP Apps **conversation-side panel** (`openai/ui.entrypoints: [{ type: "thread" }]`).

The test registers one read-only tool: `show_reset_radar_hello`, plus one static `ui://reset-radar/hello.html` MCP Apps resource. It reads no external data and contains no telemetry or background refresh.

## Run locally

- Node.js 20+
- `npm install`
- `npm run dev`
- Server: `http://localhost:3000/api/mcp`
- Validate with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector): `npx @modelcontextprotocol/inspector` (Streamable HTTP).

## Test in ChatGPT

1. Deploy the test server on a publicly reachable HTTPS address (or tunnel the local port). Append `/api/mcp` to the address. **Don't use the root page as the MCP URL.**
2. In ChatGPT Plugins, add a custom MCP server with no authentication, install it personally, and open a new chat.
3. Select the plugin and ask: **Open the Reset Radar Hello World panel.**
4. Confirm both the read-only tool runs and **a side panel appears beside the chat** showing `Hello from Reset Radar!`.
5. If only tool text appears, record that as a UI/host integration failure; it is not a successful panel test. Refresh the plugin after metadata changes.

## Current limits

- No real reset data or forecasts.
- No account connection, storage, background jobs or notifications.
- No claim of compatibility with Codex visual panels, macOS clients or all ChatGPT accounts until tested.
- We do not hardcode a Vercel hostname in the source.

See [PLAN.md](PLAN.md) and [Phase 0 findings](docs/phase-0-validation.md). Further implementation begins only after the compatibility gate is resolved.
