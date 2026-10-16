import { App, applyDocumentTheme, applyHostStyleVariables, type McpUiHostContext } from "@modelcontextprotocol/ext-apps";

type Item = {
  id?: string | null;
  resetType?: string | null;
  announcedAt?: string | null;
  textExcerpt?: string | null;
  originalPostUrl?: string | null;
};
type Snapshot = {
  provider: "TIBO";
  checkedAt?: string | null;
  state: "available" | "stale" | "unavailable";
  upstreamStatus?: string | null;
  providerFetchedAt?: string | null;
  latestRecordedReset?: Item | null;
  pendingAnnouncement?: Item | null;
  activeWatchPresent?: boolean;
  warning?: string | null;
};
const app = new App({ name: "Reset Radar", version: "0.1.0" });
const applyHostTheme = (context: McpUiHostContext | undefined) => {
  if (context?.theme) applyDocumentTheme(context.theme);
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
};
app.onhostcontextchanged = context => applyHostTheme(context);
const byId = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (!element) throw new Error("Missing element: " + id);
  return element;
};
const refreshButton = byId("refresh") as HTMLButtonElement;
const link = byId("source-link") as HTMLAnchorElement;
const pendingLink = byId("pending-link") as HTMLAnchorElement;
const feedback = byId("feedback");

const safeLink = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
};
// Validate optional display fields at the bridge boundary, including partial host results.
const displayItem = (value: unknown): Item | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const text = (field: string, limit: number) => typeof record[field] === "string"
    ? (record[field] as string).trim().slice(0, limit) || null : null;
  const item = {
    id: text("id", 256), resetType: text("resetType", 256),
    announcedAt: text("announcedAt", 256),
    textExcerpt: typeof record.textExcerpt === "string" && record.textExcerpt.trim()
      ? record.textExcerpt.slice(0, 200) : null,
    originalPostUrl: typeof record.originalPostUrl === "string" && record.originalPostUrl.length <= 2048
      ? record.originalPostUrl : null,
  };
  return Object.values(item).some(value => value !== null) ? item : null;
};
const prettyTime = (value: unknown, full = false): string => {
  if (typeof value !== "string") return "Unknown";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Unknown";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: full ? "full" : "medium", timeStyle: full ? "long" : "short",
    }).format(new Date(time));
  } catch {
    return new Date(time).toISOString();
  }
};
const showLink = (element: HTMLAnchorElement, url: unknown) => {
  const target = safeLink(url);
  element.hidden = !target;
  if (target) element.href = target;
  else element.removeAttribute("href");
  const hostname = target ? new URL(target).hostname : "";
  const isX = ["x.com", "twitter.com"].some(domain => hostname === domain || hostname.endsWith("." + domain));
  element.textContent = isX ? "View original X post ↗" : "View original source ↗";
};
const set = (id: string, text: string) => { byId(id).textContent = text; };
const notice = (message: string | null, warning = false) => {
  feedback.hidden = !message;
  feedback.classList.toggle("warning", warning);
  feedback.textContent = message ?? "";
};
function usable(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.provider === "TIBO"
    && (record.state === "available" || record.state === "stale" || record.state === "unavailable");
}
function render(s: Snapshot) {
  set("health", s.state === "available" ? "Source available" : s.state === "stale" ? "Source stale" : "Source unavailable");
  const post = s.state === "unavailable" ? null : displayItem(s.latestRecordedReset);
  const pending = displayItem(s.pendingAnnouncement);
  byId("upcoming").dataset.state = s.state !== "available" ? "uncertain" : pending ? "announced" : "quiet";
  const lastState = byId("last-state");
  lastState.textContent = s.state === "unavailable" ? "Unavailable"
    : !post ? "No source record returned"
    : post.textExcerpt ? post.textExcerpt
    : post.resetType?.toLowerCase() === "completion" ? "Completion post reported"
    : post.resetType?.toLowerCase() === "recorded" ? "Recorded post" : "Reset-related post reported";
  byId("last-context").hidden = s.state !== "stale" || !post;
  const lastTime = byId("last-time");
  lastTime.hidden = !post;
  const postTime = prettyTime(post?.announcedAt);
  lastTime.textContent = !post ? "" : postTime === "Unknown" ? "Post date unknown" : "Post date " + postTime;
  showLink(link, post?.originalPostUrl);

  const detail = byId("last-detail");
  detail.hidden = !post;
  detail.textContent = post ? "Latest post timestamp: " + prettyTime(post.announcedAt, true)
    + (post.resetType ? " · Source classification: " + post.resetType : "") : "";

  if (s.state !== "available") {
    set("pending", "Unable to verify");
    byId("pending-detail").hidden = true;
    set("pending-detail", "");
    showLink(pendingLink, null);
  } else if (pending) {
    byId("pending-detail").hidden = false;
    set("pending", pending.textExcerpt ?? "Announcement reported");
    const timestamp = prettyTime(pending.announcedAt);
    set("pending-detail", timestamp === "Unknown" ? "Post date unknown" : "Post date " + timestamp);
    showLink(pendingLink, pending.originalPostUrl);
  } else {
    byId("pending-detail").hidden = false;
    set("pending", "No announcement reported");
    set("pending-detail", "In the current TIBO feed");
    showLink(pendingLink, null);
  }

  set("upstream", typeof s.upstreamStatus === "string" ? s.upstreamStatus : "Unknown");
  set("source-fetched", prettyTime(s.providerFetchedAt, true));
  set("radar-checked", prettyTime(s.checkedAt, true));
  const updated = s.state === "unavailable" ? "Unknown" : prettyTime(s.providerFetchedAt);
  set("source-updated", updated === "Unknown" ? "Source update time unknown." : "Updated " + updated);
  const warning = typeof s.warning === "string" && s.warning.trim() ? s.warning : null;
  const sourceWarning = byId("source-warning");
  sourceWarning.hidden = !warning;
  sourceWarning.textContent = warning ?? "";
  notice(s.state === "stale" ? "TIBO data is stale. Try Refresh."
    : s.state === "unavailable" ? "Source unavailable. Try Refresh." : warning, s.state !== "available");
}
function renderHostError() {
  render({ provider: "TIBO", state: "unavailable", warning: "Could not reach the Reset Radar MCP tool. Check the plugin connection and try Refresh." });
}
const renderToolResult = (result: { structuredContent?: unknown; isError?: boolean }) => {
  if (!result.isError && usable(result.structuredContent)) {
    render(result.structuredContent);
    return true;
  }
  return false;
};
let inFlight = false;
async function refresh() {
  if (inFlight) return;
  inFlight = true;
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing…";
  try {
    const result = await app.callServerTool({ name: "get_tibo_status", arguments: {} });
    if (!renderToolResult(result)) renderHostError();
  } catch {
    renderHostError();
  } finally {
    inFlight = false;
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ Refresh";
  }
}

app.ontoolresult = result => {
  // Initial MCP tool data may arrive when the host opens the sidebar/panel.
  // A manual refresh always uses the same separately tested read-only data tool.
  if (!renderToolResult(result)) renderHostError();
};
refreshButton.addEventListener("click", () => { void refresh(); });

for (const element of [link, pendingLink, byId("tibo-link") as HTMLAnchorElement]) {
  element.addEventListener("click", event => {
    const href = (event.currentTarget as HTMLAnchorElement).href;
    if (!safeLink(href)) return;
    event.preventDefault();
    void app.openLink({ url: href }).then(result => {
      if (result.isError) notice("The host did not open that link. You can copy it from the link.", true);
    }).catch(() => notice("Unable to open the link through this host.", true));
  });
}

// No timers, subscriptions, polling, browser-to-TIBO fetches or storage.
void app.connect().then(() => {
  applyHostTheme(app.getHostContext());
  return refresh();
}).catch(renderHostError);
