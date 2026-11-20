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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <input
          type="date"
          aria-label="Date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
        />
      </div>
      {isPending ? (
        <p className="text-zinc-500">Loading…</p>
      ) : error ? (
        <ErrorText>{error.message}</ErrorText>
      ) : (
        <>
          <p className="text-sm text-zinc-400">{booked.length} booked</p>
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {data.length === 0 && <li className="px-4 py-6 text-zinc-500">No appointments.</li>}
            {data.map((a) => (
              <li key={a.id} className={`flex gap-4 px-4 py-3 ${a.status === "cancelled" ? "opacity-40 line-through" : ""}`}>
                <span className="w-28 font-mono text-amber-400">
                  {formatSalonTime(a.startsAt)}–{formatSalonTime(a.endsAt)}
                </span>
                <span className="flex-1">{a.serviceName}</span>
                <span className="text-zinc-400">{a.customerName}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
