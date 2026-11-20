"use client";
import Link from "next/link";
import { useState } from "react";
import { useCancel, useMyAppointments, type Appointment } from "@/hooks/queries";
import { formatSalonDate, formatSalonTime } from "@/lib/time";
import { ErrorText, StepHeading } from "./ui";

export function MyAppointments() {
  const { data, isPending, error } = useMyAppointments();
  const cancel = useCancel();
  const [now] = useState(() => Date.now());

  if (isPending) return <p className="eyebrow">Loading…</p>;
  if (error) return <ErrorText>{error.message}</ErrorText>;

  const upcoming = data.filter((a) => a.status === "booked" && new Date(a.startsAt).getTime() > now);
  const history = data.filter((a) => !upcoming.includes(a)).reverse();

  return (
    <div className="space-y-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-3 font-display text-5xl">My appointments</h1>
        </div>
        <Link
          href="/book"
          className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-paper hover:bg-accent"
        >
          New booking
        </Link>
      </header>
      <ErrorText>{cancel.error?.message}</ErrorText>

      <section className="space-y-2">
        <StepHeading n="01">Upcoming</StepHeading>
        {upcoming.length === 0 ? (
          <p className="py-4 text-muted">Nothing booked yet.</p>
        ) : (
          <ul>
            {upcoming.map((a) => (
              <Row key={a.id} a={a}>
                <button
                  onClick={() => cancel.mutate(a.id)}
                  className="font-mono text-xs uppercase tracking-[0.16em] underline decoration-1 underline-offset-4 hover:text-accent"
                >
                  Cancel
                </button>
              </Row>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section className="space-y-2">
          <StepHeading n="02">Past &amp; cancelled</StepHeading>
          <ul className="text-muted">
            {history.map((a) => (
              <Row key={a.id} a={a}>
                <span className={`font-mono text-xs uppercase tracking-[0.16em] ${a.status === "cancelled" ? "text-accent" : ""}`}>
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
    <li data-testid="appointment" className="flex items-baseline gap-6 border-b border-rule py-5">
      <span className="w-16 font-mono text-lg">{formatSalonTime(a.startsAt)}</span>
      <div className="flex-1">
        <p className="font-display text-xl">{a.serviceName}</p>
        <p className="mt-0.5 font-mono text-xs text-muted">{formatSalonDate(a.startsAt)}</p>
      </div>
      {children}
    </li>
  );
}
