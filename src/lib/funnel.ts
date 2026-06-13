// Funnel scheduling math (launch-reference.md Part 1).
//
// Used Node-side by the /api/subscribe capture route. The delivery Edge
// Function (Deno) mirrors this same math + the step machine — keep the two in
// sync (see supabase/functions/deliver-stories/funnel.ts).
//
// Free sequence, all sends at 9 PM subscriber-local time:
//   step 0 -> Free story #1   (signup night, or immediate if a late signup)
//   step 1 -> Free story #2   (+3 nights)
//   step 2 -> THE PITCH       (+2 nights -> night ~5)
//   step 3 -> occasional      (every ~5 weeks, until purchase/unsubscribe)

/** Pool the free sequence (story #1 + #2) draws from — see Pool B in the doc. */
export const FREE_POOL = "B";
/** Pools the occasional dormant emails may draw from. */
export const OCCASIONAL_POOLS = ["B", "C"] as const;

export const DELIVERY_HOUR = 21; // 9 PM local
export const STORY2_GAP_DAYS = 3; // free #1 -> free #2
export const PITCH_GAP_DAYS = 2; // free #2 -> pitch (lands ~night 5)
export const OCCASIONAL_GAP_DAYS = 35; // ~5 weeks between dormant sends

/** Local wall-clock parts of an instant in an IANA timezone. */
export function localParts(d: Date, tz: string): {
  dateStr: string; // YYYY-MM-DD (lexically comparable)
  hour: number;
  minute: number;
} {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { dateStr: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute) };
}

/** Add `days` to a YYYY-MM-DD string (noon-UTC anchor avoids DST edges). */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/**
 * The UTC instant of `hour:00` local time on YYYY-MM-DD in `tz`. Fixpoint on the
 * tz offset (two passes converge; 9 PM is far from any DST transition).
 */
export function localWallToUtc(dateStr: string, hour: number, tz: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const targetWall = Date.UTC(y, m - 1, d, hour, 0, 0);
  let ts = targetWall;
  for (let i = 0; i < 2; i++) {
    const lp = localParts(new Date(ts), tz);
    const [ly, lm, ld] = lp.dateStr.split("-").map(Number);
    const haveWall = Date.UTC(ly, lm - 1, ld, lp.hour, lp.minute);
    ts += targetWall - haveWall;
  }
  return new Date(ts);
}

/**
 * When the first free story should go out for a signup happening `now`.
 * Late-signup window (8:30 PM–1:59 AM local) -> send immediately (next cron
 * run, ≤15 min) with "you're just in time" framing. Otherwise queue for 9 PM
 * local today (signups only happen 2 AM–8:29 PM reach this branch).
 */
export function initialSchedule(now: Date, tz: string): { nextSendAt: Date; immediate: boolean } {
  const { hour, minute, dateStr } = localParts(now, tz);
  const lateWindow = (hour === 20 && minute >= 30) || hour >= 21 || hour < 2;
  if (lateWindow) return { nextSendAt: now, immediate: true };
  return { nextSendAt: localWallToUtc(dateStr, DELIVERY_HOUR, tz), immediate: false };
}
