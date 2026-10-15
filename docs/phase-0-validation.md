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
