import { listServices } from "@/lib/booking";
import { handler, json } from "@/lib/api";

export const GET = handler(async () => json({ services: await listServices() }));
