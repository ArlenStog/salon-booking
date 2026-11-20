"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/hooks/queries";
import { api } from "@/lib/fetcher";

export function Header() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    qc.clear();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm sm:gap-5 sm:px-6">
        <Link href="/" className="mr-auto font-semibold tracking-tight">
          Fade <span className="text-amber-400">&amp;</span> Co.
        </Link>
        <Link href="/book" className="text-zinc-300 hover:text-white">
          Book
        </Link>
        {me && (
          <Link href="/appointments" className="text-zinc-300 hover:text-white">
            My appointments
          </Link>
        )}
        {me?.role === "admin" && (
          <Link href="/admin" className="text-zinc-300 hover:text-white">
            Admin
          </Link>
        )}
        {me ? (
          <button onClick={logout} className="text-zinc-400 hover:text-white">
            Log out
          </button>
        ) : (
          <Link href="/login" className="rounded-lg border border-zinc-700 px-3 py-1.5 hover:border-zinc-500">
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
