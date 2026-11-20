"use client";
import Link from "next/link";
import { useState } from "react";
import { useAiSuggest, useBook, useServices, useSlots } from "@/hooks/queries";
import { formatSalonDate, formatSalonTime, salonDateString } from "@/lib/time";
import { Button, ErrorText, Panel, StepHeading } from "./ui";

export function BookingFlow({ aiEnabled }: { aiEnabled: boolean }) {
  const today = salonDateString(new Date());
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiSlots, setAiSlots] = useState<string[]>([]);

  const services = useServices();
  const slots = useSlots(serviceId, date);
  const book = useBook();
  const ai = useAiSuggest();

  const selectedService = services.data?.find((s) => s.id === serviceId);

  function pick(next: { serviceId?: number | null; date?: string }) {
    if (next.serviceId !== undefined) setServiceId(next.serviceId);
    if (next.date !== undefined) setDate(next.date);
    setSlot(null);
    setAiSlots([]);
    book.reset();
  }

  function askAi(e: React.FormEvent) {
    e.preventDefault();
    ai.mutate(aiText, {
      onSuccess: (s) => {
        pick({ serviceId: s.serviceId ?? serviceId, date: s.date ?? date });
        setAiSlots(s.slots);
        if (s.slots.length === 1) setSlot(s.slots[0]);
      },
    });
  }

  if (book.isSuccess && selectedService && slot) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <p className="eyebrow">Confirmed</p>
        <h1 className="mt-4 font-display text-5xl">You’re booked.</h1>
        <p className="mt-6 font-mono text-sm" data-testid="confirmation">
          {selectedService.name} · {formatSalonDate(slot)} at {formatSalonTime(slot)}
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href="/appointments"
            className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-paper hover:bg-accent"
          >
            My appointments
          </Link>
          <Button variant="ghost" onClick={() => pick({ serviceId: null })}>
            Book another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow">Reservation</p>
        <h1 className="mt-3 font-display text-5xl">Book a chair</h1>
      </header>

      <Panel className="bg-paper-deep/60">
        <form onSubmit={askAi}>
          <label htmlFor="ai" className="eyebrow block text-ink">
            Describe what you want
          </label>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
            <input
              id="ai"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={!aiEnabled}
              placeholder="haircut and beard next friday after 2pm"
              className="flex-1 border-0 border-b border-ink/30 bg-transparent px-0 py-2 font-display text-xl italic outline-none placeholder:text-muted/50 focus:border-ink disabled:opacity-50"
            />
            <Button type="submit" disabled={!aiEnabled || ai.isPending || aiText.trim().length < 3}>
              {ai.isPending ? "Thinking…" : "Find a time"}
            </Button>
          </div>
          {!aiEnabled && (
            <p className="mt-3 text-xs text-muted">Booking by sentence is switched off on this deployment.</p>
          )}
          {ai.data && (
            <p className="mt-4 text-sm" data-testid="ai-reply">
              {ai.data.reply}
            </p>
          )}
          <div className="mt-3">
            <ErrorText>{ai.error?.message}</ErrorText>
          </div>
        </form>
      </Panel>

      <section className="space-y-2">
        <StepHeading n="01">Service</StepHeading>
        <ul>
          {services.data?.map((s) => {
            const on = s.id === serviceId;
            return (
              <li key={s.id}>
                <button
                  onClick={() => pick({ serviceId: s.id })}
                  aria-pressed={on}
                  className={`flex w-full items-baseline border-b border-rule px-3 py-4 text-left transition-colors ${
                    on ? "bg-ink text-paper" : "hover:bg-paper-deep"
                  }`}
                >
                  <span className="font-display text-xl">{s.name}</span>
                  <span className="leader" aria-hidden />
                  <span className="font-mono">{s.priceRsd} RSD</span>
                  <span className={`ml-4 w-14 text-right font-mono text-xs ${on ? "text-paper/70" : "text-muted"}`}>
                    {s.durationMin} min
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-5">
        <StepHeading n="02">Day</StepHeading>
        <input
          type="date"
          aria-label="Date"
          value={date}
          min={today}
          onChange={(e) => e.target.value && pick({ date: e.target.value })}
          className="border-0 border-b border-ink/30 bg-transparent px-0 py-2 font-mono text-lg outline-none focus:border-ink"
        />
      </section>

      <section className="space-y-5">
        <StepHeading n="03">Time</StepHeading>
        {serviceId === null ? (
          <p className="text-sm text-muted">Choose a service first.</p>
        ) : slots.isPending ? (
          <div className="grid grid-cols-4 border-l border-t border-rule sm:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse border-b border-r border-rule bg-paper-deep" />
            ))}
          </div>
        ) : slots.isError ? (
          <ErrorText>{slots.error.message}</ErrorText>
        ) : slots.data.length === 0 ? (
          <p className="text-sm text-muted">No free times this day — we may be closed or fully booked.</p>
        ) : (
          <div
            className="grid grid-cols-4 border-l border-t border-rule sm:grid-cols-8"
            role="group"
            aria-label="Available times"
          >
            {slots.data.map((iso) => {
              const selected = iso === slot;
              const suggested = aiSlots.includes(iso);
              return (
                <button
                  key={iso}
                  onClick={() => setSlot(iso)}
                  aria-pressed={selected}
                  className={`relative h-12 border-b border-r border-rule font-mono text-sm transition-colors ${
                    selected ? "bg-ink text-paper" : "bg-paper hover:bg-paper-deep"
                  } ${suggested && !selected ? "text-accent" : ""}`}
                >
                  {formatSalonTime(iso)}
                  {suggested && (
                    <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-4 border-t border-ink pt-6 sm:flex-row sm:items-center">
        <p className="flex-1 font-mono text-sm">
          {selectedService && slot
            ? `${selectedService.name} · ${formatSalonDate(slot)} at ${formatSalonTime(slot)}`
            : <span className="text-muted">Pick a service and a time.</span>}
        </p>
        <Button
          disabled={!selectedService || !slot || book.isPending}
          onClick={() => selectedService && slot && book.mutate({ serviceId: selectedService.id, startsAt: slot })}
        >
          {book.isPending ? "Booking…" : "Confirm booking"}
        </Button>
      </div>
      <ErrorText>{book.error?.message}</ErrorText>
    </div>
  );
}
