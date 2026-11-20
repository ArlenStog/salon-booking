import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/guards";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  return <AuthForm mode="login" next={safeNext((await searchParams).next)} />;
}
