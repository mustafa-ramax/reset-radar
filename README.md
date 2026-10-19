# Reset Radar

**Upcoming reset reports and the latest reset-related post, in ChatGPT.**

Reset Radar is an open-source, read-only MCP app that displays community-reported ChatGPT/Codex usage-limit reset information. It shows the original post excerpts, dates and source links. **It does not access or verify your personal account quota.**

**Status (October 2026):** The maintainer has accepted the working ChatGPT sidebar, conversation-panel and inline UI. The code is public, but there is **no official v0.1 release or ChatGPT Plugin Directory listing yet**. Dependency/security and public-hosting reviews remain outstanding.

## Features

- **Upcoming:** A reported current announcement from [TIBO](https://tibo.cc/), when available, with its original text, publication/observation date and X link. Otherwise displays a no-report or unable-to-verify state.
- **Latest reported post:** The latest usable TIBO reset-related post and its original evidence. A supplemental Codex Reset recorded post can appear as an attributed fallback when TIBO has no usable latest record.
- **Supplemental context:** Data: [codex-reset.com](https://codex-reset.com/). Eligible active signals can appear only as **hints**, not confirmed upcoming resets; duplicate original posts are not independent confirmations.
- **Manual Refresh**, source-freshness warnings, light/dark themes and collapsed technical **Source details**.

**Not included:** Personal quota monitoring, a reset history screen, forecasts, alerts, account logins or background polling. A source-recorded reset post does not prove the user's limits changed.

## Install as a custom MCP app

The app is **not yet available via a one-click public directory listing**. Custom MCP server creation must be supported by your ChatGPT plan, client and workspace permissions.

1. **Self-host** the MCP server using the instructions below. Your endpoint will be `https://YOUR-HOST.example/api/mcp`.
2. If available in your ChatGPT account, open **Plugins**, select **+ → Add custom MCP server**, name it **Reset Radar**, and enter your full public HTTPS endpoint under Connection.
3. Configure **no authentication** if permitted: this read-only app currently has no login flow. Review the custom-server risk warning and proceed only if you trust your server.
4. Review the discovered tools and install/enable the custom plugin if prompted.
5. In a ChatGPT conversation, select or mention **@Reset Radar**. Open the app from the sidebar, conversation content panel or inline result where supported. Test Refresh and a source link.

See OpenAI's current [custom MCP app setup](https://help.openai.com/en/articles/12584461-creating-custom-mcp-apps-in-chatgpt) and [connection instructions](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt). UI labels and eligibility may change.

**Hosted versus self-hosted:** The maintainer has a [personal test deployment](https://reset-radar-eight.vercel.app/) but does not yet offer a supported public hosted installation. Use **your own** MCP deployment for independent testing.

### Self-host with Vercel

1. Fork or clone [this repository](https://github.com/mustafa-ramax/reset-radar).
2. Import the fork into [Vercel](https://vercel.com/new) as a Next.js project. Select a supported Node.js version (Node.js 22 recommended).
3. Deploy; `npm run build` includes tests, typecheck, a self-contained widget build/verification, and Next.js production build. No TIBO/Codex Reset API keys or app environment variables are required for the current public feeds.
4. Register **your** `https://YOUR-VERCEL-DOMAIN/api/mcp` in ChatGPT. Verify the endpoint with a compatible MCP client and test the actual ChatGPT UI. Vercel READY alone isn't proof the host can render it.

The site root is informational. The actual app is a Streamable HTTP MCP server at `/api/mcp`. Review hosting quota and source-provider usage rules before broadly sharing your deployment.

### Local development

Node.js 20+ and npm are required; Node.js 22 is recommended.

```bash
npm install
npm run dev
```

Local endpoint: `http://localhost:3000/api/mcp`. A remote ChatGPT connection generally needs public HTTPS or a supported secure tunnel.

```bash
npm test
npm run typecheck
npm run build
```

`npm run build` already runs tests and typecheck. You can also inspect MCP tools and resources using [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

## MCP compatibility

| Tool ID | Purpose |
| --- | --- |
| `show_reset_radar_hello` | Opens the dashboard. Historic ID retained for installed-client compatibility. |
| `get_reset_radar` | Compact two-provider status with selected evidence and source health. |
| `get_tibo_status` | Original read-only TIBO tool. |

Widget resource: `ui://reset-radar/dashboard.html`. Startup and manual Refresh call `get_reset_radar`. Data is cached server-side; Refresh might return the same source snapshot.

## Troubleshooting

- **No Add custom MCP server option:** Your account/workspace/client may not support it. Consult the [official connection guide](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt) or your administrator.
- **No tools discovered:** Make sure you entered the HTTPS `/api/mcp` URL, not the root website. Test with an MCP client.
- **Outdated UI or tools:** Close and reopen the plugin; refresh/reconnect its tool metadata if that control is supported. The opener's internal name still ends in `hello`.
- **Source unavailable or stale:** Check Source details and retry manually later. Missing coverage doesn't prove no reset is planned.
- **Original X link fails:** Host link handling varies. Open the supplied HTTPS source URL in your browser.

## Attribution, license and limitations

Reset Radar is **unofficial and unaffiliated with OpenAI** and the providers. Its evidence comes from [TIBO](https://tibo.cc/) (primary) and Data: [codex-reset.com](https://codex-reset.com/) (supplementary). Different sources may relay the same original posts. Dates can reflect publication or observation, not the execution of a reset.

Project source code: [MIT License](LICENSE), copyright © 2026 Mustafa RaMax. **MIT does not license third-party post text, source feeds, brands or other external works**.

See the [source-validation notes](docs/step3a-validation.md), [release-readiness checklist and draft release notes](docs/release-v0.1.md), or [report an issue](https://github.com/mustafa-ramax/reset-radar/issues). The product deliberately focuses on **Upcoming** and **Latest reported post**.

Real current ChatGPT-host screenshots can be added later; synthetic fixtures and older UI screenshots are not presented as production screenshots.
