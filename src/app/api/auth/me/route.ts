import { getCurrentUser } from "@/lib/auth";
import { handler, json } from "@/lib/api";

export const GET = handler(async () => json({ user: await getCurrentUser() }));
