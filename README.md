# Reset Radar

A lightweight, open-source **ChatGPT MCP app** for viewing community-reported ChatGPT/Codex reset announcements. One public data provider for the current private MVP: [TIBO](https://tibo.cc/).

**Status:** Step 2.5 reliability testing is complete, with the production smoke test owner-accepted on 17/10/2026. Step 4A styling is merged. The Step 4B minimalist dashboard is awaiting separate acceptance in ChatGPT `thread`, `global` and inline views. This is not a public-plugin or cross-host certification.

## Current features

- Same MCP App in the ChatGPT left sidebar (`global`), right conversation tab (`thread`) and inline tool output.
- Latest TIBO source-recorded completion/reset post with its source excerpt, post date and original evidence link.
- Upcoming reports first, showing announcement excerpts when available, followed by the latest reset-related post and source update time. Stale/unavailable warnings stay visible; diagnostics and the full disclaimer are in collapsed **Source details**. Generic report labels appear only when an excerpt is missing.
- Manual **Refresh** using the official MCP Apps host bridge and read-only `get_tibo_status` tool.
- No personal ChatGPT account access, database, analytics, background polling or forecasts.

**Important:** A published post or community observation is **not proof your account's limits have reset**. No reported upcoming announcement means none was returned by the source; coverage is not guaranteed.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

The MCP endpoint is `http://localhost:3000/api/mcp`. The Vite build produces one self-contained HTML widget embedded in the MCP Apps resource. To validate the build:

```bash
npm run build
npm run typecheck
npm test
```

`npm run verify:widget` validates the embedded bundle after `npm run build:widget`. Run [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test Streamable HTTP MCP tools.

## Install in ChatGPT

Deploy this project to your **own** HTTPS Next.js host, then register `https://YOUR-HOST.example/api/mcp` as a custom MCP plugin. Avoid sharing the maintainer's endpoint when self-hosting.

Open the plugin from the left sidebar or a conversation's content tab. You can also invoke **Reset Radar** in a chat. Because the technical tool name `show_reset_radar_hello` was preserved for existing installations, refresh the plugin's tool metadata if the old title remains cached.

The read-only data tool is `get_tibo_status` and can be called independently of the graphical UI.

## Design review

The dashboard follows host theme colours and typography, with system light/dark fallbacks. Post timestamps represent publication or observation, not verified reset execution; the footer uses the provider's fetch time, not the server-check time. Reusable radar assets are available as [SVG](public/reset-radar.svg) and PNG at [64px](public/reset-radar-64.png), [192px](public/reset-radar-192.png) and [512px](public/reset-radar-512.png). Existing tests, typecheck, production build and self-contained widget validation passed. Temporary browser fixtures covered light/dark themes, 280/360/640px layouts, 200% text scaling, keyboard disclosure, loading, partial/empty data, stale/unavailable states and Refresh recovery. No fixture screenshots are committed. Actual ChatGPT host acceptance remains a separate check.

## Scope and limitations

- Provider: `https://tibo.cc/api/v1/status` only. No other providers are included yet.
- The server caches public API reads for approximately 5 minutes and enforces an 8-second timeout; pressing Refresh might legitimately return the same source snapshot.
- UI has no automatic polling, writes, authentication or tracking.
- Source outage and upstream ambiguity are displayed as unknown or unavailable.
- No promise of personal usage-limit reset, exact execution time, provider-wide coverage, or compatibility in untested host versions.

See [PLAN.md](PLAN.md) for milestones and [Phase 0 validation](docs/phase-0-validation.md) for source evaluation. This project is still an early personal MVP, not an official OpenAI application or approved directory listing.
