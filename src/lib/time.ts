/**
 * The salon lives in Belgrade, but servers (Vercel) run in UTC.
 * These helpers convert between "salon wall-clock time" and real instants,
 * correctly across daylight-saving changes, using only the built-in Intl API.
 */
export const SALON_TZ = "Europe/Belgrade";

/** Offset of the salon timezone from UTC at a given instant, in ms. */
function tzOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - (instant - (instant % 1000));
}

/** "2026-11-24" + 570 (minutes after midnight, salon time) -> Date */
export function salonTimeToDate(date: string, minutesAfterMidnight: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutesAfterMidnight);
  // Two passes handle the rare case where the offset differs across the guess.
  let instant = naive - tzOffsetMs(naive);
  instant = naive - tzOffsetMs(instant);
  return new Date(instant);
}

/** Date -> "YYYY-MM-DD" as seen on the salon's wall calendar. */
export function salonDateString(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SALON_TZ }).format(instant);
}

/** 0 = Sunday ... 6 = Saturday, for a "YYYY-MM-DD" date. */
export function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function formatSalonTime(instant: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: SALON_TZ, hour: "2-digit", minute: "2-digit" }).format(
    new Date(instant),
  );
}

export function formatSalonDate(instant: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(instant));
}
