import { notFound } from "next/navigation";
import { AdminDay } from "@/components/AdminDay";
import { requirePageUser } from "@/lib/guards";

export default async function AdminPage() {
  const user = await requirePageUser("/admin");
  if (user.role !== "admin") notFound();
  return <AdminDay />;
}
