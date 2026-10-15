# Phase 0 — Source & Host Feasibility Review

**Review date:** 15 October 2026 (Australia/Sydney)  
**Status:** RESEARCH COMPLETE; RUNTIME VERIFICATION PENDING  
**Scope:** Phase 0 only. No MVP scaffold, hosted MCP endpoint, ChatGPT installation or Vercel deployment has been created.

> **Decision:** Proceed with a read-only MCP Apps + OpenAI `thread` extension architecture, but do not declare Phase 0 complete until the live source endpoints and actual host integration have been exercised. Documentation support is not the same as a successful end-to-end test.

## A. Source investigation

### A1. whenresets.net — historical ledger

- **Intended URL:** https://whenresets.net/ledger.json
- **Upstream source repository:** https://github.com/kosanhu2021-source/codex-reset-ledger
- **Verified from GitHub connector on 15 October 2026:** `data/codex-reset-ledger.json`, `README.md`, and `LICENSE`.
- **Repository licence:** MIT. Retain copyright and licence in any substantial redistributed portions; credit/link to the original source.
- **GitHub snapshot metadata (not asserted to be the current live website response):**
  - `generated_at: "2026-09-13"`
  - `total_rows: 58`
  - `resets: 55`
  - `policy_notes: 3`
  - `events: []` records.
- **Observed JSON fields in the checked-in source:** top-level `dataset`, `website`, `counting_rule`, `generated_at`, `total_rows`, `resets`, `policy_notes`, `events`; each event has `datetime_utc`, `type`, `type_label`, `description`, `source_url`, `source_platform`.
- **Important schema discrepancy:** the README describes the site's `whenresets.ledger/1` schema and lists CSV columns `date_utc`/`time_utc`; the checked-in JSON uses `datetime_utc`. **Do not code against README field names without validating the actual live `ledger.json` response.**
- The source README claims CORS `Access-Control-Allow-Origin: *`, no key, and site rebuild updates, but **live CORS/headers, HTTP response and current payload have not yet been independently verified in this phase**.
- The checked-in file is stale relative to 15 October. It is a **historical fixture/sample**, not proof of today's last reset.
- The maintainer describes one row per event that took effect, but some source post excerpts are forward-looking (“will reset”). Therefore our UI must call these **source-recorded events**, preserve evidence and not claim an independently verified effective time where the data does not prove it.

**Source links:** [Ledger GitHub README](https://github.com/kosanhu2021-source/codex-reset-ledger/blob/main/README.md) · [JSON](https://github.com/kosanhu2021-source/codex-reset-ledger/blob/main/data/codex-reset-ledger.json) · [MIT licence](https://github.com/kosanhu2021-source/codex-reset-ledger/blob/main/LICENSE)

### A2. whenresets.com — signal and archive API

- **Documentation:** https://whenresets.com/developers
- **Documented read-only public endpoints:** `GET /api/v1/archive`, `GET /api/v1/tibo`, `GET /api/v1/status`; no API key for public reads.
- **Preferred use:**
  - `/api/v1/tibo`: captured author posts and `data.signals` with source health.
  - `/api/v1/archive`: versioned events, verification, coverage, corrections.
  - `/api/v1/status`: documented fallback for `data.source_signals` and `data.signal_source` using the same classifier.
- **Signal kinds per provider:** `explicit_reset_plan`, `reset_hint`, `plan_reopening`, `policy_change`, `release_teaser`.
- **Signal fields per contract:** `id`, `kind`, `source_url`, `text`, `published_at`, `basis` (captured excerpt), optional `relative_day` and `expires_at`.
- **Expiry semantics:** `expires_at` is a 72-hour *display* expiry, **not** a promised execution time or evidence of completion.
- **Source health:** show `checked_at`, `transport_ok`, `stale`; an empty signals array with stale/failed source coverage **does not mean no announcement**.
- **Archive semantics:** `meta.schema_version = archive-v1`, `meta.snapshot_id`, `meta.generated_at`; `data.today.state`, `data.coverage.state`, `data.coverage.checked_at`; records may have `event_id`, `announcement_id`, `revision`, `verification_status`, `effective_at`, `affected_plans`.
- **Critical condition:** Only use a `none-recorded` state when `data.today.state === "none-recorded"` **and** `data.coverage.state === "complete"`; otherwise display *unknown*. This is the provider's published guidance.
- **Attribution:** credit WhenResets and link to the snapshot/version and source URLs. Its reuse permission covers provider metadata, classifications and corrections, **not copyright over original X author posts**.
- **Failures to test:** HTTP 400, 404, 429, 5xx, timeouts, stale captures, missing snapshots and malformed body. Return provider-unavailable/unknown, never a fabricated negative.
- **Live endpoint status:** **not verified**. This review could retrieve the current published developer contract, but the API URLs themselves were not available as inspectable JSON from the research fetcher; the developer page also says its current preview snapshot could not load. This does **not** establish that the endpoints are down for normal clients.

**Source links:** [API contract](https://whenresets.com/developers) · [Tibo endpoint](https://whenresets.com/api/v1/tibo) · [Archive endpoint](https://whenresets.com/api/v1/archive).

### A3. Decision: two independent sources

1. Keep ledger events and signals separately; they describe different things.
2. Do not sum counts from the providers.
3. If both mention an X post, link/deduplicate conservatively by its URL and event identities, retaining each provider's original verification fields.
4. Show source coverage and generated/checked timestamps; stale means **unknown**, not zero resets.
5. If .com fails, the UI can display a historical .net card **with an explicit statement that upcoming signals are unavailable**.
6. Neither provider is an authenticated view of the viewer's ChatGPT/Codex account or evidence their personal quota reset.

## B. OpenAI plugin host feasibility

**Confirmed in official docs, not yet end-to-end tested:**

- ChatGPT plugins use a remote MCP server; optional UI appears as an MCP Apps iframe.
- Prefer the standards-based `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps` implementation with a UI resource associated to a tool via `_meta.ui.resourceUri`.
- OpenAI MCP Extensions support a **conversation side-panel entrypoint**: `"openai/ui": { entrypoints: [{ type: "thread" }] }` attached to a tool's metadata.
- Distinguish `thread` (beside the current conversation) from `global` (full-screen app accessed via sidebar).
- Official quickstart flow: deploy/publicly expose HTTPS MCP endpoint; ChatGPT Plugins → Add custom MCP server → install personal plugin → invoke it in a new chat. Refresh plugin registration after server tool/metadata changes.
- The same **MCP tools** can work in Codex and ChatGPT; UI support in Codex is not guaranteed by these documents.
- User-level `thread` panel availability, behaviour in the current ChatGPT account, panel persistence when switching chats, and refresh calls while the panel is mounted are **unverified** until a personal smoke test runs.
- A cross-OS browser UI is plausible on supported ChatGPT hosts, but Windows/Mac compatibility remains a separate acceptance test.

**Official references:** [MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart) · [Add UI](https://developers.openai.com/plugins/build/chatgpt-ui) · [Plugin Extensions](https://developers.openai.com/plugins/build/extensions).

## C. Vercel feasibility

- Vercel officially documents remote Streamable HTTP MCP endpoints deployed as Vercel Functions using the `mcp-handler` package.
- The published Next.js route example exposes `GET`, `POST`, `DELETE` at `/api/mcp` and shows a local MCP Inspector smoke-test path.
- This validates a **supported architectural pattern only**, not a deployed working Reset Radar server.
- The user's GitHub repo exists and the Vercel Hobby account is connected to ChatGPT. The Vercel GitHub import search did not list the new repository at the earlier check; re-check repository installation permissions during Phase 4, not this research phase.
- No project, deployment, storage service or secrets have been created.

**Official reference:** [Deploy MCP servers to Vercel](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel).

## D. Runtime verification still required to exit Phase 0

These items deliberately remain unchecked; don't mark them complete from documentation alone.

- [ ] **Live JSON smoke test:** HTTP GET both `.net/ledger.json` and `.com/api/v1/tibo`, `.com/api/v1/archive`; capture status, content-type, top-level keys, schema versions, timestamps, CORS/cache headers and error responses. Use a **runtime with real outbound HTTP**; do not substitute the older GitHub JSON fixture for today's live data.
- [ ] **Source contract sample:** Save small anonymised/reusable payload fixtures without copying unnecessary long posts; validate `datetime_utc` vs `date_utc` and optional/null fields.
- [ ] **MCP transport smoke test:** Serve a temporary `ping` tool over Streamable HTTP, confirm a `tools/list` and `tools/call` round-trip with MCP Inspector; don't build the production UI.
- [ ] **Real conversation-panel test:** Register minimal MCP Apps UI with `thread` metadata, install as a personal custom ChatGPT plugin, and visually verify it actually opens beside a live conversation.
- [ ] **Document host matrix:** note whether the side panel works on the user's ChatGPT web/desktop build; leave Codex and Mac expansion for Phase 5.
- [ ] **Decide provider fallback:** if .com remains unavailable, explicitly authorise a history-only MVP with upcoming signal marked unavailable.

**Gate:** Phase 0 is **not complete** while the endpoint and host/runtime checks above remain unproven. The next action should be the smallest Phase 0 smoke test, not full app scaffolding, public submission or unsolicited feature expansion.

## E. Acceptance notes

- **Feasible on paper:** Yes. Official OpenAI and Vercel documentation align.
- **Source contract inspected:** Yes (GitHub historical fixture and .com current developer page).
- **Live data response validated:** No.
- **Transport tool tested:** No.
- **User's ChatGPT side panel verified:** No.
- **Production/public release readiness:** Not assessed.

If a later test contradicts a published data contract, update this report with the observed behaviour and date rather than silently coding around the discrepancy.

## F. Phase 0 continuation — runtime attempts and reusable MCP providers (15 October 2026)

### F1. Direct live source tests: blocked by execution environment, not proven service outage

Attempted HTTP GET requests to:

- `https://whenresets.net/ledger.json`
- `https://whenresets.com/api/v1/tibo`
- `https://whenresets.com/api/v1/archive`
- `https://whenresets.com/api/v1/status`

**Outcome:** the local isolated runtime failed at DNS resolution (`NameResolutionError` / `Temporary failure in name resolution`) for all tested public domains, including independent controls such as `registry.npmjs.org` and `api.github.com`. Web research returned pages for site and developer documentation but **did not return live JSON bodies or HTTP headers** for the API URLs (cache miss/inaccessible). Thus their **HTTP status, current JSON payload, CORS, freshness and cache headers remain unverified**. Do not describe these sources as offline or healthy based on these attempts.

The separately indexed `https://whenresets.net/` HTML page claims 64 recorded events and an observed event on 15 October 2026, but this **cannot be substituted for a fresh verified API response**.

### F2. Disposable local JSON-RPC/MCP-shaped transport check: PASS with caveat

Executed a disposable Node.js HTTP listener bound to **127.0.0.1** (ephemeral port) that implemented these minimal JSON-RPC method shapes, then called them from an independent Python HTTP client:

| Method | Result |
| --- | --- |
| `initialize` | HTTP 200; response advertises `protocolVersion: 2025-06-18` and `tools` capability |
| `tools/list` | HTTP 200; returns a read-only `phase0_ping` tool with an input schema |
| `tools/call` | HTTP 200; returns `pong` |
  
**Scope and limits:** Demonstrates local request/response plumbing and can inform our HTTP test cases. It was **not built with the MCP SDK**, was **not tested using MCP Inspector**, did **not use HTTPS**, did **not validate full transport compliance/session negotiation**, and was **not connected to ChatGPT**. The disposable script was kept outside the repository; no Vercel project or billable service was created. The full Phase 0 `MCP transport smoke test` gate remains open.

### F3. Existing remote MCPs: check before duplicating work

Additional research identified **two publicly documented, keyless, read-only remote Streamable HTTP MCP services**:

| Provider | Documented endpoint | Tools / role |
| --- | --- | --- |
| [TIBO](https://tibo.cc/guide/mcp) | `https://tibo.cc/mcp` | `get_current_status`, `get_latest_reset`, `get_reset_history` |
| [codex-reset.com](https://codex-reset.com/developers) | `https://codex-reset.com/mcp` | `get_reset_forecast`, `get_reset_timeline`, `get_codex_status` |

- **Not yet connected to either:** live `initialize`, `tools/list`, `tools/call` and the advertised tool metadata still require verification.
- Their developer docs describe **tool/data access**, not a provided MCP Apps UI resource plus an OpenAI `thread` entrypoint. **Do not assume a ready-made side panel exists.**
- These services could replace part of Reset Radar's data-adapter work, or be used as optional sources. A public, self-hostable **thin MCP/UI bridge** remains the likely minimum if we insist on our *own* conversation-side panel, because the bridge must serve our UI resource and attach the `thread` tool metadata.
- For an MCP intermediary, prefer comparing the cost/latency/reliability of calling upstream MCP tools versus their public **REST equivalents**. The simpler REST path may avoid protocol translation, but always follow attribution and request-rate terms. `codex-reset.com` requests provider credit and a caller-identifying User-Agent, and asks API consumers not to poll faster than once per minute. `tibo.cc` documents rate limits and a stale-cache policy.
- Neither source is official OpenAI account telemetry. A forecast is not a reset guarantee.
- Don't silently replace the two originally shortlisted providers; assess source overlap, licences, verification fields, freshness and fallback behaviour first.

**Design decision:** Minimise *our* hosted MCP to presentation/normalisation and read-only access; don't rebuild scraping, history collection or forecasts already available elsewhere. Keep hosted and self-hosted URL configuration independent.

### F4. ChatGPT panel and latest handler support confirmed from docs, not host tested

- [OpenAI Plugin Extensions](https://developers.openai.com/plugins/build/extensions) documents `"openai/ui": { "entrypoints": [{"type":"thread"}] }` in tool metadata for conversation panels (with an attached UI resource).
- [OpenAI MCP server/UI quickstart](https://developers.openai.com/plugins/build/app-quickstart) documents custom-plugin setup; the user must take the installation action in their own ChatGPT UI. **No such installation or side-panel rendering has happened yet.**
- [Vercel mcp-handler 2.0 changelog, 30 July 2026](https://vercel.com/changelog/latest-mcp-spec-now-supported-in-mcp-handler) supports MCP spec 2026-07-28, with backward compatibility for 2025 Streamable HTTP clients. Check actual compatible runtime and SDK versions at bootstrap; don't blindly pin an older example.

### F5. Revised outstanding Phase 0 gate

- [x] Verify that OpenAI documents the `thread` panel surface and Vercel documents MCP hosting.
- [x] Research existing publicly documented read-only reset MCP servers (without claiming they were executed).
- [x] Run a **local minimal JSON-RPC-shaped** round-trip as a protocol-plumbing sanity check only.
- [ ] Execute live HTTP GETs from a network-enabled environment and save redacted API response metadata/fixtures for all selected sources.
- [ ] Perform a compliant Streamable HTTP `initialize` / `tools/list` / `tools/call` round-trip using the official SDK/Inspector against a real endpoint (prefer testing one existing source first).
- [ ] Determine whether any existing MCP advertises an MCP Apps `ui.resourceUri` and OpenAI `thread` metadata; do not infer from marketing docs.
- [ ] Create/test a **temporary** UI/host smoke-test plugin (only as required) and have the user install it explicitly to verify the conversation panel in their ChatGPT account. This step does not authorise public submission.
- [ ] Document observed results and decide the minimum data-adapter/bridge responsibilities.

**Phase 0 status: STILL OPEN.** A local toy protocol check and documentation lookup do not satisfy the live-host acceptance gate. No MVP scaffolding, Vercel deployment, public release or plugin installation has occurred.



## G. Phase 0 verified live tests from user-run Codex (15 October 2026 AEDT)

> **Evidence provenance:** The project owner ran the Phase 0 test prompt in Codex on Windows and supplied the full output for review on 15 October 2026. These are **reported results from the user’s external, network-enabled test**, not HTTP responses independently fetched in this ChatGPT runtime. The detailed raw terminal trace was not included, so values below are not independently replayed here. This section supersedes earlier environment-blocked *research attempts* in F1/F2/F5, while preserving them as an audit trail. No code, deployment or existing repository files were changed by Codex.

### G1. Test environment and successful remote MCP calls

- Windows build 26200; Python 3.11.15; **official MCP Python SDK 1.28.1**; HTTPX 0.28.1; TLS certificate verification enabled; identifying User-Agent; bounded timeouts.
- \`https://tibo.cc/mcp\`: TLS and official SDK **PASS**. Initialised as server \`TIBO\` v1.6.7; negotiated MCP protocol \`2025-11-25\`. \`tools/list\` advertised \`get_current_status\`, \`get_latest_reset\`, \`get_reset_history\`. Calls to status and latest reset passed. At test time status included \`scheduled_reset=null\`, \`active_watch=null\`, \`stale=false\`, \`upstream_status=ok\`, source links and explicit cache/fetch timestamps.
- \`https://codex-reset.com/mcp\`: TLS and official SDK **PASS**. Initialised as \`codex-reset\` v1.0.0; negotiated \`2025-06-18\`. Tools: \`get_reset_forecast\`, \`get_reset_timeline\`, \`get_codex_status\`. Calls to forecast and two-event timeline passed. Forecast was explicitly experimental, confidence low, and **not** a confirmed announcement.
- Both returned HTTP 200 for MCP call flows and accepted the initialised notification with HTTP 202. Neither required login in the tested read-only flows.
- **MCP UI metadata:** Neither server advertised a UI resource in its inspected tool metadata, an \`openai/ui\` entrypoint, or a \`thread\` panel. TIBO returned empty resource and template lists; codex-reset.com did not implement resource methods. The standard SDK probe does not rule out conditional metadata for a different client, but no existing panel was demonstrated.
- Tested integrations were **third-party server clients**, not our own MCP server and not a ChatGPT-side panel.

### G2. REST endpoint results (user-run Codex, approximately 22:18–22:21 AEDT)

| Endpoint | Observed response | What it means for Reset Radar |
| --- | --- | --- |
| \`https://whenresets.net/ledger.json\` | **200 JSON**; \`schema=whenresets.ledger/1\`; 67 rows (64 resets, 3 policy notes); \`Cache-Control: public,max-age=300\`; wildcard CORS | Historical fallback. Four rows lacked original source URLs. The newest \`datetime_utc\` is a **monitoring observation**, and the reported \`generated_at\` is date-level, not a precise refresh clock. |
| \`https://whenresets.com/api/v1/tibo\` | **404 HTML** | **Exclude from default live-signal integration.** Do not parse the error page as JSON. |
| \`https://whenresets.com/api/v1/archive\` | **200 JSON**; \`archive-v1\`; 92 rows | Contract/quality issues: static \`wr-snapshot-live\` snapshot id while generated timestamp changes, missing claimed evidence, repeated source URLs/actions, and at least one evidently misclassified release notice. Not a trustworthy default. |
| \`https://whenresets.com/api/v1/status\` | **200 JSON** (legacy structure) | Missing documented \`source_signals\` and \`signal_source\`; not a usable signal fallback as specified. |
| \`https://tibo.cc/api/v1/status\` | **200 JSON** | **Preferred status source**, with freshness, upstream status and source/announcement distinctions. |
| \`https://codex-reset.com/api/feed\` | **200 JSON** | **Preferred announcement-context source**, with captured posts and current/inactive signals; provider attribution required. |
| \`https://codex-reset.com/api/timeline\` | **200 JSON** | Optional history/cross-check; includes pending records that must not count as executed resets. |

Additional observed headers: codex-reset.com REST published \`max-age=60\` and source-check timestamps; .net ledger \`max-age=300\`; .com archive/status \`max-age=30\`/15 seconds with stale-while-revalidate. None of these short tests proves long-term reliability or completeness.

### G3. Important timestamp and semantics discrepancy

For an apparent 15 October event, the provider snapshots represented at least four distinct events/times:

| Provider | UTC timestamp | Meaning in that source |
| --- | --- | --- |
| whenresets.com archive | \`04:55:51\` | Initial announcement post labelled as effective, without independent evidence |
| whenresets.net ledger | \`06:13:01\` | Monitoring observation |
| codex-reset.com timeline | \`06:13:01\` | Monitoring arrival, misleadingly named \`announced_at\` |
| tibo.cc status | \`06:28:13\` | Completion-post publication |

**Decision:** Never take \`effective_at\` or \`announced_at\` field names alone as proof of an exact universal reset time. Preserve each provider's observation type and original source link. We can report “observed around” or “completion post at” with explicit labels; do not merge these into a fabricated exact timestamp.

### G4. Architecture decision (approved for subsequent implementation)

- **Select Option B:** A very small, independently self-hostable **MCP/UI bridge** with configurable public origin. It owns our MCP Apps UI resource, \`thread\` metadata, status normalisation, bounded tools and display of attribution/freshness/uncertainty.
- **Do not build collectors, scrapers, storage, a forecast algorithm, user accounts or a separate polling daemon for MVP.**
- **Prefer upstream REST** from the bridge over calling their existing MCP servers: fewer protocol round-trips, less parsing, simple caching.
- Source priority: \`tibo.cc/api/v1/status\` for status; \`codex-reset.com/api/feed\` for announcement context; \`whenresets.net/ledger.json\` for historical fallback. Optional \`codex-reset.com/api/timeline\` only when justified.
- \`whenresets.com\` is **excluded from v0.1 default path** unless independently revalidated later, not claimed permanently broken.
- Upstream dependencies are not guarantees. Maintain a truthful *unknown/stale* state when source coverage is absent or endpoints fail.
- Respect provider-specific polling requirements, credit and any eventual fair-use restrictions. Current sources depend on other trackers, so do not claim independent official verification.
- Both tested upstream MCPs lack the desired custom UI, so **a UI-owning bridge is still required** for our chosen user experience. Vercel is convenient, not a protocol requirement.
- Continue the prior decision: official hosted plugin and self-hosted open-source variant share the same code, with no built-in dependency on the maintainer's hosted MCP endpoint.

### G5. Phase boundary recommendation

This testing **completes the data-source and existing-remote-MCP feasibility investigation**. Remaining tasks that require us to **write, deploy and install a new MCP Apps UI** are implementation/integration verification, not a reason to keep researching indefinitely.

**Research/architecture gate can close** based on the user-run MCP SDK and REST results, with these declared deferred risks:
- New Reset Radar MCP endpoint has **not** been written or proven with the official SDK.
- Real ChatGPT \`thread\` panel has **not** been rendered in the user's account; compatibility and persistence are unknown.
- Fault injection, throttling/429, full provider completeness, error-state UI and Windows/Mac/Codex host support still need implementation-stage testing.

These become explicit **Phase 2, Phase 3, Phase 4 and Phase 5 acceptance gates**, not claims of completed functionality.

**Phase 0 verdict:** **COMPLETE FOR FEASIBILITY AND PROVIDER SELECTION**; actual app and host functionality remains **UNVERIFIED**, by design. If implementation-stage smoke testing reveals the target host lacks the \`thread\` extension, pause the panel feature and document the tool-only fallback.
