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
const prettyTime = (value: unknown): string => {
  if (typeof value !== "string") return "Unknown";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Unknown";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium", timeStyle: "short",
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
  const badge = byId("health");
  badge.className = "pill " + s.state;
  badge.textContent = s.state === "available" ? "Source available" : s.state === "stale" ? "Stale data" : "Source unavailable";

  const post = s.latestRecordedReset;
  if (s.state === "unavailable") {
    set("last-time", "Status unavailable");
    set("last-detail", "No current source record can be verified.");
  } else if (post?.announcedAt) {
    set("last-time", prettyTime(post.announcedAt));
    set("last-detail", (post.resetType ? post.resetType[0].toUpperCase() + post.resetType.slice(1) + " · " : "") + "Completion/recorded post published (not independently verified reset time)");
  } else {
    set("last-time", "No record returned");
    set("last-detail", "Latest recorded event is unknown from this provider response.");
  }
  const excerpt = byId("last-excerpt");
  excerpt.hidden = s.state === "unavailable" || !post?.textExcerpt;
  excerpt.textContent = excerpt.hidden ? "" : "“" + post?.textExcerpt + "”";
  showLink(link, s.state === "unavailable" ? null : post?.originalPostUrl);

  if (s.state !== "available") {
    set("pending", "Unknown");
    set("pending-detail", "Source health is uncertain. Cannot confirm whether an upcoming announcement exists.");
    showLink(pendingLink, null);
  } else if (s.pendingAnnouncement) {
    set("pending", "Announcement recorded");
    set("pending-detail", s.pendingAnnouncement.announcedAt
      ? "Published " + prettyTime(s.pendingAnnouncement.announcedAt) + " · not a reset guarantee."
      : "Source-reported announcement · execution time not verified.");
    showLink(pendingLink, s.pendingAnnouncement.originalPostUrl);
  } else {
    set("pending", "No upcoming announcement returned");
    set("pending-detail", "The available feed returned none. This does not prove complete coverage or a future reset date.");
    showLink(pendingLink, null);
  }

  set("upstream", s.upstreamStatus ?? "Unknown");
  set("source-fetched", prettyTime(s.providerFetchedAt));
  set("radar-checked", prettyTime(s.checkedAt));
  set("watch", s.state === "unavailable" ? "Unknown" : s.activeWatchPresent ? "Present in feed" : "None returned");
  notice(s.warning ?? (s.state === "unavailable" ? "TIBO status unavailable. Please try again later." : null), s.state !== "available");
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
  renderToolResult(result);
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
