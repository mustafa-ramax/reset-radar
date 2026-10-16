import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTiboStatus } from "../lib/tibo-status.ts";

const recordedPost = {
  id: "completion-1",
  reset_type: "recorded",
  announced_at: "2026-10-15T06:28:13.000Z",
  text: "Completion reported by the source",
  source: { url: "https://x.com/example/status/123" },
};

function fixture(overrides = {}) {
  return {
    stale: false,
    upstream_status: "ok",
    fetched_at: new Date().toISOString(),
    data: { latest_reset: recordedPost, scheduled_reset: null, active_watch: {} },
    ...overrides,
  };
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("normal response keeps source attribution and never asserts personal quota", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(fixture()));
  const result = await getTiboStatus();
  assert.equal(result.state, "available");
  assert.equal(result.latestRecordedReset?.originalPostUrl, recordedPost.source.url);
  assert.equal(result.pendingAnnouncement, null);
  assert.match(result.disclaimer, /personal account/i);
});

test("network outage and timeout return unknown/unavailable rather than an empty success", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("The operation timed out", "TimeoutError");
  });
  const result = await getTiboStatus();
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(result.state, "unavailable");
  assert.equal(result.latestRecordedReset, null);
  assert.equal(result.pendingAnnouncement, null);
  assert.match(result.warning, /could not retrieve/i);
});

test("upstream HTTP failure returns unavailable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ error: "unavailable" }, 503));
  const result = await getTiboStatus();
  assert.equal(result.state, "unavailable");
  assert.match(result.warning, /HTTP 503/);
});

test("HTTP 429 exposes rate-limit warning without immediate retries", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => jsonResponse({}, 429));
  const result = await getTiboStatus();
  assert.equal(result.state, "unavailable");
  assert.match(result.warning, /rate-limited/i);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("invalid JSON, non-JSON content and invalid envelope are rejected", async (t) => {
  const responses = [
    new Response("{broken", { headers: { "content-type": "application/json" } }),
    new Response("<html>bad gateway</html>", { headers: { "content-type": "text/html" } }),
    jsonResponse({ stale: false, data: "unexpected" }),
  ];
  const fetchMock = t.mock.method(globalThis, "fetch", async () => responses.shift());
  for (let index = 0; index < 3; index++) {
    const result = await getTiboStatus();
    assert.equal(result.state, "unavailable");
    assert.equal(result.pendingAnnouncement, null);
  }
  assert.equal(fetchMock.mock.callCount(), 3);
});

test("empty scheduled-reset object is not misreported as an announcement", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    jsonResponse(fixture({ data: { latest_reset: recordedPost, scheduled_reset: {}, active_watch: {} } })),
  );
  const result = await getTiboStatus();
  assert.equal(result.state, "available");
  assert.equal(result.pendingAnnouncement, null);
});

test("explicit provider staleness preserves recorded evidence but flags uncertainty", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse(fixture({ stale: true })));
  const result = await getTiboStatus();
  assert.equal(result.state, "stale");
  assert.equal(result.latestRecordedReset?.id, recordedPost.id);
  assert.match(result.warning, /outdated/i);
});

test("old or missing provider fetch timestamps must not be labelled fresh", async (t) => {
  const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const responses = [fixture({ fetched_at: old }), fixture({ fetched_at: null })];
  t.mock.method(globalThis, "fetch", async () => jsonResponse(responses.shift()));
  for (let i = 0; i < 2; i++) {
    const result = await getTiboStatus();
    assert.equal(result.state, "stale");
    assert.equal(result.latestRecordedReset?.id, recordedPost.id);
  }
});

test("recover from an outage on a later read without retaining an error state", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (calls === 1) throw new Error("network offline");
    return jsonResponse(fixture());
  });
  const first = await getTiboStatus();
  const recovered = await getTiboStatus();
  assert.equal(first.state, "unavailable");
  assert.equal(recovered.state, "available");
  assert.equal(recovered.latestRecordedReset?.id, recordedPost.id);
  assert.equal(recovered.warning, null);
  assert.equal(calls, 2);
});

test("MCP tool names and both ChatGPT panel entrypoints remain registered", async () => {
  const route = await readFile(new URL("../app/api/mcp/route.ts", import.meta.url), "utf8");
  assert.match(route, /"show_reset_radar_hello"/);
  assert.match(route, /"get_tibo_status"/);
  assert.match(route, /type:\s*"thread"/);
  assert.match(route, /type:\s*"global"/);
});
