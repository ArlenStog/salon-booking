import Link from "next/link";
import { listServices } from "@/lib/booking";

export const dynamic = "force-dynamic";

const notes = [
  ["01", "One chair, no overlaps", "Every booking is checked again inside a locked database transaction."],
  ["02", "Book in a sentence", "Type “beard trim friday after 3” and we’ll find the free times."],
  ["03", "Cancel any time", "Plans change. Cancel from your account until the appointment starts."],
];

export default async function Home() {
  const services = await listServices();

  return (
    <div className="space-y-24">
      <section className="grid gap-12 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <p className="eyebrow">Barbershop · Belgrade · Est. 2026</p>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,5.6rem)] uppercase leading-[0.95] tracking-tight">
            A proper cut,
            <br />
            <span className="italic normal-case">booked</span> in a minute.
          </h1>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="bg-ink px-7 py-3.5 font-mono text-xs uppercase tracking-[0.16em] text-paper transition-colors hover:bg-accent"
            >
              Book a chair
            </Link>
            <Link
              href="/register"
              className="border border-ink px-7 py-3.5 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
            >
              Create account
            </Link>
          </div>
        </div>
        <dl className="space-y-4 border-t border-ink pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <dt className="eyebrow">Weekdays</dt>
            <dd className="mt-1 font-mono">09:00 — 17:00</dd>
          </div>
          <div>
            <dt className="eyebrow">Saturday</dt>
            <dd className="mt-1 font-mono">09:00 — 14:00</dd>
          </div>
          <div>
            <dt className="eyebrow">Sunday</dt>
            <dd className="mt-1 font-mono">Closed</dd>
          </div>
        </dl>
      </section>

      <section>
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="font-display text-3xl">The menu</h2>
          <span className="eyebrow">Prices in RSD</span>
        </div>
        <ul>
          {services.map((s) => (
            <li key={s.id} className="border-b border-rule py-5">
              <div className="flex items-baseline">
                <h3 className="font-display text-2xl">{s.name}</h3>
                <span className="leader" aria-hidden />
                <span className="font-mono text-lg">{s.priceRsd.toLocaleString("sr-RS")}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-4 text-sm text-muted">
                <p>{s.description}</p>
                <p className="shrink-0 font-mono text-xs">{s.durationMin} min</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-10 sm:grid-cols-3">
        {notes.map(([n, title, body]) => (
          <div key={n} className="border-t border-ink pt-4">
            <p className="font-mono text-xs text-accent">{n}</p>
            <h3 className="mt-3 font-display text-xl">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
