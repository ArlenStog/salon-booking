import { z } from "zod";
import { getDb } from "@/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { handler, HttpError, json, readJson } from "@/lib/api";

const Body = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export const POST = handler(async (req) => {
  const { email, password } = await readJson(req, Body);
  const db = await getDb();
  const { rows } = await db.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email],
  );
  // Same message whether the email or the password is wrong.
  if (!rows[0] || !(await verifyPassword(password, rows[0].password_hash))) {
    throw new HttpError(401, "Wrong email or password");
  }
  await createSession(rows[0].id);
  return json({ ok: true });
});
