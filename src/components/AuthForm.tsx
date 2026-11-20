"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { keys } from "@/hooks/queries";
import { Button, Card, ErrorText, Input } from "./ui";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isLogin = mode === "login";

  const submit = useMutation({
    mutationFn: (body: Record<string, string>) =>
      api(isLogin ? "/api/auth/login" : "/api/auth/register", { method: "POST", body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.me });
      router.push(next);
      router.refresh();
    },
  });

  return (
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold">{isLogin ? "Welcome back" : "Create an account"}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {isLogin ? "Log in to book and manage appointments." : "It takes 20 seconds."}
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>);
        }}
      >
        {!isLogin && <Input label="Name" name="name" autoComplete="name" required />}
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={isLogin ? undefined : 8}
          required
        />
        <ErrorText>{submit.error?.message}</ErrorText>
        <Button type="submit" className="w-full" disabled={submit.isPending}>
          {submit.isPending ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-400">
        {isLogin ? "No account yet? " : "Already have an account? "}
        <Link
          href={`${isLogin ? "/register" : "/login"}?next=${encodeURIComponent(next)}`}
          className="text-amber-400 hover:underline"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </Card>
  );
}
