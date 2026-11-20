import { BookingFlow } from "@/components/BookingFlow";
import { aiEnabled } from "@/lib/ai";
import { requirePageUser } from "@/lib/guards";

export default async function BookPage() {
  await requirePageUser("/book");
  return <BookingFlow aiEnabled={aiEnabled()} />;
}
