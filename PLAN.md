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

## Phase 0 research update (15 October 2026)

**Research findings documented:** [docs/phase-0-validation.md](docs/phase-0-validation.md). Official OpenAI `thread` panel metadata and Vercel MCP hosting are documented, and the upstream historical JSON fixture/licence and live-signal API contract have been inspected. **Phase 0 is not yet complete:** actual live JSON HTTP responses, an MCP transport round-trip and a panel in the user's ChatGPT account remain untested. Do not advance Phase 1 until the Phase 0 exit gate is met.

## 2. Starting position (15 October 2026)

- [x] Public GitHub repository created: `mustafa-ramax/reset-radar`.
- [x] GitHub and Vercel connectors are available.
- [x] Vercel Hobby account identified.
- [ ] Source data contracts tested from a runnable app.
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

The two domains below are **different independent providers**, not redundant mirrors.

| Provider | Intended purpose | Integration caveat |
| --- | --- | --- |
| [whenresets.net/ledger.json](https://whenresets.net/ledger.json) | Recorded reset history | Historical feed can lag; do not use it as an announcement feed. Its [source repository](https://github.com/kosanhu2021-source/codex-reset-ledger) documents schema `whenresets.ledger/1` and MIT licensing. |
| [whenresets.com API](https://whenresets.com/developers) | Captured Tibo signals, archived events, coverage | Prefer `/api/v1/tibo` for signals and `/api/v1/archive` for archive/coverage. Respect missing, stale, throttled or incomplete responses. Confirm live endpoint behaviour before using it as a source of truth. |

### Contract validation is mandatory (first technical gate)

- Confirm HTTP availability, schema, required fields, rate limits, terms, cache guidance and attribution for each endpoint.
- Record real samples as sanitised test fixtures and validate responses with runtime schemas (e.g. Zod).
- Preserve `source_url`, event IDs, publication/effective timestamps, provider name, coverage/verification metadata and relevant snapshot IDs.
- Deduplicate by stable ID/source post **within a provider**. Do not sum or coalesce event counts across providers without a documented mapping.
- Treat signals separately from executed/recorded resets. A post saying “tomorrow” is **not** an exact-time guarantee.
- Do not invent `effective_at`, affected plans, global scope, or a missing time of day. If the source gives only a date, show only the date.
- Source errors, empty signals with stale coverage, and slow updates must result in **unknown/unavailable**, not “no reset”.
- Use server-side fetch with bounded timeouts, short caching, retry/backoff for transient failures and respectful request rates. No external API keys should be necessary for public reads.
- Show provider attribution and link to underlying evidence. Follow each provider's reuse terms (the .com API requires snapshot/version attribution).

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
                    ├─ whenresets.net ledger.json
                    └─ whenresets.com archive / tibo
```

- **Frontend:** React + TypeScript UI hosted as an MCP Apps resource; use the standard MCP Apps bridge and OpenAI MCP Extensions for the optional `thread` entrypoint.
- **Backend:** Small TypeScript MCP server deployed on Vercel; use the current official MCP/Vercel patterns (including `mcp-handler` if compatible).
- **Hosting:** One Vercel project, HTTPS endpoint, GitHub automatic deployments once linked.
- **Storage:** None for MVP; provider APIs and short-lived server cache only.
- **Authentication:** No sign-in for read-only public data in MVP. Reassess abuse protection and submission requirements before public release.
- **Compatibility:** Browser-based UI should be OS-independent **in a supported ChatGPT host**. Codex may consume the MCP tools without rendering the ChatGPT conversation panel. Do not promise identical UIs across hosts.

Prefer simple SDK-compatible code over inventing framework abstractions. Confirm exact SDK versions and host support during implementation.

## 6. Phases, tasks and acceptance gates

### Phase 0 — Verify sources & host capability (first)

- [ ] Inspect both live APIs, data licences/attribution requirements and sample payloads.
- [ ] Prove we can expose a basic MCP tool through a remote HTTPS server.
- [ ] Confirm `thread` panel support in the user's current ChatGPT host and note unsupported hosts.
- [ ] Finalise statuses and fallback behaviour based on actual provider fields.

**Exit gate:** We can show a truthful snapshot from at least one provider, and have a clear path to test the panel. If thread panels are unavailable, keep the MCP tool MVP and defer UI rather than claim success.

### Phase 1 — Repository bootstrap

- [ ] Add `README.md` (purpose, current limitations, setup, screenshots later).
- [ ] Add `LICENSE` (MIT), `.gitignore`, `.env.example` only if necessary.
- [ ] Scaffold minimal TypeScript app, scripts, formatting, lint/typecheck and tests.
- [ ] Add a small architecture/data-contract note and contribution guidance when useful.
- [ ] Keep commits focused, and do not introduce unnecessary services.

**Exit gate:** A fresh clone can install dependencies, run checks and start the app with documented commands.

### Phase 2 — Data adapters and MCP tools

- [ ] Fetch and validate ledger history.
- [ ] Fetch and validate Tibo signals and independent archive/coverage metadata where available.
- [ ] Normalise events and avoid double counting.
- [ ] Implement cache, timeout, error and stale-data handling.
- [ ] Implement `get_reset_radar` and bounded `get_reset_history`.
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
- [ ] Import/link the public repo to the user's personal Vercel Hobby account.
- [ ] Deploy, verify HTTPS and MCP endpoint health.
- [ ] Install as **personal custom MCP plugin**, without submitting to the public directory.
- [ ] Open a new ChatGPT conversation, invoke the radar and verify the side panel.
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

## 8. Risks and decisions

| Risk / unknown | Mitigation or decision |
| --- | --- |
| Live signal API may fail or cover only captured posts | Validate endpoints; show coverage and freshness; degrade to history-only UI. |
| Public announcement does not equal a user's actual quota refresh | Avoid account-level guarantees and show source verification clearly. |
| Conversation panel availability differs by account/host | Test a real ChatGPT `thread` entrypoint early; document fallback. |
| Plugin UI support in Codex differs from ChatGPT | MCP tools are a separate compatibility target; do not promise a visual panel in Codex. |
| Provider feeds contain revisions, duplicates or ambiguous timestamps | Preserve original IDs and revisions, normalise conservatively, test edge cases. |
| Vercel GitHub installation currently cannot see the new repo | After first commit, check/reconfigure installation permission and retry import. |
| Vercel Hobby limits and non-commercial terms | Suitable for a personal non-commercial pilot within limits; reassess hosting before commercial operation/public scale. |
| Public plugin may require more than an MVP | Treat OpenAI submission requirements and review as a separate release gate. |

## 9. Project-management rules

- Work **one phase at a time**; complete its exit gate before moving on.
- Keep this file as the source of truth for goals, scope, decisions, blockers and checked tasks.
- Update checkboxes only for actually verified work, ideally in the same PR/commit.
- Prefer documented evidence and links over assumptions about host support or resets.
- Keep version one intentionally small; propose new features separately instead of silently expanding scope.
- Use GitHub issues for concrete implementation tasks after the plan is agreed.
- Avoid spending on services unless a real MVP blocker justifies it.

## 10. First implementation task

**Start with Phase 0.** Verify the current provider JSON contracts and MCP conversation-panel support, capture fixtures, and document uncertainties. Then bootstrap the repo (Phase 1). Do **not** begin with public plugin submission, notification infrastructure or a design overhaul.

## Reference documentation

- [OpenAI MCP server + UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)
- [OpenAI Plugin Extensions: conversation panels / thread entrypoint](https://developers.openai.com/plugins/build/extensions)
- [OpenAI public plugin submission](https://developers.openai.com/plugins/deploy/submission)
- [Vercel MCP deployment guidance](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)
- [Vercel Hobby limits and usage terms](https://vercel.com/docs/plans/hobby)
- [Codex Reset Ledger source repository](https://github.com/kosanhu2021-source/codex-reset-ledger)
- [WhenResets public API/developer contract](https://whenresets.com/developers)

---

*This document is a development plan, not evidence that the features have been built, tested, deployed or accepted by OpenAI.*
