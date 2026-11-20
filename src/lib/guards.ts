import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

/** Only allow same-site relative redirects ("/book", not "//evil.com"). */
export function safeNext(value: string | string[] | undefined, fallback = "/book") {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

export async function requirePageUser(path: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}
