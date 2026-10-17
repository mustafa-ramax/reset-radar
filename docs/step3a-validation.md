# Step 3A source contract and decisions — 17/10/2026

Data: [codex-reset.com](https://codex-reset.com/). Contract: [developer documentation](https://codex-reset.com/developers). Public responses were requested with `ResetRadar/0.0.1 (+https://github.com/mustafa-ramax/reset-radar)`, normal TLS validation and a 15-second validation timeout. Production requests have an eight-second timeout. No account or key was used.

## Actual contract

`GET /api/feed` returned HTTP 200 JSON at 00:13:44 UTC. The captured version-1 envelope contained 45 `tweets`, 77 `events`, an inactive `signal`, `fetched_at`, `newest_post_at`, `stale: false`, and `source_scope: timeline`. Tweets have original `id`, `text`, `url` and publication `at`. Events have separate provider-written `summary` and `announced_at`; these must not replace original post text or be called a post publication date.

Observed headers: `Cache-Control: public, max-age=60`, `x-published-checked-at: 2026-10-17T00:13:18.752Z`, and `x-published-expires-at: 2026-10-17T00:16:18.752Z`. Ingestion `fetched_at` was `2026-10-17T00:13:17.000Z`. Source refresh is separate from the age of the original post. Missing, expired or contradictory freshness metadata makes the adapter stale; a local five-minute ingestion/publication age bound is an additional safety rule, not an upstream SLA.

The docs permit public reuse with linked credit on the same surface, including relay documentation and payloads. They require an identifying User-Agent, reads at most once per minute and respect for `Retry-After`. No numeric daily quota is published. No intentional 429 load test was performed. Retry handling is tested with synthetic HTTP responses.

The documented recorded-reset condition is `group: reset` plus `announcement_state: announced`. A separate `/api/timeline` request returned 76 events. All shared IDs agreed on group, announcement state, timestamp, summary and source URL; the feed additionally contained one historical boost. Timeline adds fields such as `confirmed` which the feed does not guarantee. Production reads only `/api/feed`; it does not fetch forecasts, timeline, status, rhythm or banked-reset projections.

`kind: signal`, candidates and reset-related wording alone do not establish a recorded reset. One post (`2110595554036400151`) has raw `kind: signal` and `reset_verification_status: expired`, while its event is provider-recorded. Both classifications and both timestamps are preserved. Unknown classifier fields never establish confirmation. Unknown kinds remain unclassified. The response contains no validated, documented expiry contract for future announcements. Therefore Codex Reset does not populate confirmed Upcoming announcements in this integration.

## Overlap and priority

TIBO's simultaneous response included six original posts and eight event IDs also present in Codex Reset, counting TIBO's full raw/history payload. The existing TIBO adapter intentionally exposes only latest/pending records; production duplicate matching is limited to evidence actually exposed by that adapter. The 39 additional captured posts are additional context, not 39 additional resets or independently verified evidence.

TIBO's latest post `2110618732666257557` ("Done and dusted https://t.co/0fehr43VS4") was absent from the Codex Reset snapshot. Any usable TIBO latest post remains primary, including clearly labelled stale history. Only when TIBO has no usable latest record can a Codex Reset provider-recorded event supply a labelled fallback. Original text is preferred; archive-only provider summaries are explicitly labelled and unknown post publication times stay unknown.

Duplicate matching uses validated original X/Twitter post identities, including domain aliases and tracking-query variants. Different posts about the same underlying reset are not merged or counted as independent confirmation. Raw provider records and classifications remain available in the combined result. A pending record that duplicates recorded/expired/inactive evidence from a fresh Codex Reset snapshot is withheld with an uncertainty warning; stale supplemental data cannot suppress fresh TIBO announcements. Duplicates of the displayed latest post are also withheld. The original TIBO payload is retained unchanged.

A Codex Reset hint may appear only with a fresh provider, an explicitly active signal, matching hint record, valid publication time within a local 24-hour display bound, no expired verification flag, no duplicate displayed evidence, and a time after the displayed recorded post. It is labelled **Hint only · not a confirmed announcement**, keeps its excerpt and source link, and has visible linked credit. The 24-hour bound is not an execution deadline. Historical/inactive/expired hints remain tool evidence only. Current captured data has no eligible hint.

## Reliability and scope

The adapter limits streamed responses to 256 KiB, each array to 200 records and text to 16,384 characters. Duplicate IDs or invalid envelopes fail conservatively. It validates HTTPS links without credentials. It caches success and failure for at least 60 seconds, coalesces concurrent calls, rechecks publication expiry on cached reads, honours numeric and HTTP-date Retry-After, and uses Next's existing shared fetch cache. Cache and cooldown state are per server instance; a deployment-wide 429 lock is not guaranteed across cold instances. No new infrastructure is introduced.

`get_tibo_status` and its adapter are unchanged. The new `get_reset_radar` returns separate provider snapshots, selected display evidence and duplicate provenance; aggregate availability does not imply both providers are healthy. The existing dashboard opener now returns this combined payload. Refresh still makes one initial/manual call, blocks overlap and has no retries or polling; it calls the combined tool. Existing resource URI and thread/global entrypoints are preserved.

Sanitised live subsets are in `tests/fixtures/codex-reset-feed.json` and `tests/fixtures/tibo-step3a.json`. Engagement counts, profile details, unrelated operational metadata and forecasts are omitted. Original text, IDs, timestamps and classifications are unchanged. Tests clearly mark synthetic variations for active hints, failures and missing fields, which were not present in the successful live snapshot.

Automated and browser verification, production MCP smoke results, Vercel Preview status and remaining acceptance limits are recorded in the PR. Real ChatGPT acceptance remains separate. No claim of account-level resets, independent event confirmation or complete coverage is made.
