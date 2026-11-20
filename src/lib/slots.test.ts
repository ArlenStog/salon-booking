import { describe, expect, it } from "vitest";
import { availableSlots, isBookableSlot } from "./slots";
import { salonTimeToDate } from "./time";

const MONDAY = "2026-11-23";
const SATURDAY = "2026-11-21";
const SUNDAY = "2026-11-22";
const LONG_AGO = new Date("2020-01-01T00:00:00Z");

const at = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return salonTimeToDate(date, h * 60 + m);
};
const times = (slots: Date[]) =>
  slots.map((d) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Belgrade", hour: "2-digit", minute: "2-digit" }).format(d),
  );

describe("salonTimeToDate", () => {
  it("uses CET (UTC+1) in winter", () => {
    expect(at(MONDAY, "09:00").toISOString()).toBe("2026-11-23T08:00:00.000Z");
  });

  it("uses CEST (UTC+2) after the spring DST switch", () => {
    expect(at("2026-03-30", "09:00").toISOString()).toBe("2026-03-30T07:00:00.000Z");
  });
});

describe("availableSlots", () => {
  it("offers every half hour on a free weekday", () => {
    const slots = availableSlots({ date: MONDAY, durationMin: 30, booked: [], now: LONG_AGO });
    expect(slots).toHaveLength(16);
    expect(times(slots)[0]).toBe("09:00");
    expect(times(slots).at(-1)).toBe("16:30");
  });

  it("is closed on Sunday", () => {
    expect(availableSlots({ date: SUNDAY, durationMin: 30, booked: [], now: LONG_AGO })).toEqual([]);
  });

  it("only offers starts where the whole service fits before closing", () => {
    const slots = availableSlots({ date: SATURDAY, durationMin: 50, booked: [], now: LONG_AGO });
    expect(times(slots).at(-1)).toBe("13:00");
  });

  it("skips slots that overlap an existing booking", () => {
    const booked = [{ start: at(MONDAY, "10:00"), end: at(MONDAY, "10:30") }];
    const slots = times(availableSlots({ date: MONDAY, durationMin: 50, booked, now: LONG_AGO }));
    expect(slots).toContain("09:00"); // 09:00–09:50, ends before 10:00
    expect(slots).not.toContain("09:30"); // 09:30–10:20 would overlap
    expect(slots).not.toContain("10:00");
    expect(slots).toContain("10:30"); // back-to-back is fine
  });

  it("never offers times in the past", () => {
    const slots = availableSlots({ date: MONDAY, durationMin: 30, booked: [], now: at(MONDAY, "10:15") });
    expect(times(slots)[0]).toBe("10:30");
  });
});

describe("isBookableSlot", () => {
  it("rejects a start that is not on the slot grid", () => {
    const args = { date: MONDAY, durationMin: 30, booked: [], now: LONG_AGO };
    expect(isBookableSlot({ ...args, start: at(MONDAY, "09:30") })).toBe(true);
    expect(isBookableSlot({ ...args, start: at(MONDAY, "09:15") })).toBe(false);
  });
});
