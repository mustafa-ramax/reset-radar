import { z } from "zod";

// Only source in Step 1. No credential, user account or background job.
const STATUS_URL = "https://tibo.cc/api/v1/status";
const SOURCE_PAGE = "https://tibo.cc/";
const MAX_RESPONSE_BYTES = 128 * 1024;
const TIMEOUT_MS = 8_000;

const envelopeSchema = z.object({
  data: z.object({
    latest_reset: z.unknown().nullish(),
    scheduled_reset: z.unknown().nullish(),
    active_watch: z.unknown().nullish(),
  }).nullable(),
  stale: z.boolean(),
  upstream_status: z.string(),
  fetched_at: z.string().nullish(),
  last_successful_update: z.string().nullish(),
  upstream_generated_at: z.string().nullish(),
}).passthrough();

type SourceRecord = {
  id: string | null;
  resetType: string | null;
  announcedAt: string | null;
  textExcerpt: string | null;
  originalPostUrl: string | null;
};

export type TiboStatus = {
  provider: "TIBO";
  providerUrl: string;
  checkedAt: string;
  state: "available" | "stale" | "unavailable";
  upstreamStatus: string | null;
  providerFetchedAt: string | null;
  providerLastSuccessfulUpdate: string | null;
  upstreamGeneratedAt: string | null;
  latestRecordedReset: SourceRecord | null;
  pendingAnnouncement: SourceRecord | null;
  activeWatchPresent: boolean;
  warning: string | null;
  disclaimer: string;
};

const DISCLAIMER = "Public, third-party community records only. Announcement/observation times do not establish when personal account limits reset. Predictions are not promises.";

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function text(value: unknown, max = 240): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max) : null;
}

function isoTime(value: unknown): string | null {
  const v = text(value, 80);
  return v && /(?:Z|[+-]\d{2}:\d{2})$/i.test(v) && Number.isFinite(Date.parse(v))
    ? v : null;
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function record(value: unknown): SourceRecord | null {
  const obj = object(value);
  if (!obj) return null;
  // Provider can wrap a source record in an outer status object.
  const data = object(obj.record) ?? obj;
  const originalSource = object(data.source);
  return {
    id: text(data.id, 100),
    resetType: text(data.reset_type, 80),
    announcedAt: isoTime(data.announced_at) ?? isoTime(data.observed_at),
    textExcerpt: text(data.text, 200),
    originalPostUrl: httpsUrl(originalSource?.url) ?? httpsUrl(data.source_url),
  };
}

function unavailable(checkedAt: string, warning: string): TiboStatus {
  return {
    provider: "TIBO",
    providerUrl: SOURCE_PAGE,
    checkedAt,
    state: "unavailable",
    upstreamStatus: null,
    providerFetchedAt: null,
    providerLastSuccessfulUpdate: null,
    upstreamGeneratedAt: null,
    latestRecordedReset: null,
    pendingAnnouncement: null,
    activeWatchPresent: false,
    warning,
    disclaimer: DISCLAIMER,
  };
}

async function readBounded(response: Response): Promise<string> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) throw new Error("too_large");
  if (!response.body) throw new Error("empty_body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let contents = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("too_large");
    }
    contents += decoder.decode(value, { stream: true });
  }
  return contents + decoder.decode();
}

/** One bounded, cached public REST read. Never infer a negative status from null data. */
export async function getTiboStatus(): Promise<TiboStatus> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(STATUS_URL, {
      headers: { Accept: "application/json", "User-Agent": "ResetRadar/0.1 (+https://github.com/mustafa-ramax/reset-radar)" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      return unavailable(checkedAt, response.status === 429
        ? "TIBO rate-limited the request; status is unknown."
        : "TIBO is unavailable (HTTP " + response.status + "); status is unknown.");
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return unavailable(checkedAt, "TIBO returned non-JSON data; status is unknown.");
    const raw = JSON.parse(await readBounded(response)) as unknown;
    const parsed = envelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return unavailable(checkedAt, "TIBO returned invalid status data; status is unknown.");
    }
    const payload = parsed.data;
    if (!payload.data) {
      return unavailable(checkedAt, "TIBO returned incomplete status data; status is unknown.");
    }
    const isStale = payload.stale || payload.upstream_status !== "ok";
    return {
      provider: "TIBO",
      providerUrl: SOURCE_PAGE,
      checkedAt,
      state: isStale ? "stale" : "available",
      upstreamStatus: text(payload.upstream_status, 100),
      providerFetchedAt: isoTime(payload.fetched_at),
      providerLastSuccessfulUpdate: isoTime(payload.last_successful_update),
      upstreamGeneratedAt: isoTime(payload.upstream_generated_at),
      latestRecordedReset: record(payload.data.latest_reset),
      pendingAnnouncement: record(payload.data.scheduled_reset),
      activeWatchPresent: object(payload.data.active_watch) !== null,
      warning: isStale ? "TIBO's data is stale or upstream health is uncertain. Do not assume an announcement is current." : null,
      disclaimer: DISCLAIMER,
    };
  } catch {
    // Deliberately omit stack traces, upstream response bodies and network details.
    return unavailable(checkedAt, "Unable to read TIBO right now; reset status is unknown.");
  }
}
