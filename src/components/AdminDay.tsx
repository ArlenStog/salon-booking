"use client";
import { useState } from "react";
import { useDayAppointments } from "@/hooks/queries";
import { formatSalonTime, salonDateString } from "@/lib/time";
import { ErrorText } from "./ui";

export function AdminDay() {
  const [date, setDate] = useState(salonDateString(new Date()));
  const { data, isPending, error } = useDayAppointments(date);
  const booked = data?.filter((a) => a.status === "booked") ?? [];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Front desk</p>
          <h1 className="mt-3 font-display text-5xl">Schedule</h1>
        </div>
        <input
          type="date"
          aria-label="Date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="border-0 border-b border-ink/30 bg-transparent px-0 py-2 font-mono text-lg outline-none focus:border-ink"
        />
      </header>
      {isPending ? (
        <p className="eyebrow">Loading…</p>
      ) : error ? (
        <ErrorText>{error.message}</ErrorText>
      ) : (
        <section>
          <div className="flex items-baseline justify-between border-b border-ink pb-2">
            <span className="eyebrow text-ink">Time</span>
            <span className="eyebrow">{booked.length} booked</span>
          </div>
          <ul>
            {data.length === 0 && <li className="py-6 text-muted">No appointments.</li>}
            {data.map((a) => (
              <li
                key={a.id}
                className={`grid grid-cols-[7.5rem_1fr_auto] items-baseline gap-4 border-b border-rule py-4 ${
                  a.status === "cancelled" ? "text-muted line-through" : ""
                }`}
              >
                <span className="font-mono text-sm">
                  {formatSalonTime(a.startsAt)}–{formatSalonTime(a.endsAt)}
                </span>
                <span className="font-display text-lg">{a.serviceName}</span>
                <span className="text-sm">{a.customerName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
