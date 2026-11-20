import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/guards";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return <AuthForm mode="register" next={safeNext((await searchParams).next)} />;
}
