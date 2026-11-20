import Link from "next/link";
import { listServices } from "@/lib/booking";

export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await listServices();

  return (
    <div className="space-y-16">
      <section className="space-y-6 pt-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400">Barbershop · Belgrade</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Book your chair in under a minute.
        </h1>
        <p className="max-w-xl text-lg text-zinc-400">
          Pick a service, pick a time — or just type what you want, like{" "}
          <em className="text-zinc-200">“beard trim friday after 3”</em>, and let the AI find the slot.
        </p>
        <div className="flex gap-3">
          <Link href="/book" className="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-zinc-950 hover:bg-amber-300">
            Book now
          </Link>
          <Link href="/register" className="rounded-lg border border-zinc-700 px-5 py-2.5 font-semibold hover:border-zinc-500">
            Create account
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Services</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-semibold">{s.name}</h3>
                <span className="font-mono text-amber-400">{s.priceRsd.toLocaleString("sr-RS")} RSD</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
              <p className="mt-3 text-xs text-zinc-500">{s.durationMin} min</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 text-sm text-zinc-400 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-zinc-200">Opening hours</p>
          <p>Mon–Fri 09–17 · Sat 09–14</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-200">No double bookings</p>
          <p>Slots are locked in a database transaction.</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-200">Cancel anytime</p>
          <p>Free cancellation up to the appointment.</p>
        </div>
      </section>
    </div>
  );
}
