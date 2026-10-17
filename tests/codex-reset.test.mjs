import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createCodexResetReader } from "../lib/codex-reset-status.ts";
import { combineResetRadar, originalPostKey, getResetRadar } from "../lib/reset-radar.ts";

const fixture = JSON.parse(await readFile(new URL("./fixtures/codex-reset-feed.json", import.meta.url), "utf8"));
const tiboFixture = JSON.parse(await readFile(new URL("./fixtures/tibo-step3a.json", import.meta.url), "utf8"));
const NOW = Date.parse("2026-10-17T00:13:44Z");
const body = () => structuredClone(fixture.body);
const response = (value = body(), headers = fixture.headers) => new Response(JSON.stringify(value), { headers });
const load = (value = body(), headers = fixture.headers) => createCodexResetReader(async () => response(value, headers), () => NOW)();
const tibo = (overrides = {}) => ({ provider: "TIBO", state: "available", checkedAt: new Date(NOW).toISOString(),
  providerFetchedAt: tiboFixture.fetched_at, upstreamStatus: "ok", warning: null, activeWatchPresent: false,
  latestRecordedReset: { id: tiboFixture.data.latest_reset.id, resetType: "regular",
    announcedAt: tiboFixture.data.latest_reset.announced_at, textExcerpt: tiboFixture.data.latest_reset.text,
    originalPostUrl: tiboFixture.data.latest_reset.source.url }, pendingAnnouncement: null, ...overrides });

test("captured feed preserves original text, dates, source classifications, provenance and credit", async () => {
  const result = await load();
  assert.equal(result.state, "available");
  assert.equal(result.source, "https://codex-reset.com/");
  assert.equal(result.attribution, "Data: codex-reset.com");
  assert.equal(result.providerFetchedAt, fixture.body.fetched_at);
  assert.equal(result.publishedExpiresAt, fixture.headers["x-published-expires-at"]);
  for (const tweet of fixture.body.tweets) {
    const record = result.records.find(item => item.id === tweet.id);
    assert.equal(record.text, tweet.text);
    assert.equal(record.publishedAt, tweet.at);
    assert.equal(record.kind, tweet.kind);
    assert.equal(record.originalPostUrl, tweet.url);
  }
  const record = result.records.find(item => item.id === "2110595554036400151");
  assert.equal(record.kind, "signal");
  assert.equal(record.classification, "recorded");
  assert.equal(record.verificationStatus, "expired");
  assert.equal(record.event.announcementState, "announced");
  assert.notEqual(record.publishedAt, record.event.announcedAt);
  assert.notEqual(record.text, record.event.summary);
  assert.equal(result.records.find(item => item.id === "2109873287853707513").classification, "unclassified");
});

test("only reset/announced events count as provider-recorded resets; unknown and unrelated kinds stay distinct", async () => {
  const value = body();
  value.tweets.push({ id: "other", kind: "other", text: "Unrelated post" }, { id: "unknown", kind: "new-kind" });
  value.events.push({ id: "credits", group: "credits", announcement_state: "announced" });
  const result = await load(value);
  assert.equal(result.records.find(x => x.id === "other").classification, "unrelated");
  assert.equal(result.records.find(x => x.id === "unknown").classification, "unclassified");
  assert.notEqual(result.records.find(x => x.id === "credits").classification, "recorded");
  assert.equal(result.records.find(x => x.id === value.signal.tweet_id).classification, "hint");
});

test("timeouts, HTTP 503/429, invalid JSON, invalid schema and oversize bodies fail conservatively", async () => {
  const attempts = [
    async () => { throw new DOMException("Timed out", "TimeoutError"); },
    async () => new Response("", { status: 503 }), async () => new Response("", { status: 429 }),
    async () => new Response("{bad", { headers: { "content-type": "application/json" } }),
    async () => new Response("<html>error</html>"), async () => response({}),
    async () => response({ ...body(), tweets: {} }),
    async () => response({ ...body(), tweets: [body().tweets[0], body().tweets[0]] }),
    async () => response({ ...body(), events: Array(201).fill({ id: "oversize" }) }),
    async () => new Response(" ".repeat(262145), { headers: { "content-type": "application/json" } }),
  ];
  for (const request of attempts) {
    const result = await createCodexResetReader(request, () => NOW)();
    assert.equal(result.state, "unavailable");
    assert.deepEqual(result.records, []);
    assert.equal(result.signal, null);
    assert.ok(result.warning);
    assert.equal(result.source, "https://codex-reset.com/");
  }
});

test("stale ingestion, expired copies, missing/future/contradictory timestamps never look fresh", async () => {
  for (const value of [ { ...body(), stale: true }, { ...body(), fetched_at: null },
    { ...body(), fetched_at: "2020-01-01T00:00:00Z" }, { ...body(), fetched_at: "2099-01-01T00:00:00Z" } ]) {
    assert.equal((await load(value)).state, "stale");
  }
  for (const change of [ { "x-published-expires-at": "2020-01-01T00:00:00Z" },
    { "x-published-checked-at": "" }, { "x-published-expires-at": "" },
    { "x-published-checked-at": "2099-01-01T00:00:00Z" } ]) {
    assert.equal((await load(body(), { ...fixture.headers, ...change })).state, "stale");
  }
});

test("cache coalesces simultaneous reads, identifies requests, rechecks expiry and later recovers", async () => {
  let now = NOW;
  let calls = 0;
  const reader = createCodexResetReader(async (url, options) => {
    calls++;
    assert.equal(url, "https://codex-reset.com/api/feed");
    assert.match(options.headers["User-Agent"], /ResetRadar.*github.com\/mustafa-ramax\/reset-radar/);
    assert.equal(options.next.revalidate, 60);
    assert.ok(options.signal instanceof AbortSignal);
    return calls === 1 ? response() : new Response("", { status: 503 });
  }, () => now);
  await Promise.all([reader(), reader(), reader()]);
  await reader();
  assert.equal(calls, 1);
  now += 60001;
  assert.equal((await reader()).state, "unavailable");
  assert.equal(calls, 2);
  let attempt = 0;
  const recovery = createCodexResetReader(async () => ++attempt === 1 ? new Response("", { status: 503 }) : response(), () => now);
  assert.equal((await recovery()).state, "unavailable");
  now += 60001;
  assert.equal((await recovery()).state, "available");
  now = NOW;
  const expiring = createCodexResetReader(async () => response(body(), { ...fixture.headers,
    "x-published-expires-at": new Date(NOW + 15000).toISOString() }), () => now);
  assert.equal((await expiring()).state, "available");
  now += 20000;
  assert.equal((await expiring()).state, "stale");
});

test("429 honours both Retry-After seconds and HTTP-date without immediate retries", async () => {
  for (const retry of ["600", new Date(NOW + 600000).toUTCString()]) {
    let now = NOW;
    let calls = 0;
    const reader = createCodexResetReader(async () => {
      calls++;
      return new Response("", { status: 429, headers: { "retry-after": retry } });
    }, () => now);
    const result = await reader();
    assert.equal(result.retryAt, new Date(NOW + 600000).toISOString());
    now += 120000;
    await reader();
    assert.equal(calls, 1);
    now += 480001;
    await reader();
    assert.equal(calls, 2);
  }
});

test("unsafe source links are removed at the adapter boundary", async () => {
  const value = body();
  value.tweets[0].url = "https://user:password@example.com/";
  value.signal.url = "javascript:alert(1)";
  const result = await load(value);
  assert.equal(result.records.find(x => x.id === value.tweets[0].id).originalPostUrl, null);
  assert.equal(result.signal.originalPostUrl, null);
});

test("TIBO remains primary regardless of Codex Reset recency, uncertainty or staleness", async () => {
  const codex = await load();
  for (const state of ["available", "stale"]) {
    const primary = tibo({ state });
    const result = combineResetRadar(primary, codex, NOW);
    assert.equal(result.latestRecordedReset.provider, "TIBO");
    assert.equal(result.latestRecordedReset.textExcerpt, primary.latestRecordedReset.textExcerpt);
    assert.equal(result.latestRecordedReset.providerState, state);
    assert.equal(result.pendingAnnouncement, null);
    assert.equal(result.hint, null); // live headline is inactive and historical
  }
});

test("providers fail independently; fallback has correct provenance and upcoming remains unknown", async () => {
  const codex = await load();
  const failed = { ...codex, state: "unavailable", records: [], signal: null, warning: "Unavailable" };
  const tiboOnly = combineResetRadar(tibo(), failed, NOW);
  assert.equal(tiboOnly.state, "available");
  assert.equal(tiboOnly.latestRecordedReset.provider, "TIBO");
  const codexOnly = combineResetRadar(tibo({ state: "unavailable", latestRecordedReset: null }), codex, NOW);
  assert.equal(codexOnly.state, "available");
  assert.equal(codexOnly.latestRecordedReset.provider, "Codex Reset");
  assert.equal(codexOnly.latestRecordedReset.textBasis, "original post");
  assert.equal(codexOnly.upcomingState, "unknown");
  assert.equal(codexOnly.pendingAnnouncement, null);
  const both = combineResetRadar(tibo({ state: "unavailable", latestRecordedReset: null }), failed, NOW);
  assert.equal(both.state, "unavailable");
  assert.equal(both.latestRecordedReset, null);
  const stale = combineResetRadar(tibo({ state: "unavailable", latestRecordedReset: null }), { ...codex, state: "stale" }, NOW);
  assert.equal(stale.latestRecordedReset.providerState, "stale");
});

test("original post identity deduplicates X aliases without merging different evidence", async () => {
  const codex = await load();
  const record = codex.records.find(x => x.classification === "recorded");
  const primary = tibo();
  primary.latestRecordedReset.originalPostUrl = record.originalPostUrl.replace("x.com", "twitter.com") + "?s=20";
  const result = combineResetRadar(primary, codex, NOW);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.duplicates[0].codexResetId, record.id);
  assert.equal(result.providers.codexReset.records.length, codex.records.length);
  assert.equal(result.latestRecordedReset.textExcerpt, primary.latestRecordedReset.textExcerpt);
  assert.equal(originalPostKey("https://x.com.example.org/a/status/123"), "https://x.com.example.org/a/status/123");
});

test("only a fresh TIBO announcement can populate Upcoming; duplicates and expired reports cannot", async () => {
  const codex = await load();
  const pending = { id: "new-plan", textExcerpt: "A source announcement", originalPostUrl: "https://x.com/example/status/999", announcedAt: new Date(NOW).toISOString() };
  assert.equal(combineResetRadar(tibo({ pendingAnnouncement: pending }), codex, NOW).pendingAnnouncement.textExcerpt, pending.textExcerpt);
  for (const state of ["stale", "unavailable"]) {
    assert.equal(combineResetRadar(tibo({ state, pendingAnnouncement: pending }), codex, NOW).pendingAnnouncement, null);
  }
  for (const item of codex.records.filter(x => x.classification === "recorded" || x.verificationStatus === "expired")) {
    const result = combineResetRadar(tibo({ pendingAnnouncement: { ...pending, originalPostUrl: item.originalPostUrl } }), codex, NOW);
    assert.equal(result.pendingAnnouncement, null);
    assert.equal(result.upcomingState, "unknown");
  }
  const duplicate = combineResetRadar(tibo({ pendingAnnouncement: tibo().latestRecordedReset }), codex, NOW);
  assert.equal(duplicate.pendingAnnouncement, null);
  const oldRecord = codex.records.find(x => x.classification === "recorded");
  const primaryPending = { ...pending, originalPostUrl: oldRecord.originalPostUrl };
  const staleSupplement = combineResetRadar(tibo({ pendingAnnouncement: primaryPending }), { ...codex, state: "stale" }, NOW);
  assert.equal(staleSupplement.pendingAnnouncement.textExcerpt, pending.textExcerpt);
});

test("active hints never become announcements and historical, expired or duplicate hints stay hidden", async () => {
  const codex = await load();
  // Synthetic variations of the captured inactive signal exercise states absent in today's snapshot.
  codex.signal.active = true;
  codex.signal.at = new Date(NOW - 1000).toISOString();
  codex.records.find(x => x.id === codex.signal.id).publishedAt = codex.signal.at;
  let result = combineResetRadar(tibo(), codex, NOW);
  assert.equal(result.hint.classification, "hint");
  assert.equal(result.pendingAnnouncement, null);
  for (const change of [{ active: false }, { at: null }, { at: "2020-01-01T00:00:00Z" }, { at: "2099-01-01T00:00:00Z" }]) {
    result = combineResetRadar(tibo(), { ...codex, signal: { ...codex.signal, ...change } }, NOW);
    assert.equal(result.hint, null);
  }
  const signalRecord = codex.records.find(x => x.id === codex.signal.id);
  signalRecord.verificationStatus = "expired";
  assert.equal(combineResetRadar(tibo(), codex, NOW).hint, null);
  signalRecord.verificationStatus = null;
  assert.equal(combineResetRadar(tibo(), { ...codex, state: "stale" }, NOW).hint, null);
  codex.signal.originalPostUrl = tibo().latestRecordedReset.originalPostUrl;
  assert.equal(combineResetRadar(tibo(), codex, NOW).hint, null);
  codex.signal.originalPostUrl = signalRecord.originalPostUrl;
  signalRecord.publishedAt = "2020-01-01T00:00:00Z";
  assert.equal(combineResetRadar(tibo(), codex, NOW).hint, null);
});

test("missing publication times remain unknown and provider summaries are labelled honestly", async () => {
  const codex = await load();
  for (const record of codex.records) { record.text = null; record.publishedAt = null; }
  const result = combineResetRadar(tibo({ state: "unavailable", latestRecordedReset: null }), codex, NOW);
  assert.equal(result.latestRecordedReset.textBasis, "provider summary");
  assert.equal(result.latestRecordedReset.announcedAt, null);
  for (const record of codex.records) { if (record.event) record.event.announcedAt = null; }
  assert.equal(combineResetRadar(tibo({ state: "unavailable", latestRecordedReset: null }), codex, NOW).latestRecordedReset, null);
});

test("combined tool invokes both independent adapters without changing the TIBO request contract", async t => {
  t.mock.method(Date, "now", () => NOW);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(url);
    if (url === "https://tibo.cc/api/v1/status") {
      assert.equal(options.next.revalidate, 300);
      return response(tiboFixture);
    }
    return new Response("", { status: 503 });
  });
  const result = await getResetRadar();
  assert.equal(calls.length, 2);
  assert.equal(result.providers.tibo.state, "available");
  assert.equal(result.providers.codexReset.state, "unavailable");
  assert.equal(result.latestRecordedReset.textExcerpt, tiboFixture.data.latest_reset.text);
});
