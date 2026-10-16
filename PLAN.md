# Reset Radar — Project Plan

> **Status:** Step 2.5 reliability testing complete; production smoke test owner-accepted · **Last reviewed:** 17 October 2026  
> **Repository:** https://github.com/mustafa-ramax/reset-radar  
> **Target:** Read-only reset data in both ChatGPT conversation panel and left-sidebar app; public plugin later.  
> **Principle:** Ship an accurate, lightweight read-only radar before adding features.

## Early integration milestone — Hello World verified (15–16 October 2026)

**Status: PASSED for the owner's tested ChatGPT hosts.** We deliberately built a disposable minimal MCP Apps Hello World first, rather than developing the radar and hoping ChatGPT could place it correctly.

- **Repository and deployment:** public GitHub `mustafa-ramax/reset-radar` is linked to Vercel; the deployment at `https://reset-radar-eight.vercel.app/api/mcp` passed a production build and an actual read-only `show_reset_radar_hello` MCP call.
- **Working entrypoints:** `thread` rendered in a real conversation-side panel; `global` displayed in the left sidebar as a dedicated app; model-invoked calls rendered inline. The owner also reported these working in their tested ChatGPT desktop/web, Work and Codex interfaces. This records **owner-confirmed user-visible behaviour**, not an independent automated cross-platform certification.
- **Important discovery:** invoking the MCP tool from chat renders *inline*; opening the content tab via More tools accesses the `thread` panel. The `global` entry is accessed through the left sidebar. A screenshot-backed owner test established both surfaces.
- **Build regression and recovery:** adding an optional SVG icon coincided with a Vercel TypeScript/lint build failure. We removed it on a feature branch, confirmed the preview build, and merged [PR #1](https://github.com/mustafa-ramax/reset-radar/pull/1) after Vercel reported READY for preview and production.
- **Scope of this success (as of the original smoke test):** static Hello World resource and tool. The subsequent live TIBO tool was tested successfully on 16 October, as documented immediately below. No full provider-coverage certification, history, public directory submission or personal quota monitoring is implied.

**Step 1 complete; see live tool validation immediately below.** The first independent data tool was implemented without changing the original Hello World UI. Only TIBO was integrated.

## Step 1 result — first live TIBO status tool verified (16 October 2026)

**PASSED:** The personal Reset Radar plugin invoked `get_tibo_status({})` after deploying [PR #2](https://github.com/mustafa-ramax/reset-radar/pull/2). The host returned structured JSON with `provider: "TIBO"`, `state: "available"`, `upstreamStatus: "ok"`, a latest source-recorded completion post, source link, freshness timestamps, and no pending announcement in the returned snapshot. The response included a disclaimer about third-party community observations and personal-account limits.

**Observed test snapshot, not a permanent fact:** checked `2026-10-16T10:51:35.822Z`; provider fetched `2026-10-16T10:49:00.752759+00:00`; latest completion post published `2026-10-15T06:28:13.000Z`, with [original evidence](https://x.com/thsottiaux/status/2110618732666257557). `scheduled_reset=null` did not prove complete future coverage. The `activeWatchPresent=true` field was returned but did not establish a verified future reset.

**Validated:** live remote MCP tool call, normal-case public API response, state/freshness fields, original source URL and working production deployment. **Not yet validated:** actual failure injection, 429 and offline recovery, repeated refresh in a rendered dashboard, complete upstream announcement coverage, cross-provider reconciliation or any personal quota changes.

**Step 2 scope (delivered):** replace the static Hello World UI with a responsive compact TIBO dashboard, retaining both `thread` and `global` entrypoints and the existing `get_tibo_status` tool. Use MCP Apps host bridge for one initial read and manual refresh, show last-recorded post, pending-announcement unknown/none-returned semantics, stale/unavailable states, provider timestamp and attribution. Do not add another data source, database, push alerts, background polling, user telemetry or personal-quota claims. A successful Vercel build is a gate, and user-visible host rendering is a **separate** acceptance gate.

## Step 2 result — dashboard owner-accepted (16 October 2026)

**PASSED (owner-confirmed):** [PR #3](https://github.com/mustafa-ramax/reset-radar/pull/3) was merged and deployed. The TIBO dashboard rendered successfully in ChatGPT's left sidebar (`global`), conversation-side panel (`thread`), and inline tool view. The owner tested the Refresh button and the original X source-post links; both worked. This is owner-verified user-visible acceptance, not automated cross-host certification.

**Step 2.5 result — reliability gate PASSED (17 October 2026):** [PR #4](https://github.com/mustafa-ramax/reset-radar/pull/4) was squash-merged to `main` (commit `5752d43`). Ten automated tests cover normal TIBO responses, mocked outages/timeouts, HTTP 503/429, malformed responses, stale data, recovery, and preservation of MCP tool names and `thread`/`global` declarations. Two confirmed adapter issues were fixed: empty objects no longer count as reset announcements, and source snapshots with missing or more-than-one-hour-old `fetched_at` are stale. Vercel's final preview and production deployments reached READY; the production `get_tibo_status` and dashboard-opening tools returned valid responses. **Owner-confirmed production smoke test:** left sidebar (`global`), right conversation panel (`thread`), inline rendering, Refresh, and original X post link all working. Scope stayed TIBO-only, with no UI redesign or new infrastructure. These are deterministic failure-injection tests and owner-observed host behaviours, not independent verification of a real upstream outage or certification across all hosts.

**Deferred UI feedback (not Step 2.5):** Slightly more top spacing and a substantially quieter, more minimal dashboard. Discuss visual changes separately; don't implement them during reliability work.

## Step 4A — dashboard styling merged (17/10/2026)

[PR #6](https://github.com/mustafa-ramax/reset-radar/pull/6) delivered a quieter dashboard, additional top spacing, host theme colours and typography, a small geometric radar icon with reusable SVG/PNG assets, and Reset Radar user-facing naming. Includes the owner's `.vscode/settings.json` unchanged. Existing MCP identifiers, resource URI, `thread`/`global` entrypoints, provider logic, Refresh and reliability semantics are preserved.

Local checks passed: all 10 existing tests, typecheck, production build and self-contained widget validation. A browser fixture review covered light/dark themes, 280/360/640px widths, loading, available, pending, empty, stale, unavailable, Refresh-in-flight/recovery, keyboard focus and the source-link bridge. Temporary fixture images and the review README were removed after review. No new tests, packages or infrastructure were added.

The owner accepted the styling, and PR #6 is merged. [Issue #7](https://github.com/mustafa-ramax/reset-radar/issues/7) defines the separate Step 4B information-hierarchy follow-up. Website/widget SVG integration does not imply support for MCP app icon metadata. Public directory publication remains out of scope.

## Step 4B — minimalist information hierarchy (17/10/2026; acceptance pending)

Implements [Issue #7](https://github.com/mustafa-ramax/reset-radar/issues/7): upcoming reports first, latest reported post second, a subtle source-update footer and a native collapsed **Source details** disclosure. Uses the existing small radar mark and one understated upcoming surface, with greater emphasis when an announcement is reported. Meaningful latest-post labels stay visible: `recorded` becomes **Recorded post**, `completion` becomes **Completion post reported**, and other types use **Reset-related post reported**. Removes the subtitle, repeated cards, healthy-source badge and default diagnostics. Excerpts, full absolute source/check timestamps, upstream health and one complete attribution/disclaimer are in Details; active-watch information remains in the API only.

Post timestamps are labelled as publication/observation evidence, not reset execution. Footer freshness uses `providerFetchedAt`, never `checkedAt`. A concise stale/unavailable warning sits alongside the affected upcoming status; the full provider explanation is in Details. Stale historical posts retain their report label plus an explicit historical-evidence note, and unavailable responses clear report content and links. Optional display fields are validated so partial or malformed host results do not crash rendering. Provider logic, caching, tool names, resource URI, entrypoints, safe-link handling and Refresh calls are unchanged. No dependencies, timers, storage or infrastructure were added. Production icons and owner settings are unchanged.

Local validation passed: all 10 existing tests, typecheck, production build and self-contained CSS/JS verification. Temporary fixtures exercised available/pending/empty/partial/invalid/stale/unavailable/loading states, missing timestamps, unsafe links, Refresh in flight and error recovery. Browser checks covered both themes at 280/360/640px, expanded disclosure with long text, keyboard focus and 200% text scaling with no horizontal overflow or nested scrolling. Disclosure state survived Refresh and theme changes; repeated activation during Refresh made no duplicate call. Screenshots and the fixture harness remain outside the repository.

Vercel preview status and any access limitations are recorded in the PR. Real ChatGPT sidebar, right-panel and inline acceptance remain the owner's separate gate. Do not merge this follow-up until approved.

## 1. Product goal

Build an open-source **Reset Radar** that displays publicly reported ChatGPT/Codex usage-limit reset announcements and recorded resets **beside an active ChatGPT conversation**.

The radar should let someone glance at:
- The latest credible Tibo announcement (with a link to the original post).
- Whether that announcement is an upcoming plan, a hint, expired, or associated with a subsequently recorded reset.
- The latest *recorded* reset, source, time and verification/coverage context.
- When each provider last checked its sources and whether the displayed information may be stale.

**This is not a personal quota monitor.** An announcement or a third-party recorded event must never be presented as proof that the current user's limits have changed, that every plan is included, or that a future reset will happen.

### Success criteria

A private MCP plugin displays a usable panel in a real ChatGPT conversation, loads current public data without a user account, handles missing or contradictory information honestly, and works in at least one supported ChatGPT host. No paid services or background monitoring are needed for MVP.

## Phase 0 research and validation (15 October 2026)

**Outcome: COMPLETE for research and architecture selection, based on the owner's live Codex tests.** The [Phase 0 validation report](docs/phase-0-validation.md#g-phase-0-verified-live-tests-from-user-run-codex-15-october-2026-aedt) records successful official-SDK connections to two existing remote MCP services and HTTP tests of the intended JSON providers. The legacy whenresets.com signal path failed and is excluded from the default MVP. The upstream services do not advertise the custom UI panel, so we will build a **thin MCP/UI bridge** using existing REST data. **At that research date**, our new endpoint and host rendering were not tested; those integration gates were subsequently exercised in the 15–16 October Hello World smoke test documented below.

### Verification boundary

Live results were **reported by the owner's Codex test run** rather than fetched directly in this ChatGPT execution environment. Previous isolated-environment DNS failures and preliminary protocol checks remain documented as historical attempts. Existing upstream MCP clients completed a real SDK round-trip. **Subsequent integration supersedes this historical limitation:** our own hosted MCP endpoint and ChatGPT `thread`/`global` Hello World rendering were owner-verified. The live TIBO status MCP tool was called successfully on 16 October.

### Early integration smoke test (15 October 2026)

To reduce product risk, we started a **minimal Hello World panel test before the data/dashboard work**. One static `ui://reset-radar/hello.html` resource and a read-only `show_reset_radar_hello` tool are committed. A Vercel deployment of the GitHub `main` branch reached `READY` (project `reset-radar`; test MCP URL `https://reset-radar-eight.vercel.app/api/mcp`). **No upstream reset API calls exist in this build.**

**Historical status as of initial smoke-test deployment:** runtime host checks were pending at that moment. They were subsequently owner-verified and the first live data tool was invoked successfully. Do not confuse an old checkpoint with current project status.

## 2. Starting position (15 October 2026)

- [x] Public GitHub repository created: `mustafa-ramax/reset-radar`.
- [x] GitHub and Vercel connectors are available.
- [x] Vercel Hobby account identified.
- [x] Upstream MCP services and source REST data tested by owner's Codex (see Phase 0 report); our own app remains unbuilt.
- [ ] Initial code, README, licence and tests added.
- [ ] Vercel project linked to GitHub (repo not currently visible to Vercel Git import).
- [ ] Personal MCP plugin installed and conversation-side panel verified.
- [ ] macOS, Windows and Codex host behaviour tested.

**Current decision:** Keep the repository public and development deployments personal. Public source code does **not** mean the plugin has been published in the Plugins Directory.

## 3. MVP scope

### Must have (v0.1)

1. **Conversation panel:** A compact, dark/light-theme aware MCP Apps UI with the OpenAI `thread` entrypoint where supported.
2. **Latest reset:** Show the newest recorded reset with timestamp, confidence/verification label, original evidence link and provider attribution.
3. **Tibo signal:** Show a separate announcement card with source link and accurate classification (e.g. explicit plan, hint, policy change). Never turn a hint into a confirmed upcoming reset.
4. **Honest state model:** Distinguish *upcoming announced*, *hint only*, *recorded*, *no record with complete coverage*, *unknown/stale*, and *provider unavailable*.
5. **Freshness:** Show last checked/last updated; manual refresh plus conservative auto-refresh while the panel is open (initial target: every 10–15 minutes, subject to host support and upstream freshness).
6. **Timezone:** Display in the viewer's IANA timezone when available, with a UTC fallback. Test `Australia/Sydney` and daylight-saving changes.
7. **Read-only MCP tools:** At least `get_reset_radar` (summary/status) and `get_reset_history` (bounded history), with structured, traceable outputs.
8. **Attribution:** Link to data providers and primary source posts; clearly state that Reset Radar is unofficial and unaffiliated with OpenAI.

### Explicitly not in v0.1

- Logging into ChatGPT/Codex, reading account usage or claiming a personal limit reset.
- Scraping X directly or storing personal X credentials.
- Push notifications, email alerts, always-on server-side polling or background tasks.
- Forecasting the next reset based on historical hour-of-day patterns.
- User accounts, database, analytics/telemetry, monetisation or subscriptions.
- A native Windows/macOS desktop widget or an always-visible left-navigation mini-widget.
- Public plugin listing before we validate the product.

## 4. Data strategy and safety rules

Selected v0.1 sources, based on live tests by the owner's Codex:

| Provider | Intended purpose | Integration caveat |
| --- | --- | --- |
| [tibo.cc/api/v1/status](https://tibo.cc/api/v1/status) | Primary status card | Rich stale/fetch/upstream metadata; it relays other tracker data, not personal-account telemetry. |
| [codex-reset.com/api/feed](https://codex-reset.com/api/feed) | Captured Tibo announcements | Distinguish current from inactive hints and posts; require attribution. Never treat experimental forecasts as confirmed signals. |
| [whenresets.net/ledger.json](https://whenresets.net/ledger.json) | Recorded reset history/fallback | Historical feed has some missing original links and ambiguous timestamp meanings; its [source repo](https://github.com/kosanhu2021-source/codex-reset-ledger) is MIT-licensed. |

**Not selected for the default integration:** [whenresets.com](https://whenresets.com/developers). Its documented `/api/v1/tibo` returned 404 HTML, `/api/v1/status` lacked advertised signal fields, and `/api/v1/archive` had contract/classification issues in the 15 October test. Reconsider only after revalidation. The similarly spelled `codex-resets.com` (a different upstream mentioned by TIBO) is **not** the same domain as `codex-reset.com`.

### Contract validation is mandatory (first technical gate)

- Confirm HTTP availability, schema, required fields, rate limits, terms, cache guidance and attribution for each endpoint.
- Record real samples as sanitised test fixtures and validate responses with runtime schemas (e.g. Zod).
- Preserve `source_url`, event IDs, publication/effective timestamps, provider name, coverage/verification metadata and relevant snapshot IDs.
- Deduplicate by stable ID/source post **within a provider**. Do not sum or coalesce event counts across providers without a documented mapping.
- Treat signals separately from executed/recorded resets. A post saying “tomorrow” is **not** an exact-time guarantee.
- Do not invent `effective_at`, affected plans, global scope, or a missing time of day. If the source gives only a date, show only the date.
- Source errors, empty signals with stale coverage, and slow updates must result in **unknown/unavailable**, not “no reset”.
- Use server-side fetch with bounded timeouts, short caching, retry/backoff for transient failures and respectful request rates. No external API keys should be necessary for public reads.
- Show provider attribution and link to underlying evidence. Respect TIBO and Codex Reset's usage/attribution guidance; retain original post/source links. Do not claim the MIT licence over the .net dataset grants rights to third-party post text.
- Preserve distinct **post published**, **monitoring observed**, and **completion post** time semantics: providers disagreed about the exact 15 October event time. Avoid inventing a universal `effective_at`.

### Normalised internal model (conceptual)

`RadarSnapshot`:
- `status`: `announced | hint | recorded | none_confirmed | unknown`.
- `latestSignal?`: kind, originalPostUrl, publishedAt, optional expiry, text excerpt, source/coverage health.
- `latestReset?`: type, recordedAt/effectiveAt when known, verification, affectedPlans when known, sourceUrl.
- `providers[]`: name, checkedAt, freshness, error/coverage status and link.
- `generatedAt`: time the aggregation was produced (never presented as a reset timestamp).

Allow independent failure: when one provider is down, keep the valid other provider visible with a clear warning.

## 5. Proposed architecture

```text
ChatGPT conversation side panel
    └─ MCP Apps UI (React + TypeScript; responsive, accessible)
        └─ Read-only MCP tools / HTTP
            └─ Next.js + Vercel Functions (Streamable HTTP MCP endpoint)
                └─ Source adapters
                    ├─ tibo.cc status REST
                    ├─ codex-reset.com feed REST
                    └─ whenresets.net ledger JSON (history)
```

- **Frontend:** React + TypeScript UI hosted as an MCP Apps resource; use the standard MCP Apps bridge and OpenAI MCP Extensions for the optional `thread` entrypoint.
- **Backend:** Small TypeScript MCP server deployed on Vercel; use the current official MCP/Vercel patterns (including `mcp-handler` if compatible).
- **Hosting:** One Vercel project, HTTPS endpoint, GitHub automatic deployments once linked.
- **Storage:** None for MVP; provider APIs and short-lived server cache only.
- **Authentication:** No sign-in for read-only public data in MVP. Reassess abuse protection and submission requirements before public release.
- **Compatibility:** Browser-based UI should be OS-independent **in a supported ChatGPT host**. Codex may consume the MCP tools without rendering the ChatGPT conversation panel. Do not promise identical UIs across hosts.

Prefer simple SDK-compatible code over inventing framework abstractions. Confirm exact SDK versions and host support during implementation.

### Deployment and distribution model (architectural requirement)

Reset Radar supports two distinct distributions using **the same open-source codebase**:

1. **Official hosted plugin:** The maintainer runs one production MCP service, registers that HTTPS endpoint with ChatGPT and (after approval) publishes it in the plugin directory. All installs of that official listing use the maintainer's hosted service and consume its quota/bandwidth. The production URL is **public/discoverable**, not a secret.
2. **Self-hosted plugin:** Anyone can fork/clone the public repository, configure **their own** MCP origin and deploy to a Vercel account or another compatible HTTP host; their ChatGPT custom-plugin registration connects to their own endpoint. Self-hosting must not call or depend on the maintainer's MCP by default.

**Portability requirements:**
- Do **not** hardcode the maintainer's personal or production Vercel URL in reusable source, sample config, test fixtures or default values. Configure the public server origin via deployment environment/config (e.g. `MCP_PUBLIC_BASE_URL`, naming to be finalised in Phase 1); use documented placeholder origins in examples.
- The eventual **official plugin submission** necessarily specifies the real production MCP URL. Treat this as public operational configuration, not a secret; keep it isolated from the reusable self-host setup, and use a stable endpoint before submission.
- Document both official-install and self-host setup paths. A cloned installation should have no calls to the official MCP endpoint unless the developer explicitly chooses that endpoint.
- Don't accidentally expose secrets: use managed environment variables where needed; commit only safe examples. No user accounts or secret tokens are expected for the initial public-data adapter.

**Cost and abuse requirements:**
- **MVP constraint: no unbounded maintainer hosting costs.** Start with Vercel Hobby for non-commercial personal testing, track use and reassess its current quotas/terms before a public launch; don't rely on a billing claim without checking the active plan.
- Add conservative caching of upstream data, request timeouts, bounded payloads and rate limits/abuse protection before the public listing. Cache in a way that shares responses across clients where feasible rather than fetching both providers for every widget refresh.
- Prefer manual refresh plus an initially slow polling interval; expose data freshness so caching isn't misleading. Re-evaluate interval only after measuring traffic.
- Keep a clear maintenance/off switch or safe failure mode if quotas or upstream sources become unreliable; do not silently move to a paid tier.
- Before submitting publicly, estimate realistic load, set alerts/usage limits where the platform supports them, and explicitly decide who will fund the official hosted endpoint if the audience grows.

**Important trade-off:** Open sourcing alone does not cause traffic to hit the maintainer's service. Installing the **official hosted plugin** does. Endpoint configurability enables independent self-hosting but does **not** shield a public official endpoint from traffic.

## 6. Phases, tasks and acceptance gates

### Phase 0 — Verify source and MCP/UI feasibility (research complete)

- [x] Inspect live JSON REST providers and their published contracts, licensing/attribution considerations, schemas and headers via the owner's network-enabled Codex.
- [x] Connect to `tibo.cc/mcp` and `codex-reset.com/mcp` with an official MCP SDK; inspect tools, metadata and returned data.
- [x] Establish that neither inspected existing MCP advertises the required UI resource or `thread` entrypoint. Confirm OpenAI documents that entrypoint and Vercel supports remote MCP hosting.
- [x] Choose an initial provider priority and document safe unknown, stale, announcement and timestamp semantics.
- [x] Decide to use a minimal MCP/UI bridge with upstream REST, rather than build a data collection backend.

**Exit gate: PASSED for research/feasibility.** Based on user-run 15 October tests; see [validated findings](docs/phase-0-validation.md#g-phase-0-verified-live-tests-from-user-run-codex-15-october-2026-aedt). **Our own HTTPS MCP endpoint** and real `thread`/`global` UI rendering were subsequently tested in the early integration smoke test below. The **live data adapter** and its error handling remain unverified.

### Phase 1 — Repository bootstrap

- [ ] Add `README.md` (purpose, current limitations, setup, screenshots later), including a self-hosting path and an explicit endpoint-config placeholder.
- [ ] Add `LICENSE` (MIT), `.gitignore`, `.env.example` only if necessary.
- [ ] Scaffold minimal TypeScript app, scripts, formatting, lint/typecheck and tests; keep the MCP base URL configurable rather than hardcoding the maintainer's hostname.
- [ ] Add a small architecture/data-contract note and contribution guidance when useful.
- [ ] Keep commits focused, and do not introduce unnecessary services.

**Exit gate:** A fresh clone can install dependencies, run checks and start the app with documented commands.

### Phase 2 — Data adapters and MCP tools

- [ ] Fetch and runtime-validate TIBO status, Codex Reset feed, and .net ledger history against samples recorded during Phase 0.
- [ ] Map source freshness/coverage semantics; do not assume a null announcement indicates complete monitoring. Keep archive/signal fallback explicit.
- [ ] Normalise events and avoid double counting.
- [ ] Implement cache, timeout, error and stale-data handling.
- [ ] Implement `get_reset_radar` and bounded `get_reset_history`, with independently runnable HTTPS Streamable HTTP MCP tool calls tested using official SDK/Inspector.
- [ ] Add fixture-based tests for historical timestamps, duplicate announcements, unknown time, provider outage, HTTP 429, and incomplete coverage.

**Exit gate:** MCP Inspector returns traceable, accurate values and passes failure-case tests.

### Phase 3 — Conversation panel UI

- [ ] Build a compact Reset Radar view: status, latest signal, last recorded reset, provider freshness and original-post links.
- [ ] Use an OpenAI `thread` entrypoint and the official MCP Apps host bridge.
- [ ] Add loading, partial-data, stale, empty and offline states.
- [ ] Add manual refresh; trial auto-refresh every 10–15 minutes *only while mounted*, if supported; do not fetch upstream per-user on every refresh when server caching can reuse a snapshot.
- [ ] Support small panel widths, keyboard navigation, readable contrast and theme changes.
- [ ] Use locale-aware time formatting, with UTC fallback.

**Exit gate:** A person can understand whether a reset is merely suggested, announced or recorded within seconds; no unsupported certainty appears.

### Phase 4 — Personal Vercel deployment & ChatGPT integration

- [x] Resolve Vercel GitHub installation/repository access for `reset-radar` (smoke-test project linked and deployed).
- [x] Link the public repo to the user's Vercel project for the **temporary Hello World smoke test**; production-grade origin configuration still pending.
- [x] Deploy and verify HTTPS + read-only Hello World MCP tool call (**smoke test only**, not live radar).
- [x] Install as **personal custom MCP plugin**, without submitting to the public directory.
- [x] Invoke the Hello World plugin and **owner-verify real `thread` panel, `global` left-sidebar app, and inline widget** on the reported tested interfaces. Live radar remains pending.
- [x] Owner-validate live dashboard source links and manual Refresh in tested ChatGPT hosts (Step 2 acceptance, 16 October 2026).
- [x] Validate mocked failure/response paths in Step 2.5 and owner-confirm production dashboard smoke test (17 October 2026). Additional untested hosts remain outside this acceptance.

**Exit gate:** The radar is usable from a real ChatGPT chat and remains read-only. Record the deployed URL only after confirmed deployment.

### Phase 5 — Cross-platform and usability testing

- [ ] ChatGPT on Windows: conversation panel and reload behaviour.
- [ ] ChatGPT on macOS (desktop/web where supported): same scenarios.
- [ ] Codex desktop on Windows/macOS: test MCP tool availability and document whether a visual panel is actually supported.
- [ ] Test timezone/DST, mobile/narrow view if applicable, refresh after idle, and network failures.
- [ ] Run the MVP privately through several real reset/signal cycles before deciding whether alerts are needed.

**Exit gate:** Publish an honest compatibility matrix in README, including known unsupported surfaces.

### Phase 6 — Public open-source and plugin release (only after MVP proves useful)

- [ ] Polish public README, screenshots, changelog, contributor docs and MIT attribution notices.
- [ ] Confirm provider licensing and attribution for a public redistribution/use case.
- [ ] Verify scaling, cost, limits, caching, abuse prevention, usage visibility and a safe shutdown option; don't open the official endpoint to unbounded public traffic by accident.
- [ ] Verify both distribution paths: official install uses the maintainer's published endpoint; self-host installation uses only its operator-configured endpoint.
- [ ] Add website, support page, privacy policy and terms as required for remote MCP submissions.
- [ ] Complete developer identity verification and hosting/domain verification.
- [ ] Package `plugin.json` and `mcp.json` with the correct publicly reachable MCP URL.
- [ ] Prepare required review demo, five positive cases and three negative cases.
- [ ] Resolve directory validation, policy and security findings; submit for review.
- [ ] Publish **only after approval** and check the public listing/installation flow.

**Exit gate:** Approved directory listing with documented capabilities and a stable production endpoint. Approval is not guaranteed.

## 7. Testing checklist

- [ ] Correct latest completed/recorded reset; no invented times or affected plans.
- [ ] Distinguish an explicit announcement from a vague hint or product teaser.
- [ ] Old or expired announcements are not silently displayed as current upcoming resets.
- [ ] Outages/429/bad JSON/stale provider show warning rather than falsely “nothing upcoming”.
- [ ] Same X post appearing via multiple providers is not double counted.
- [ ] Historical clock time remains correct across UTC/AEDT/AEST transitions.
- [ ] UI remains useful with only one provider available.
- [ ] Requests avoid excessive polling; no personal data is collected or transmitted intentionally.
- [ ] Links are safe and point to the cited provider/original source.
- [ ] MCP server works independently of UI for Codex/tool-only clients.
- [ ] Self-hosted clone points exclusively at its configured origin, never silently at the maintainer's hosted endpoint.
- [ ] Conservative polling, cache and request throttling protect upstream providers and avoid unbounded public-hosted costs.

## 8. Risks and decisions

| Risk / unknown | Mitigation or decision |
| --- | --- |
| Live signal API may fail or cover only captured posts | Validate endpoints; show coverage and freshness; degrade to history-only UI. |
| Public announcement does not equal a user's actual quota refresh | Avoid account-level guarantees and show source verification clearly. |
| Conversation panel availability differs by account/host | Test a real ChatGPT `thread` entrypoint early; document fallback. |
| Plugin UI support in Codex differs from ChatGPT | MCP tools are a separate compatibility target; do not promise a visual panel in Codex. |
| Provider feeds contain revisions, duplicates or ambiguous timestamps | Preserve original IDs and revisions, normalise conservatively, test edge cases. |
| Vercel GitHub installation currently cannot see the new repo | After first commit, check/reconfigure installation permission and retry import. |
| Vercel Hobby limits and non-commercial terms | Suitable for a personal non-commercial pilot within limits; reassess hosting before commercial operation/public scale. Protect the MVP from unbounded usage and do not assume public success is free. |
| Popularity of the official plugin drives traffic to the maintainer's endpoint | Keep a self-host path, server-side cache, request limits, traffic visibility and a shutdown/fallback plan; gate public submission on an explicit sustainable hosting decision. |
| Hardcoded MCP hostname makes open-source forks depend on the official deployment | Provide endpoint configuration without a maintainer-specific default; the official published URL is inherently public, not secret. |
| Public plugin may require more than an MVP | Treat OpenAI submission requirements and review as a separate release gate. |

## 9. Project-management rules

- Work **one phase at a time**; complete its exit gate before moving on.
- Keep this file as the source of truth for goals, scope, decisions, blockers and checked tasks.
- Update checkboxes only for actually verified work, ideally in the same PR/commit.
- Prefer documented evidence and links over assumptions about host support or resets.
- Keep version one intentionally small; propose new features separately instead of silently expanding scope.
- Make every infrastructure dependency optional/configurable when feasible, so self-hosting does not depend on the official service.
- Use GitHub issues for concrete implementation tasks after the plan is agreed.
- Avoid spending on services unless a real MVP blocker justifies it.

## 10. First implementation task

**Start with Step 1 of the live radar: one read-only `tibo.cc/api/v1/status` adapter and one independently callable MCP status tool.** Keep the tested Hello World UI unchanged (both `thread` and `global`), preserve existing tool names, and defer all real dashboard work and other providers. Validate build, one live status result, safe error handling, and preview deployment before merging. Phase 1 hygiene items (MIT licence, tests/lint and full setup docs) remain outstanding; do not mark them complete solely because the smoke-test scaffold exists.

## Reference documentation

- [OpenAI MCP server + UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)
- [OpenAI Plugin Extensions: conversation panels / thread entrypoint](https://developers.openai.com/plugins/build/extensions)
- [OpenAI public plugin submission](https://developers.openai.com/plugins/deploy/submission)
- [Vercel MCP deployment guidance](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)
- [Vercel Hobby limits and usage terms](https://vercel.com/docs/plans/hobby)
- [Codex Reset Ledger source repository](https://github.com/kosanhu2021-source/codex-reset-ledger)
- [TIBO API documentation](https://tibo.cc/guide/api)
- [Codex Reset developer documentation](https://codex-reset.com/developers)
- [WhenResets public API/developer contract (excluded from v0.1 default sources)](https://whenresets.com/developers)

---

*This document is a development plan, not evidence that the features have been built, tested, deployed or accepted by OpenAI.*
