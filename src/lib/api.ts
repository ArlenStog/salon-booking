import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, type User } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Wraps a route handler: turns thrown HttpErrors / Zod errors into JSON responses. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      if (err instanceof z.ZodError) {
        return json({ error: err.issues[0]?.message ?? "Invalid input" }, 400);
      }
      console.error(err);
      return json({ error: "Something went wrong" }, 500);
    }
  };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admins only");
  return user;
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const body = await req.json().catch(() => {
    throw new HttpError(400, "Body must be JSON");
  });
  return schema.parse(body);
}
