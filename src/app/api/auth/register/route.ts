import { z } from "zod";
import { getDb } from "@/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handler, HttpError, json, readJson } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const POST = handler(async (req) => {
  const { name, email, password } = await readJson(req, Body);
  const db = await getDb();
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, name, await hashPassword(password)],
  );
  if (!rows[0]) throw new HttpError(409, "An account with this email already exists");
  await createSession(rows[0].id);
  return json({ ok: true }, 201);
});
