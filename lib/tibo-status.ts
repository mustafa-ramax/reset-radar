// Step 1: one public read-only API. No background jobs, accounts or extra providers.
const URL_TIBO = "https://tibo.cc/api/v1/status";
const NOTE = "TIBO republishes third-party community observations, not official confirmation or your personal account's limits.";
// Conservative freshness check in addition to TIBO's own stale/upstream flags.
const MAX_PROVIDER_AGE_MS = 60 * 60 * 1000;

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? v as Record<string, unknown> : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.slice(0, 256) : null;
}

function time(v: unknown): string | null {
  const s = str(v);
  return s && /(?:Z|[+-]\\d{2}:\\d{2})$/i.test(s) && Number.isFinite(Date.parse(s)) ? s : null;
}

function record(v: unknown) {
  const r = obj(v);
  if (!r) return null;
  const s = obj(r.source);
  const url = s?.url ?? r.source_url;
  const sourceUrl = typeof url === "string" && /^https:\\/\\//i.test(url) && url.length <= 2048
    ? url : null;
  const item = {
    id: str(r.id),
    resetType: str(r.reset_type),
    announcedAt: time(r.announced_at) ?? time(r.observed_at),
    textExcerpt: typeof r.text === "string" ? r.text.slice(0, 200) : null,
    originalPostUrl: sourceUrl,
  };
  // An empty object isn't an announcement or a recorded reset.
  return Object.values(item).some((value) => value !== null && value !== "") ? item : null;
}

export async function getTiboStatus() {
  const checkedAt = new Date().toISOString();
  const unavailable = (reason: string) => ({
    provider: "TIBO", providerUrl: "https://tibo.cc/", checkedAt,
    state: "unavailable", latestRecordedReset: null, pendingAnnouncement: null,
    activeWatchPresent: false, providerFetchedAt: null, upstreamStatus: null,
    warning: reason, disclaimer: NOTE,
  });

  try {
    const response = await fetch(URL_TIBO, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return unavailable(
      response.status === 429 ? "TIBO rate-limited the request; status unknown."
        : "TIBO HTTP " + response.status + "; status unknown."
    );
    if (!(response.headers.get("content-type") ?? "").includes("application/json"))
      return unavailable("TIBO returned a non-JSON response; status unknown.");
    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > 131072) return unavailable("TIBO response too large; status unknown.");
    const text = await response.text();
    if (text.length > 131072) return unavailable("TIBO response too large; status unknown.");
    const envelope = obj(JSON.parse(text) as unknown);
    const data = obj(envelope?.data);
    if (!envelope || !data || typeof envelope.stale !== "boolean")
      return unavailable("TIBO returned invalid or empty data; status unknown.");

    const fetchedAt = time(envelope.fetched_at);
    const stale = envelope.stale || envelope.upstream_status !== "ok"
      || !fetchedAt || Date.now() - Date.parse(fetchedAt) > MAX_PROVIDER_AGE_MS;
    return {
      provider: "TIBO", providerUrl: "https://tibo.cc/", checkedAt,
      state: stale ? "stale" : "available",
      latestRecordedReset: record(data.latest_reset),
      pendingAnnouncement: record(data.scheduled_reset),
      activeWatchPresent: obj(data.active_watch) !== null,
      providerFetchedAt: fetchedAt,
      upstreamStatus: str(envelope.upstream_status),
      warning: stale ? "Provider data may be outdated; no current announcement is guaranteed." : null,
      disclaimer: NOTE,
    };
  } catch {
    return unavailable("Could not retrieve TIBO status; status unknown.");
  }
}
