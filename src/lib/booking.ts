import "server-only";
import { getDb, type Queryable } from "@/db";
import { HttpError } from "./api";
import type { User } from "./auth";
import { availableSlots, isBookableSlot, type Interval } from "./slots";
import { salonDateString, salonTimeToDate } from "./time";

export type Service = {
  id: number;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  priceRsd: number;
};

export type Appointment = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: "booked" | "cancelled";
  serviceName: string;
  customerName: string;
  customerEmail: string;
};

export async function listServices(): Promise<Service[]> {
  const db = await getDb();
  const { rows } = await db.query<Service>(
    `SELECT id, slug, name, description, duration_min AS "durationMin", price_rsd AS "priceRsd"
       FROM services ORDER BY id`,
  );
  return rows;
}

async function getService(db: Queryable, id: number): Promise<Service> {
  const { rows } = await db.query<Service>(
    `SELECT id, slug, name, description, duration_min AS "durationMin", price_rsd AS "priceRsd"
       FROM services WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, "Service not found");
  return rows[0];
}

async function bookedIntervals(db: Queryable, date: string): Promise<Interval[]> {
  // Fetch the whole salon day (in UTC) — slots never cross midnight.
  const from = salonTimeToDate(date, 0);
  const to = salonTimeToDate(date, 24 * 60);
  const { rows } = await db.query<{ starts_at: Date; ends_at: Date }>(
    `SELECT starts_at, ends_at FROM appointments
      WHERE status = 'booked' AND starts_at < $2 AND ends_at > $1`,
    [from, to],
  );
  return rows.map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) }));
}

export async function getSlots(serviceId: number, date: string): Promise<string[]> {
  const db = await getDb();
  const service = await getService(db, serviceId);
  const booked = await bookedIntervals(db, date);
  return availableSlots({ date, durationMin: service.durationMin, booked, now: new Date() }).map((d) =>
    d.toISOString(),
  );
}

export async function bookAppointment(user: User, serviceId: number, startsAt: Date) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    // Serialize bookings so two people can't grab the same slot at the same
    // moment. Readers (slot listing) are not blocked by this lock mode.
    await tx.query("LOCK TABLE appointments IN SHARE ROW EXCLUSIVE MODE");

    const service = await getService(tx, serviceId);
    const date = salonDateString(startsAt);
    const booked = await bookedIntervals(tx, date);
    if (!isBookableSlot({ date, durationMin: service.durationMin, booked, now: new Date(), start: startsAt })) {
      throw new HttpError(409, "That time is no longer available");
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
    const { rows } = await tx.query<{ id: number }>(
      `INSERT INTO appointments (user_id, service_id, starts_at, ends_at) VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, serviceId, startsAt, endsAt],
    );
    return { id: rows[0].id };
  });
}

export async function listAppointments(opts: { userId?: number; date?: string }): Promise<Appointment[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.userId !== undefined) {
    params.push(opts.userId);
    where.push(`a.user_id = $${params.length}`);
  }
  if (opts.date) {
    params.push(salonTimeToDate(opts.date, 0), salonTimeToDate(opts.date, 24 * 60));
    where.push(`a.starts_at >= $${params.length - 1} AND a.starts_at < $${params.length}`);
  }
  const { rows } = await db.query<Appointment & { startsAt: Date; endsAt: Date }>(
    `SELECT a.id, a.starts_at AS "startsAt", a.ends_at AS "endsAt", a.status,
            s.name AS "serviceName", u.name AS "customerName", u.email AS "customerEmail"
       FROM appointments a
       JOIN services s ON s.id = a.service_id
       JOIN users u ON u.id = a.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY a.starts_at`,
    params,
  );
  return rows.map((r) => ({
    ...r,
    startsAt: new Date(r.startsAt).toISOString(),
    endsAt: new Date(r.endsAt).toISOString(),
  }));
}

export async function cancelAppointment(user: User, id: number) {
  const db = await getDb();
  const { rows } = await db.query<{ user_id: number; starts_at: Date; status: string }>(
    "SELECT user_id, starts_at, status FROM appointments WHERE id = $1",
    [id],
  );
  const appt = rows[0];
  // Same 404 for "doesn't exist" and "not yours" so ids can't be probed.
  if (!appt || (appt.user_id !== user.id && user.role !== "admin")) {
    throw new HttpError(404, "Appointment not found");
  }
  if (appt.status === "cancelled") return;
  if (user.role !== "admin" && new Date(appt.starts_at) <= new Date()) {
    throw new HttpError(400, "Past appointments can't be cancelled");
  }
  await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [id]);
}
