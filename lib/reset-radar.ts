import { getTiboStatus } from "./tibo-status";
import { getCodexResetStatus, type CodexResetStatus } from "./codex-reset-status";

type TiboStatus = Awaited<ReturnType<typeof getTiboStatus>>;
type TiboItem = NonNullable<TiboStatus["latestRecordedReset"]>;
type Evidence = TiboItem & {
  provider: "TIBO" | "Codex Reset";
  providerState: string;
  providerFetchedAt: string | null;
  classification: string;
  textBasis: "original post" | "provider summary";
};

// Match original X post identities across aliases, ignoring tracking queries.
// Different posts about the same reset are not independently verified or merged.
export function originalPostKey(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    const host = parsed.hostname;
    if (["x.com", "twitter.com"].some(domain => host === domain || host.endsWith("." + domain))) {
      const id = parsed.pathname.match(/^\/[^/]+\/status\/(\d+)\/?$/)?.[1];
      if (id) return "x:" + id;
    }
    parsed.hash = "";
    return parsed.toString();
  } catch { return null; }
}

export function combineResetRadar(tibo: TiboStatus, codexReset: CodexResetStatus, now = Date.now()) {
  const tiboEvidence = (item: TiboItem, classification: string): Evidence => ({
    ...item, provider: "TIBO", providerState: tibo.state, providerFetchedAt: tibo.providerFetchedAt,
    classification, textBasis: "original post",
  });
  const recorded = codexReset.records.filter(record => record.classification === "recorded"
    && record.event?.announcedAt && Date.parse(record.event.announcedAt) <= now
    && record.originalPostUrl).sort((a, b) => Date.parse(b.event!.announcedAt!) - Date.parse(a.event!.announcedAt!));
  const fallback = recorded[0];
  // Any usable TIBO history remains primary, even when it is stale. Never replace it on recency guesses.
  const latest: Evidence | null = tibo.state !== "unavailable" && tibo.latestRecordedReset
    ? tiboEvidence(tibo.latestRecordedReset, "recorded")
    : codexReset.state !== "unavailable" && fallback ? {
      id: fallback.id, resetType: "recorded", announcedAt: fallback.publishedAt,
      textExcerpt: (fallback.text ?? fallback.event!.summary)?.slice(0, 200) ?? null,
      originalPostUrl: fallback.originalPostUrl, provider: "Codex Reset", providerState: codexReset.state,
      providerFetchedAt: codexReset.providerFetchedAt, classification: "recorded",
      textBasis: fallback.text ? "original post" : "provider summary",
    } : null;
  const latestKey = originalPostKey(latest?.originalPostUrl ?? null);
  const pendingKey = originalPostKey(tibo.pendingAnnouncement?.originalPostUrl ?? null);
  const conflictingPending = codexReset.state === "available" && (codexReset.records.some(record => pendingKey
    && originalPostKey(record.originalPostUrl) === pendingKey
    && (record.classification === "recorded" || record.verificationStatus === "expired"))
    || !!(pendingKey && pendingKey === originalPostKey(codexReset.signal?.originalPostUrl ?? null)
      && codexReset.signal?.active === false));
  const duplicateLatest = !!(pendingKey && pendingKey === latestKey)
    || !!(latest?.id && latest.id === tibo.pendingAnnouncement?.id);
  // Codex signals never create pending announcements. Avoid promoting a duplicate of recorded evidence.
  const pending = tibo.state === "available" && tibo.pendingAnnouncement
    && !duplicateLatest && !conflictingPending
    ? tiboEvidence(tibo.pendingAnnouncement, "announcement") : null;
  const signal = codexReset.signal;
  const signalRecord = signal?.id ? codexReset.records.find(record => record.id === signal.id) : null;
  const signalKey = originalPostKey(signal?.originalPostUrl ?? null);
  const signalTime = Date.parse(signal?.at ?? "");
  const latestTime = Date.parse(latest?.announcedAt ?? "");
  // 24 hours is a local display bound, not a promised reset deadline or upstream expiry claim.
  const hint = codexReset.state === "available" && signal?.active === true && signal.kind === "signal"
    && signal.text && signal.originalPostUrl && Number.isFinite(signalTime) && signalTime <= now
    && now - signalTime <= 24 * 60 * 60 * 1000
    && (!Number.isFinite(latestTime) || signalTime > latestTime)
    && signalRecord?.classification === "hint" && signalRecord.verificationStatus !== "expired"
    && Date.parse(signalRecord.publishedAt ?? "") === signalTime
    && originalPostKey(signalRecord.originalPostUrl) === signalKey
    && signalKey !== latestKey && signalKey !== originalPostKey(pending?.originalPostUrl ?? null)
    ? { id: signal.id, textExcerpt: signal.text.slice(0, 200), announcedAt: signal.at,
      originalPostUrl: signal.originalPostUrl, provider: "Codex Reset" as const, classification: "hint" } : null;
  const duplicates = codexReset.records.flatMap(record => {
    const key = originalPostKey(record.originalPostUrl);
    const matches = [tibo.latestRecordedReset, tibo.pendingAnnouncement].filter(item => key
      && originalPostKey(item?.originalPostUrl ?? null) === key);
    return matches.length ? [{ originalPostKey: key, codexResetId: record.id,
      codexResetClassification: record.classification, tiboIds: matches.map(item => item!.id) }] : [];
  });
  const states = [tibo.state, codexReset.state];
  return {
    provider: "Reset Radar" as const, checkedAt: new Date(now).toISOString(),
    state: states.includes("available") ? "available" : states.includes("stale") ? "stale" : "unavailable",
    providers: { tibo, codexReset }, latestRecordedReset: latest, pendingAnnouncement: pending, hint,
    upcomingState: tibo.state === "available" && !duplicateLatest && !conflictingPending ? "available" : "unknown",
    upcomingWarning: duplicateLatest || conflictingPending ? "Source classifications overlap or differ; upcoming status is unknown." : null,
    duplicates, source: "https://codex-reset.com/", attribution: "Data: codex-reset.com",
    disclaimer: "Community source reports, not independent confirmation or personal quota access. Providers may relay the same original posts; agreement is not independent evidence. Hints are not confirmed announcements.",
  };
}

export async function getResetRadar() {
  const [tibo, codexReset] = await Promise.all([getTiboStatus(), getCodexResetStatus()]);
  return combineResetRadar(tibo, codexReset);
}
