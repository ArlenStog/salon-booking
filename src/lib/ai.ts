import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { HttpError } from "./api";
import type { Service } from "./booking";
import { salonDateString } from "./time";

/**
 * "Book with a sentence": turns free text like
 *   "beard trim next friday after 3pm"
 * into { service, date, time window }. Claude only *understands* the request —
 * availability is still computed by our own code, so the model can never
 * invent a slot or double-book.
 */
const BookingIntent = z.object({
  serviceId: z.number().nullable().describe("id of the matching service, or null if unclear"),
  date: z.string().nullable().describe("requested day as YYYY-MM-DD, or null if not mentioned"),
  earliestTime: z.string().nullable().describe("HH:MM, 24h. Earliest acceptable start, or null"),
  latestTime: z.string().nullable().describe("HH:MM, 24h. Latest acceptable start, or null"),
  reply: z.string().describe("One short, friendly sentence to the customer summarising what you understood"),
});
export type BookingIntent = z.infer<typeof BookingIntent>;

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function parseBookingRequest(text: string, services: Service[]): Promise<BookingIntent> {
  if (!aiEnabled()) throw new HttpError(503, "AI booking is not configured on this server");

  const client = new Anthropic();
  const today = salonDateString(new Date());
  const weekdayName = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Belgrade", weekday: "long" }).format(
    new Date(),
  );

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // Simple extraction task: low effort keeps it fast and cheap.
    output_config: { effort: "low", format: betaZodOutputFormat(BookingIntent) },
    // If a safety classifier ever declines, the API retries on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      "You help customers of a barbershop in Belgrade book appointments.",
      `Today is ${weekdayName}, ${today} (Europe/Belgrade).`,
      "Opening hours: Mon-Fri 09:00-17:00, Sat 09:00-14:00, closed Sunday.",
      "Services (id: name - minutes):",
      ...services.map((s) => `${s.id}: ${s.name} - ${s.durationMin} min`),
      "Resolve relative dates ('tomorrow', 'next friday') against today.",
      "The customer may write in English or Serbian; reply in the language they used.",
    ].join("\n"),
    messages: [{ role: "user", content: text }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new HttpError(422, "Sorry, I couldn't understand that. Try picking a time below.");
  }
  return response.parsed_output;
}
