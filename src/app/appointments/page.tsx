import { MyAppointments } from "@/components/MyAppointments";
import { requirePageUser } from "@/lib/guards";

export default async function AppointmentsPage() {
  await requirePageUser("/appointments");
  return <MyAppointments />;
}
