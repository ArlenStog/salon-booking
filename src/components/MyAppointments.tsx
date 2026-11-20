"use client";
import Link from "next/link";
import { useState } from "react";
import { useCancel, useMyAppointments, type Appointment } from "@/hooks/queries";
import { formatSalonDate, formatSalonTime } from "@/lib/time";
import { Button, ErrorText } from "./ui";

export function MyAppointments() {
  const { data, isPending, error } = useMyAppointments();
  const cancel = useCancel();
  const [now] = useState(() => Date.now());

  if (isPending) return <p className="text-zinc-500">Loading…</p>;
  if (error) return <ErrorText>{error.message}</ErrorText>;

  const upcoming = data.filter((a) => a.status === "booked" && new Date(a.startsAt).getTime() > now);
  const history = data.filter((a) => !upcoming.includes(a)).reverse();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">My appointments</h1>
        <Link href="/book" className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950">
          New booking
        </Link>
      </div>
      <ErrorText>{cancel.error?.message}</ErrorText>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-zinc-500">Nothing booked yet.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((a) => (
              <Row key={a.id} a={a}>
                <Button variant="ghost" onClick={() => cancel.mutate(a.id)}>
                  Cancel
                </Button>
              </Row>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Past &amp; cancelled</h2>
          <ul className="space-y-2 opacity-70">
            {history.map((a) => (
              <Row key={a.id} a={a}>
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  {a.status === "cancelled" ? "Cancelled" : "Done"}
                </span>
              </Row>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ a, children }: { a: Appointment; children: React.ReactNode }) {
  return (
    <li
      data-testid="appointment"
      className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
    >
      <div className="w-24 font-mono text-amber-400">{formatSalonTime(a.startsAt)}</div>
      <div className="flex-1">
        <p className="font-medium">{a.serviceName}</p>
        <p className="text-sm text-zinc-500">{formatSalonDate(a.startsAt)}</p>
      </div>
      {children}
    </li>
  );
}
