import { z } from "zod";
import { parseBookingRequest } from "@/lib/ai";
import { getSlots, listServices } from "@/lib/booking";
import { formatSalonTime } from "@/lib/time";
import { handler, json, readJson, requireUser } from "@/lib/api";

const Body = z.object({ text: z.string().trim().min(3, "Tell me a bit more").max(500) });

const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: string | null): v is string => !!v && /^\d{2}:\d{2}$/.test(v);

export const POST = handler(async (req) => {
  // Logged-in users only, so strangers can't spend our API credits.
  await requireUser();
  const { text } = await readJson(req, Body);

  const services = await listServices();
  const intent = await parseBookingRequest(text, services);

  // Never trust model output blindly: validate it against real data.
  const service = services.find((s) => s.id === intent.serviceId) ?? null;
  const date = isDate(intent.date) ? intent.date : null;

  let slots: string[] = [];
  if (service && date) {
    slots = (await getSlots(service.id, date)).filter((iso) => {
      const hhmm = formatSalonTime(iso);
      if (isTime(intent.earliestTime) && hhmm < intent.earliestTime) return false;
      if (isTime(intent.latestTime) && hhmm > intent.latestTime) return false;
      return true;
    });
  }

  return json({ serviceId: service?.id ?? null, date, slots, reply: intent.reply });
});
