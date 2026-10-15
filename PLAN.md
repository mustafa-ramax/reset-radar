# Reset Radar — Project Plan

> **Status:** Planning only · **Last reviewed:** 15 October 2026  
> **Repository:** https://github.com/mustafa-ramax/reset-radar  
> **Target:** Personal ChatGPT conversation panel first; cross-platform testing second; public plugin later.  
> **Principle:** Ship an accurate, lightweight read-only radar before adding features.

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

**Outcome: COMPLETE for research and architecture selection, based on the owner's live Codex tests.** The [Phase 0 validation report](docs/phase-0-validation.md#g-phase-0-verified-live-tests-from-user-run-codex-15-october-2026-aedt) records successful official-SDK connections to two existing remote MCP services and HTTP tests of the intended JSON providers. The legacy whenresets.com signal path failed and is excluded from the default MVP. The upstream services do not advertise the custom UI panel, so we will build a **thin MCP/UI bridge** using existing REST data. **This does not claim our new endpoint, ChatGPT panel, cross-platform support or deployments are tested**: those are later phase gates.

### Verification boundary

Live results were **reported by the owner's Codex test run** rather than fetched directly in this ChatGPT execution environment. Previous isolated-environment DNS failures and preliminary protocol checks remain documented as historical attempts. Existing upstream MCP clients completed a real SDK round-trip, but our own MCP endpoint is not yet built. Real ChatGPT `thread` rendering belongs to **Phase 4 integration**, not an impossible prerequisite for starting Phase 1. If the panel is unsupported in the account, record that failure and fall back to tool-only support rather than asserting success.

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
5. **Freshness:** Show last checked/last updated; manual refresh plus conservative auto-refresh while the panel is open (initial target: every 3–5 minutes, subject to host support).
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

**Exit gate: PASSED for research/feasibility.** Based on user-run 15 October tests; see [validated findings](docs/phase-0-validation.md#g-phase-0-verified-live-tests-from-user-run-codex-15-october-2026-aedt). **Our own HTTPS MCP endpoint** will be tested during Phase 2/4 and the **real ChatGPT conversation panel** during Phase 4. Neither is claimed complete here.

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
- [ ] Add manual refresh; trial auto-refresh every 3–5 minutes *only while mounted*, if supported.
- [ ] Support small panel widths, keyboard navigation, readable contrast and theme changes.
- [ ] Use locale-aware time formatting, with UTC fallback.

**Exit gate:** A person can understand whether a reset is merely suggested, announced or recorded within seconds; no unsupported certainty appears.

### Phase 4 — Personal Vercel deployment & ChatGPT integration

- [ ] Resolve Vercel GitHub installation/repository access for `reset-radar`.
- [ ] Import/link the public repo to the user's personal Vercel Hobby account (non-commercial personal MVP), with an environment-configured MCP origin.
- [ ] Deploy, verify HTTPS and MCP endpoint health.
- [ ] Install as **personal custom MCP plugin**, without submitting to the public directory.
- [ ] Open a new ChatGPT conversation, invoke the radar and **verify the real `thread` panel** in the user's account; explicitly record unsupported host outcomes.
- [ ] Validate source links, live refresh, host restrictions and response/error paths.

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

**Start with Phase 1 — repository bootstrap.** Phase 0's live provider and existing-MCP feasibility research has passed; preserve the recorded evidence and limitations. Scaffold the smallest reusable TypeScript MCP/UI foundation and tests, without deploying yet. Defer live panel installation/render verification to Phase 4; do **not** begin with public plugin submission, notification infrastructure or a design overhaul.

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
