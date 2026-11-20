import { z } from "zod";
import { cancelAppointment } from "@/lib/booking";
import { handler, json, readJson, requireUser } from "@/lib/api";

const Body = z.object({ status: z.literal("cancelled") });

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const id = z.coerce.number().int().positive().parse((await params).id);
  await readJson(req, Body);
  await cancelAppointment(user, id);
  return json({ ok: true });
});
