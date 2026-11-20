"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export type Me = { id: number; email: string; name: string; role: "client" | "admin" };
export type Service = { id: number; name: string; description: string; durationMin: number; priceRsd: number };
export type Appointment = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: "booked" | "cancelled";
  serviceName: string;
  customerName: string;
  customerEmail: string;
};
export type AiSuggestion = { serviceId: number | null; date: string | null; slots: string[]; reply: string };

// One place for query keys keeps invalidation consistent.
export const keys = {
  me: ["me"] as const,
  services: ["services"] as const,
  slots: (serviceId: number | null, date: string) => ["slots", serviceId, date] as const,
  myAppointments: ["appointments", "mine"] as const,
  dayAppointments: (date: string) => ["appointments", "day", date] as const,
};

export const useMe = () =>
  useQuery({ queryKey: keys.me, queryFn: () => api<{ user: Me | null }>("/api/auth/me").then((r) => r.user) });

export const useServices = () =>
  useQuery({
    queryKey: keys.services,
    queryFn: () => api<{ services: Service[] }>("/api/services").then((r) => r.services),
    staleTime: 5 * 60_000,
  });

export const useSlots = (serviceId: number | null, date: string) =>
  useQuery({
    queryKey: keys.slots(serviceId, date),
    queryFn: () => api<{ slots: string[] }>(`/api/slots?serviceId=${serviceId}&date=${date}`).then((r) => r.slots),
    enabled: serviceId !== null && !!date,
  });

export const useMyAppointments = () =>
  useQuery({
    queryKey: keys.myAppointments,
    queryFn: () => api<{ appointments: Appointment[] }>("/api/appointments").then((r) => r.appointments),
  });

export const useDayAppointments = (date: string) =>
  useQuery({
    queryKey: keys.dayAppointments(date),
    queryFn: () =>
      api<{ appointments: Appointment[] }>(`/api/appointments?scope=all&date=${date}`).then((r) => r.appointments),
  });

export function useBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { serviceId: number; startsAt: string }) =>
      api<{ id: number }>("/api/appointments", { method: "POST", body }),
    // Success or a 409 conflict: either way the slot list is now stale.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["slots"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

/** Optimistic cancel: the UI updates instantly and rolls back if the server says no. */
export function useCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/api/appointments/${id}`, { method: "PATCH", body: { status: "cancelled" } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.myAppointments });
      const previous = qc.getQueryData<Appointment[]>(keys.myAppointments);
      qc.setQueryData<Appointment[]>(keys.myAppointments, (old) =>
        old?.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => qc.setQueryData(keys.myAppointments, ctx?.previous),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}

export const useAiSuggest = () =>
  useMutation({
    mutationFn: (text: string) => api<AiSuggestion>("/api/ai/parse", { method: "POST", body: { text } }),
  });
