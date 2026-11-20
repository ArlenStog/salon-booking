"use client";
import Link from "next/link";
import { useState } from "react";
import { useAiSuggest, useBook, useServices, useSlots } from "@/hooks/queries";
import { formatSalonDate, formatSalonTime, salonDateString } from "@/lib/time";
import { Button, Card, ErrorText } from "./ui";

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
      <Card className="mx-auto max-w-md text-center">
        <p className="text-4xl">✂️</p>
        <h1 className="mt-3 text-2xl font-semibold">You’re booked!</h1>
        <p className="mt-2 text-zinc-400" data-testid="confirmation">
          {selectedService.name} · {formatSalonDate(slot)} at {formatSalonTime(slot)}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/appointments" className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950">
            My appointments
          </Link>
          <Button variant="ghost" onClick={() => pick({ serviceId: null })}>
            Book another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Book an appointment</h1>

      <Card className="border-amber-400/30 bg-amber-400/5">
        <form onSubmit={askAi} className="space-y-3">
          <label htmlFor="ai" className="flex items-center gap-2 text-sm font-medium text-amber-300">
            <span aria-hidden>✨</span> Describe what you want
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="ai"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={!aiEnabled}
              placeholder="e.g. haircut and beard next friday after 2pm"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-amber-400 disabled:opacity-50"
            />
            <Button type="submit" disabled={!aiEnabled || ai.isPending || aiText.trim().length < 3}>
              {ai.isPending ? "Thinking…" : "Find a time"}
            </Button>
          </div>
          {!aiEnabled && <p className="text-xs text-zinc-500">AI booking is off on this deployment (no API key).</p>}
          {ai.data && (
            <p className="text-sm text-zinc-300" data-testid="ai-reply">
              {ai.data.reply}
            </p>
          )}
          <ErrorText>{ai.error?.message}</ErrorText>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">1 · Service</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.data?.map((s) => (
            <button
              key={s.id}
              onClick={() => pick({ serviceId: s.id })}
              aria-pressed={s.id === serviceId}
              className={`rounded-xl border p-4 text-left transition ${
                s.id === serviceId ? "border-amber-400 bg-amber-400/10" : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="font-mono text-sm text-amber-400">{s.priceRsd} RSD</span>
              </div>
              <span className="text-xs text-zinc-500">{s.durationMin} min</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">2 · Day</h2>
        <input
          type="date"
          aria-label="Date"
          value={date}
          min={today}
          onChange={(e) => e.target.value && pick({ date: e.target.value })}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-amber-400"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">3 · Time</h2>
        {serviceId === null ? (
          <p className="text-sm text-zinc-500">Choose a service first.</p>
        ) : slots.isPending ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/60" />
            ))}
          </div>
        ) : slots.isError ? (
          <ErrorText>{slots.error.message}</ErrorText>
        ) : slots.data.length === 0 ? (
          <p className="text-sm text-zinc-500">No free times this day — we may be closed or fully booked.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="Available times">
            {slots.data.map((iso) => {
              const selected = iso === slot;
              const suggested = aiSlots.includes(iso);
              return (
                <button
                  key={iso}
                  onClick={() => setSlot(iso)}
                  aria-pressed={selected}
                  className={`rounded-lg border py-2 font-mono text-sm transition ${
                    selected
                      ? "border-amber-400 bg-amber-400 text-zinc-950"
                      : suggested
                        ? "border-amber-400/60 text-amber-300"
                        : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  {formatSalonTime(iso)}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-zinc-400">
          {selectedService && slot
            ? `${selectedService.name} · ${formatSalonDate(slot)} at ${formatSalonTime(slot)}`
            : "Pick a service and a time."}
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
