import { salonTimeToDate, weekday } from "./time";

/** Opening hours in minutes after midnight, salon time. null = closed. */
export const OPENING_HOURS: Record<number, { open: number; close: number } | null> = {
  0: null, // Sunday
  1: { open: 9 * 60, close: 17 * 60 },
  2: { open: 9 * 60, close: 17 * 60 },
  3: { open: 9 * 60, close: 17 * 60 },
  4: { open: 9 * 60, close: 17 * 60 },
  5: { open: 9 * 60, close: 17 * 60 },
  6: { open: 9 * 60, close: 14 * 60 }, // Saturday
};

export const SLOT_STEP_MIN = 30;

export type Interval = { start: Date; end: Date };

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/**
 * Pure function — no DB, no clock — so it is easy to unit test.
 * Returns every start time on `date` where a service of `durationMin`
 * fits inside opening hours, doesn't overlap a booking, and isn't in the past.
 */
export function availableSlots(args: {
  date: string; // YYYY-MM-DD, salon calendar
  durationMin: number;
  booked: Interval[];
  now: Date;
  hours?: typeof OPENING_HOURS;
  stepMin?: number;
}): Date[] {
  const { date, durationMin, booked, now, hours = OPENING_HOURS, stepMin = SLOT_STEP_MIN } = args;
  const day = hours[weekday(date)];
  if (!day) return [];

  const slots: Date[] = [];
  for (let m = day.open; m + durationMin <= day.close; m += stepMin) {
    const start = salonTimeToDate(date, m);
    const end = new Date(start.getTime() + durationMin * 60_000);
    if (start <= now) continue;
    if (booked.some((b) => overlaps({ start, end }, b))) continue;
    slots.push(start);
  }
  return slots;
}

/** True if `start` is exactly one of the slots offered for that day. */
export function isBookableSlot(args: Parameters<typeof availableSlots>[0] & { start: Date }): boolean {
  return availableSlots(args).some((s) => s.getTime() === args.start.getTime());
}
