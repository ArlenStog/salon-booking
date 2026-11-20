"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/hooks/queries";
import { api } from "@/lib/fetcher";

const navLink = "font-mono text-xs uppercase tracking-[0.16em] text-ink/70 transition-colors hover:text-ink";

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
    <header className="border-b border-rule">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-5 sm:px-8">
        <Link href="/" className="mr-auto font-display text-2xl italic leading-none">
          Fade &amp; Co.
        </Link>
        <Link href="/book" className={navLink}>
          Book
        </Link>
        {me && (
          <Link href="/appointments" className={navLink}>
            My appointments
          </Link>
        )}
        {me?.role === "admin" && (
          <Link href="/admin" className={navLink}>
            Admin
          </Link>
        )}
        {me ? (
          <button onClick={logout} className={navLink}>
            Log out
          </button>
        ) : (
          <Link href="/login" className={`${navLink} border-b border-ink pb-0.5 text-ink`}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
