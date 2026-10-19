# Reset Radar v0.1 — Release preparation

**Draft only, 19 October 2026.** The GitHub repository is public; v0.1 has not been tagged or published in the Plugin Directory. No publishing action is authorized by this document.

## Product boundary

Only **Upcoming** community-reported reset announcements and **Latest reported post**. TIBO is primary, Codex Reset supplemental. No historical timeline, forecasts, notifications or personal quota access.

## Completed checks

- [x] Vercel production READY after PR #10 (`f448b20`), with live production MCP status showing TIBO and Codex Reset available.
- [x] Latest original post content, source links and compact two-provider results verified in production.
- [x] Owner accepted ChatGPT sidebar, conversation panel and inline interface, including Refresh.
- [x] PR #10 reported 40 passing tests, typecheck, widget self-containment and production build.
- [x] README and MIT LICENSE drafted in the documentation PR; owner review pending.

## Gates before a public release or directory submission

- [ ] **Next week: dependency/security audit.** Triage three previously reported high-severity npm advisories, production applicability and patches/exceptions.
- [ ] **Public endpoint/hosting review.** Evaluate Vercel quotas/costs, abuse, per-instance caching/cooldowns, rate limiting, recovery and whether a shared hosted service is supportable.
- [ ] **Reproducibility.** Verify a fresh checkout can install, test and build consistently, including whether to add a dependency lockfile.
- [ ] **Licensing and attribution.** Owner confirm MIT copyright attribution and external source text/brand rights; preserve linked Codex Reset credit.
- [ ] **Final ChatGPT host smoke.** Sidebar, conversation panel, inline, Refresh, source links, theme and failure/unknown states after any changes.
- [ ] **Screenshots.** Capture real, privacy-safe images from the current ChatGPT host; do not label fixture browser images as real ChatGPT screenshots.
- [ ] **Distribution.** Decide supported installation path, stable hosted endpoint, support/maintenance and which plans/workspaces can add custom MCP servers.
- [ ] **Versioning.** Reconcile internal `package.json` version `0.0.1` with proposed public `v0.1` tag, then prepare a GitHub release only when authorized.
- [ ] **Optional directory submission.** Verify developer identity, plugin ZIP/metadata requirements and review using [OpenAI's submission instructions](https://developers.openai.com/plugins/deploy/submission).

## Repository settings (owner action outside this PR)

The current GitHub description incorrectly promises `track reset history`.

**Suggested replacement:** `🔄 Reset Radar: open-source ChatGPT MCP app for upcoming community-reported resets and the latest reported post.`

The repository homepage currently links to the maintainer's personal site. A dedicated project URL could replace it later. Description/homepage/topics are GitHub repository settings, not README content; no settings change is made by this PR.

## Draft release notes: Reset Radar v0.1

Reset Radar is a small, read-only, open-source ChatGPT MCP app showing the latest community-reported reset news, not your personal usage limits.

**Features:** Upcoming announcement with original wording where available; latest reported post and linked evidence; manual Refresh; source-freshness warnings; responsive light/dark ChatGPT sidebar, panel and inline views. TIBO primary, Codex Reset as supplemental hints and clearly attributed fallback. Duplicate posts are not independent confirmation.

**Self-host:** Next.js Streamable HTTP MCP endpoint `/api/mcp` with self-contained MCP Apps UI. No upstream API keys required.

**Limits:** No quota access, historical browser, predictions, account-level verification or automatic alerts. Installation depends on ChatGPT permissions and supported clients.

**Credits:** [TIBO](https://tibo.cc/) · Data: [codex-reset.com](https://codex-reset.com/). MIT for project source, excluding third-party content.

**Unpublished:** Await dependency/security, hosting and owner sign-off.
