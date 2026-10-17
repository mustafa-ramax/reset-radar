import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createCodexResetReader } from "../lib/codex-reset-status.ts";
import { combineResetRadar, projectResetRadar } from "../lib/reset-radar.ts";

const html = await readFile(new URL("../widget/dashboard.html", import.meta.url), "utf8");
const source = await readFile(new URL("../widget/dashboard.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const excerpt = "Done and dusted https://t.co/0fehr43VS4";
const post = { textExcerpt: excerpt, resetType: "regular", announcedAt: "2026-10-15T06:28:13Z",
  originalPostUrl: "https://x.com/thsottiaux/status/2110618732666257557" };
const snapshot = overrides => ({ provider: "TIBO", state: "available", latestRecordedReset: post,
  pendingAnnouncement: null, providerFetchedAt: "2026-10-17T00:00:00Z", ...overrides });
const settled = () => new Promise(resolve => setImmediate(resolve));

// Run the real renderer and bridge handlers against a small, dependency-free DOM double.
async function dashboard() {
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, {
    textContent: "", hidden: false, disabled: false, dataset: {}, href: "", listeners: {},
    classList: { toggle() {} },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    removeAttribute(name) { delete this[name]; },
    set innerHTML(_) { throw new Error("Source content must be rendered as text"); },
  }]));
  let app;
  class App {
    calls = [];
    links = [];
    result = async () => ({ structuredContent: snapshot() });
    constructor() { app = this; }
    async connect() {}
    getHostContext() {}
    callServerTool(args) { this.calls.push(args); return this.result(); }
    async openLink(args) { this.links.push(args.url); return {}; }
  }
  vm.runInNewContext(compiled, {
    exports: {}, URL, Intl, Date,
    document: { getElementById: id => elements.get(id) },
    require(name) {
      assert.equal(name, "@modelcontextprotocol/ext-apps");
      return { App, applyDocumentTheme() {}, applyHostStyleVariables() {} };
    },
  });
  await settled();
  return {
    app, element: id => elements.get(id),
    render: value => app.ontoolresult({ structuredContent: value }),
    click(id) {
      const element = elements.get(id);
      element.listeners.click({ currentTarget: element, preventDefault() {} });
    },
  };
}

test("source excerpt is primary content outside collapsed details, without duplication", async () => {
  const ui = await dashboard();
  assert.equal(ui.element("last-state").textContent, excerpt);
  assert.match(ui.element("last-time").textContent, /^Post date /);
  assert.ok(html.indexOf('id="last-state"') < html.indexOf('<details'));
  assert.match(html, /<details id="source-details">/);
  assert.doesNotMatch(html, /id="last-excerpt"/);
});

test("generic latest labels are used only when the excerpt is missing", async () => {
  const ui = await dashboard();
  for (const [resetType, label] of [["recorded", "Recorded post"], ["completion", "Completion post reported"],
    ["regular", "Reset-related post reported"]]) {
    for (const textExcerpt of [null, undefined, "", "   ", 42]) {
      ui.render(snapshot({ latestRecordedReset: { ...post, resetType, textExcerpt } }));
      assert.equal(ui.element("last-state").textContent, label);
    }
    ui.render(snapshot({ latestRecordedReset: { ...post, resetType } }));
    assert.equal(ui.element("last-state").textContent, excerpt);
  }
});

test("upcoming shows the source announcement, date and link with a conservative fallback", async () => {
  const ui = await dashboard();
  const announcement = "A reset is planned — source announcement only.";
  ui.render(snapshot({ pendingAnnouncement: { ...post, textExcerpt: announcement } }));
  assert.equal(ui.element("pending").textContent, announcement);
  assert.equal(ui.element("upcoming").dataset.state, "announced");
  assert.match(ui.element("pending-detail").textContent, /^Post date /);
  assert.equal(ui.element("pending-link").hidden, false);
  ui.render(snapshot({ pendingAnnouncement: { ...post, textExcerpt: null } }));
  assert.equal(ui.element("pending").textContent, "Announcement reported");
  ui.render(snapshot());
  assert.equal(ui.element("pending").textContent, "No announcement reported");
  assert.equal(ui.element("pending-detail").textContent, "In the current TIBO feed");
});

test("validated X and Twitter domains use X labels; other sources use neutral labels", async () => {
  const ui = await dashboard();
  for (const [url, isX] of [["https://x.com/a", true], ["https://twitter.com/a", true],
    ["https://www.x.com/a", true], ["https://mobile.twitter.com/a", true],
    ["https://example.com/a", false], ["https://x.com.example.com/a", false],
    ["https://notx.com/a", false]]) {
    ui.render(snapshot({ latestRecordedReset: { ...post, originalPostUrl: url },
      pendingAnnouncement: { ...post, originalPostUrl: url } }));
    for (const id of ["source-link", "pending-link"]) {
      assert.equal(ui.element(id).textContent, isX ? "View original X post ↗" : "View original source ↗");
      ui.click(id);
      assert.equal(ui.app.links.at(-1), url);
    }
  }
});

test("unsafe source URLs are hidden and cannot be passed to the MCP host", async () => {
  const ui = await dashboard();
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "http://x.com/a",
    "https://user:password@x.com/a", "not a URL", "https://example.com/" + "a".repeat(2048)]) {
    ui.render(snapshot({ latestRecordedReset: { ...post, originalPostUrl: url },
      pendingAnnouncement: { ...post, originalPostUrl: url } }));
    for (const id of ["source-link", "pending-link"]) {
      assert.equal(ui.element(id).hidden, true);
      ui.click(id);
    }
  }
  assert.equal(ui.app.links.length, 0);
});

test("stale history stays visible; stale upcoming and unavailable records stay uncertain", async () => {
  const ui = await dashboard();
  ui.render(snapshot({ state: "stale", pendingAnnouncement: post, warning: "Stale provider evidence" }));
  assert.equal(ui.element("last-state").textContent, excerpt);
  assert.equal(ui.element("last-context").hidden, false);
  assert.equal(ui.element("pending").textContent, "Unable to verify");
  assert.equal(ui.element("pending-link").hidden, true);
  assert.equal(ui.element("feedback").textContent, "TIBO data is stale. Try Refresh.");
  ui.render(snapshot({ state: "unavailable", pendingAnnouncement: post }));
  assert.equal(ui.element("last-state").textContent, "Unavailable");
  assert.equal(ui.element("last-time").hidden, true);
  assert.equal(ui.element("source-link").hidden, true);
  assert.equal(ui.element("pending").textContent, "Unable to verify");
  assert.equal(ui.element("feedback").textContent, "Source unavailable. Try Refresh.");
});

test("excerpts remain literal text, preserve wording and keep the existing length bound", async () => {
  const ui = await dashboard();
  for (const textExcerpt of ["  Source wording https://t.co/example  ", "<img src=x onerror=alert(1)>", "a".repeat(300)]) {
    ui.render(snapshot({ latestRecordedReset: { ...post, textExcerpt }, pendingAnnouncement: { ...post, textExcerpt } }));
    assert.equal(ui.element("last-state").textContent, textExcerpt.slice(0, 200));
    assert.equal(ui.element("pending").textContent, textExcerpt.slice(0, 200));
  }
});

test("Refresh calls the combined read-only tool once, blocks overlap and recovers after failure", async () => {
  const ui = await dashboard();
  assert.equal(JSON.stringify(ui.app.calls), '[{"name":"get_reset_radar","arguments":{}}]');
  let release;
  ui.app.result = () => new Promise(resolve => { release = resolve; });
  ui.click("refresh");
  ui.click("refresh");
  assert.equal(ui.app.calls.length, 2);
  assert.equal(ui.element("refresh").disabled, true);
  assert.equal(ui.element("refresh").textContent, "Refreshing…");
  release({ isError: true });
  await settled();
  assert.equal(ui.element("last-state").textContent, "Unavailable");
  assert.equal(ui.element("refresh").disabled, false);
  assert.equal(ui.app.calls.length, 2);
  ui.app.result = async () => ({ structuredContent: snapshot() });
  ui.click("refresh");
  await settled();
  assert.equal(ui.app.calls.length, 3);
  assert.equal(ui.element("last-state").textContent, excerpt);
  assert.equal(ui.element("refresh").textContent, "↻ Refresh");
});

function combined(overrides = {}) {
  return { provider: "Reset Radar", state: "available", upcomingState: "available",
    latestRecordedReset: { ...post, provider: "TIBO", textBasis: "original post" },
    pendingAnnouncement: null, hint: null,
    providers: {
      tibo: snapshot(),
      codexReset: { provider: "Codex Reset", state: "available", providerFetchedAt: "2026-10-17T00:00:00Z" },
    }, ...overrides };
}

test("combined dashboard keeps both source excerpts prominent with visible linked credit outside details", async () => {
  const ui = await dashboard();
  const announcement = "Original upcoming announcement https://t.co/example";
  ui.render(combined({ pendingAnnouncement: { ...post, textExcerpt: announcement } }));
  assert.equal(ui.element("last-state").textContent, excerpt);
  assert.equal(ui.element("pending").textContent, announcement);
  assert.equal(ui.element("codex-credit").hidden, false);
  assert.ok(html.indexOf('id="codex-credit"') < html.indexOf('<details'));
  assert.match(html, /id="codex-link" href="https:\/\/codex-reset.com\/"/);
  ui.element("codex-link").href = "https://codex-reset.com/";
  ui.click("codex-link");
  assert.equal(ui.app.links.at(-1), "https://codex-reset.com/");
  ui.render(combined({ hint: { ...post, classification: "hint", textExcerpt: "Source hint only" } }));
  assert.equal(ui.element("hint-report").hidden, false);
  assert.equal(ui.element("hint-text").textContent, "Source hint only");
  assert.equal(ui.element("pending").textContent, "No announcement reported");
  assert.match(html, /Hint only · not a confirmed announcement/);
  assert.match(html, /id="hint-credit" href="https:\/\/codex-reset.com\/"/);
});

test("combined dashboard failures retain valid primary/fallback content with correct credit and uncertainty", async () => {
  const ui = await dashboard();
  const value = combined();
  value.providers.codexReset.state = "unavailable";
  ui.render(value);
  assert.equal(ui.element("last-state").textContent, excerpt);
  assert.match(ui.element("feedback").textContent, /Codex Reset unavailable/);
  assert.equal(ui.element("codex-credit").hidden, false);
  value.providers.tibo.state = "unavailable";
  value.providers.codexReset.state = "available";
  value.upcomingState = "unknown";
  value.latestRecordedReset = { ...post, provider: "Codex Reset", textBasis: "provider summary", textExcerpt: "Provider summary" };
  ui.render(value);
  assert.equal(ui.element("last-state").textContent, "Provider summary");
  assert.equal(ui.element("latest-provider").hidden, false);
  assert.match(ui.element("latest-provider").textContent, /provider summary, not original post text/);
  assert.equal(ui.element("freshness-provider").textContent, "Codex Reset");
  assert.equal(ui.element("pending").textContent, "Unable to verify");
  assert.match(ui.element("feedback").textContent, /TIBO unavailable/);
  value.providers.codexReset.state = "stale";
  value.hint = { ...post, classification: "hint" };
  ui.render(value);
  assert.equal(ui.element("hint-report").hidden, true);
  assert.equal(ui.element("last-context").hidden, false);
  ui.render(snapshot());
  assert.equal(ui.element("codex-credit").hidden, true);
  assert.equal(ui.element("freshness-provider").textContent, "TIBO");
});

test("projected tool payloads render primary, pending, hint, stale, independent failures and recovery", async () => {
  const fixture = JSON.parse(await readFile(new URL("./fixtures/codex-reset-feed.json", import.meta.url), "utf8"));
  const now = Date.parse("2026-10-17T00:13:44Z");
  const codex = await createCodexResetReader(async () => new Response(JSON.stringify(fixture.body), { headers: fixture.headers }), () => now)();
  const ui = await dashboard();
  const scenarios = [
    () => {},
    (tibo) => { tibo.pendingAnnouncement = { ...post, id: "new", originalPostUrl: "https://x.com/example/status/999", textExcerpt: "Original announcement" }; },
    (_, source) => {
      source.signal.active = true;
      source.signal.at = new Date(now - 1000).toISOString();
      source.records.find(record => record.id === source.signal.id).publishedAt = source.signal.at;
    },
    (_, source) => { source.state = "unavailable"; source.records = []; source.signal = null; },
    (tibo) => { tibo.state = "unavailable"; tibo.latestRecordedReset = null; },
    (tibo, source) => { tibo.state = "stale"; source.state = "stale"; },
    (tibo, source) => { tibo.state = "unavailable"; tibo.latestRecordedReset = null; source.state = "unavailable"; source.records = []; source.signal = null; },
    (tibo, source) => {
      const record = source.records.find(item => item.verificationStatus === "expired");
      tibo.pendingAnnouncement = { ...post, originalPostUrl: record.originalPostUrl };
    },
  ];
  for (const change of scenarios) {
    const tibo = snapshot();
    const source = structuredClone(codex);
    change(tibo, source);
    const projected = projectResetRadar(combineResetRadar(tibo, source, now));
    ui.render(projected);
    assert.equal(ui.element("codex-credit").hidden, false);
    assert.equal(ui.element("hint-report").hidden, !projected.hint);
    if (projected.latestRecordedReset?.textExcerpt) {
      assert.equal(ui.element("last-state").textContent, projected.latestRecordedReset.textExcerpt);
    }
    if (projected.pendingAnnouncement) {
      assert.equal(ui.element("pending").textContent, projected.pendingAnnouncement.textExcerpt);
    } else {
      assert.equal(ui.element("pending").textContent, projected.upcomingState === "available" ? "No announcement reported" : "Unable to verify");
    }
    if (source.state !== "available") assert.match(ui.element("feedback").textContent, /Codex Reset/);
  }
  const recovered = projectResetRadar(combineResetRadar(snapshot(), codex, now));
  ui.app.result = async () => ({ structuredContent: recovered });
  ui.click("refresh");
  await settled();
  assert.equal(ui.element("last-state").textContent, excerpt);
  assert.equal(ui.element("feedback").hidden, true);
  assert.equal(ui.element("refresh").disabled, false);
  assert.ok(html.indexOf('id="codex-health"') > html.indexOf('<details'));
  const footerCredit = html.match(/<p[^>]*id="codex-credit"[\s\S]*?<\/p>/)?.[0];
  assert.ok(footerCredit);
  assert.doesNotMatch(footerCredit, /codex-health|available/);
  assert.match(footerCredit, /href="https:\/\/codex-reset.com\/"/);
});
