import { z } from "zod";
import { bookAppointment, listAppointments } from "@/lib/booking";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/api";

const Body = z.object({
  serviceId: z.number().int().positive(),
  startsAt: z.iso.datetime({ offset: true }),
});

// GET /api/appointments            -> my appointments
// GET /api/appointments?scope=all&date=YYYY-MM-DD  -> everyone's (admin only)
export const GET = handler(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  if (url.searchParams.get("scope") === "all") {
    if (user.role !== "admin") throw new HttpError(403, "Admins only");
    const date = z.iso.date().optional().parse(url.searchParams.get("date") ?? undefined);
    return json({ appointments: await listAppointments({ date }) });
  }
  return json({ appointments: await listAppointments({ userId: user.id }) });
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { serviceId, startsAt } = await readJson(req, Body);
  const result = await bookAppointment(user, serviceId, new Date(startsAt));
  return json(result, 201);
});
