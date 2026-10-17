const FEED_URL = "https://codex-reset.com/api/feed";
const SOURCE = "https://codex-reset.com/";
const MIN_CACHE_MS = 60_000;
const MAX_BYTES = 262_144;
type State = "available" | "stale" | "unavailable";
type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}
function text(value: unknown, limit = 256): string | null {
  return typeof value === "string" && value.trim() ? value.slice(0, limit) : null;
}
function timestamp(value: unknown): string | null {
  const result = text(value);
  return result && /(?:Z|[+-]\d{2}:\d{2})$/i.test(result) && Number.isFinite(Date.parse(result)) ? result : null;
}
function sourceUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}

export type CodexRecord = {
  id: string;
  originalPostUrl: string | null;
  text: string | null;
  publishedAt: string | null;
  classification: "recorded" | "hint" | "related" | "unrelated" | "unclassified";
  // Keep the original public classifications separate from our conservative display category.
  kind: string | null;
  event: {
    group: string | null; type: string | null; announcementState: string | null;
    announcedAt: string | null; summary: string | null; source: string | null; originalPostUrl: string | null;
  } | null;
  verificationStatus: string | null;
};
export type CodexResetStatus = {
  provider: "Codex Reset"; source: string; attribution: string; checkedAt: string;
  state: State; providerFetchedAt: string | null; publishedCheckedAt: string | null;
  publishedExpiresAt: string | null; newestPostAt: string | null; sourceScope: string | null;
  records: CodexRecord[];
  signal: { id: string | null; active: boolean | null; at: string | null;
    text: string | null; originalPostUrl: string | null; kind: string | null } | null;
  warning: string | null; retryAt: string | null;
};

async function boundedBody(response: Response): Promise<string> {
  if (Number(response.headers.get("content-length")) > MAX_BYTES) throw new Error("Oversize response");
  if (!response.body) throw new Error("Empty response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("Oversize response"); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function normalise(value: unknown, headers: Headers, checkedAt: string): CodexResetStatus {
  const feed = object(value);
  if (!feed || feed.version !== 1 || typeof feed.stale !== "boolean"
    || !Array.isArray(feed.tweets) || !Array.isArray(feed.events)
    || feed.tweets.length > 200 || feed.events.length > 200) throw new Error("Invalid envelope");
  const tweets = new Map<string, JsonObject>();
  const events = new Map<string, JsonObject>();
  for (const [rows, target] of [[feed.tweets, tweets], [feed.events, events]] as const) {
    for (const row of rows) {
      const item = object(row);
      const id = text(item?.id);
      if (!item || !id || target.has(id)) throw new Error("Invalid or duplicate record ID");
      target.set(id, item);
    }
  }
  const records: CodexRecord[] = [];
  for (const id of new Set([...tweets.keys(), ...events.keys()])) {
    const tweet = tweets.get(id);
    const event = events.get(id);
    const kind = text(tweet?.kind);
    const recorded = event?.group === "reset" && event.announcement_state === "announced";
    records.push({
      id, originalPostUrl: sourceUrl(tweet?.url) ?? sourceUrl(event?.url),
      text: text(tweet?.text, 16_384), publishedAt: timestamp(tweet?.at),
      classification: recorded ? "recorded" : kind === "signal" ? "hint"
        : event?.group === "reset" ? "unclassified" : kind === "other" ? "unrelated"
        : ["boost", "limits", "banked", "codex"].includes(kind ?? "") ? "related" : "unclassified",
      kind, verificationStatus: text(tweet?.reset_verification_status),
      event: event ? {
        group: text(event.group), type: text(event.type), announcementState: text(event.announcement_state),
        announcedAt: timestamp(event.announced_at), summary: text(event.summary, 16_384), source: text(event.source),
        originalPostUrl: sourceUrl(event.url),
      } : null,
    });
  }
  const signal = object(feed.signal);
  return {
    provider: "Codex Reset", source: SOURCE, attribution: "Data: codex-reset.com",
    checkedAt, state: feed.stale ? "stale" : "available",
    providerFetchedAt: timestamp(feed.fetched_at),
    publishedCheckedAt: timestamp(headers.get("x-published-checked-at")),
    publishedExpiresAt: timestamp(headers.get("x-published-expires-at")),
    newestPostAt: timestamp(feed.newest_post_at), sourceScope: text(feed.source_scope), records,
    signal: signal ? {
      id: text(signal.tweet_id), active: typeof signal.active === "boolean" ? signal.active : null,
      at: timestamp(signal.at), text: text(signal.summary, 16_384),
      originalPostUrl: sourceUrl(signal.url), kind: text(signal.kind),
    } : null,
    warning: null, retryAt: null,
  };
}

function assessFreshness(status: CodexResetStatus, now: number): CodexResetStatus {
  if (status.state === "unavailable") return status;
  const fetched = Date.parse(status.providerFetchedAt ?? "");
  const published = Date.parse(status.publishedCheckedAt ?? "");
  const expires = Date.parse(status.publishedExpiresAt ?? "");
  // Missing/contradictory clocks are unknown; fresh publication alone cannot refresh stale ingestion.
  const stale = status.state === "stale" || !Number.isFinite(fetched) || !Number.isFinite(published)
    || !Number.isFinite(expires) || fetched > now + MIN_CACHE_MS || published > now + MIN_CACHE_MS
    || expires <= published || expires <= now || now - fetched > 5 * MIN_CACHE_MS
    || now - published > 5 * MIN_CACHE_MS;
  return { ...status, state: stale ? "stale" : "available",
    warning: stale ? "Codex Reset data is stale or freshness could not be verified." : null };
}

// One bounded cache and in-flight request per server instance; no polling or timers.
// Next's shared fetch cache also revalidates no more often than once a minute.
export function createCodexResetReader(
  request: typeof fetch = (input, init) => fetch(input, init),
  clock: () => number = Date.now,
) {
  let cached: CodexResetStatus | null = null;
  let cacheUntil = 0;
  let inFlight: Promise<CodexResetStatus> | null = null;
  async function read(): Promise<CodexResetStatus> {
    const now = clock();
    const checkedAt = new Date(now).toISOString();
    const unavailable = (warning: string, retryAt: string | null = null): CodexResetStatus => ({
      provider: "Codex Reset", source: SOURCE, attribution: "Data: codex-reset.com", checkedAt,
      state: "unavailable", providerFetchedAt: null, publishedCheckedAt: null, publishedExpiresAt: null,
      newestPostAt: null, sourceScope: null, records: [], signal: null, warning, retryAt,
    });
    let result: CodexResetStatus;
    let retryUntil = now + MIN_CACHE_MS;
    try {
      const response = await request(FEED_URL, {
        headers: { Accept: "application/json", "User-Agent": "ResetRadar/0.0.1 (+https://github.com/mustafa-ramax/reset-radar)" },
        next: { revalidate: 60 }, signal: AbortSignal.timeout(8000), redirect: "error",
      });
      if (!response.ok) {
        const retry = response.headers.get("retry-after")?.slice(0, 128);
        if (response.status === 429 && retry) {
          const until = /^\d+$/.test(retry) ? now + Number(retry) * 1000 : Date.parse(retry);
          if (Number.isFinite(until) && until <= 8.64e15) retryUntil = Math.max(retryUntil, until);
        }
        await response.body?.cancel();
        result = unavailable(response.status === 429 ? "Codex Reset rate-limited the request; coverage unknown."
          : "Codex Reset HTTP " + response.status + "; coverage unknown.",
        response.status === 429 ? new Date(retryUntil).toISOString() : null);
      } else if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
        await response.body?.cancel();
        result = unavailable("Codex Reset returned non-JSON data; coverage unknown.");
      } else {
        result = normalise(JSON.parse(await boundedBody(response)) as unknown, response.headers, checkedAt);
      }
    } catch { result = unavailable("Could not validate or retrieve Codex Reset data; coverage unknown."); }
    cached = result;
    cacheUntil = Math.max(clock() + MIN_CACHE_MS, retryUntil);
    return assessFreshness(result, clock());
  }
  return async (): Promise<CodexResetStatus> => {
    if (cached && clock() < cacheUntil) return assessFreshness(cached, clock());
    if (!inFlight) inFlight = read().finally(() => { inFlight = null; });
    return inFlight;
  };
}

export const getCodexResetStatus = createCodexResetReader();
