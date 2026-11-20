import { z } from "zod";
import { getSlots } from "@/lib/booking";
import { handler, json } from "@/lib/api";

const Query = z.object({
  serviceId: z.coerce.number().int().positive(),
  date: z.iso.date("Date must be YYYY-MM-DD"),
});

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const { serviceId, date } = Query.parse(Object.fromEntries(url.searchParams));
  return json({ slots: await getSlots(serviceId, date) });
});
