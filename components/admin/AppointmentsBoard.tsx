"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Clock,
  Phone,
  Mail,
  CalendarX,
  Loader2,
  CircleDot,
  Heart,
} from "lucide-react";
import { formatDateHebrew } from "@/lib/time";

interface Appointment {
  id: string;
  serviceName: string;
  date: string;
  startTime: string;
  durationMin: number;
  price: number;
  customerName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: string;
  inspoSrcs: string[];
}

type Tab = "pending" | "today" | "upcoming" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "ממתינים" },
  { key: "today", label: "היום" },
  { key: "upcoming", label: "הקרובים" },
  { key: "all", label: "הכל" },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "ממתין לאישור", className: "bg-gold/15 text-gold-dark" },
  confirmed: {
    label: "מאושר",
    className: "bg-emerald-50 text-emerald-700",
  },
  cancelled: { label: "בוטל", className: "bg-neutral-100 text-neutral-400" },
};

export function AppointmentsBoard({
  appointments,
  today,
}: {
  appointments: Appointment[];
  today: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      pending: appointments.filter((a) => a.status === "pending").length,
      today: appointments.filter(
        (a) => a.date === today && a.status !== "cancelled"
      ).length,
    }),
    [appointments, today]
  );

  const filtered = useMemo(() => {
    switch (tab) {
      case "pending":
        return appointments.filter((a) => a.status === "pending");
      case "today":
        return appointments.filter(
          (a) => a.date === today && a.status !== "cancelled"
        );
      case "upcoming":
        return appointments.filter(
          (a) => a.date >= today && a.status !== "cancelled"
        );
      case "all":
      default:
        return appointments;
    }
  }, [tab, appointments, today]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          const badge =
            t.key === "pending"
              ? counts.pending
              : t.key === "today"
                ? counts.today
                : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-gold text-noir-900"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100",
              ].join(" ")}
            >
              {t.label}
              {badge > 0 && (
                <span
                  className={[
                    "tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                    active ? "bg-white/60" : "bg-gold text-noir-900",
                  ].join(" ")}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50">
            <CalendarX className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="text-neutral-600">אין תורים להצגה כאן</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.pending;
            const busy = busyId === a.id;
            return (
              <li key={a.id} className="glass overflow-hidden rounded-3xl">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-sans text-base font-semibold text-noir-900">
                        {a.customerName}
                      </h3>
                      <p className="text-sm text-gold-dark">{a.serviceName}</p>
                    </div>
                    <span
                      className={[
                        "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        meta.className,
                      ].join(" ")}
                    >
                      <CircleDot className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-neutral-600">
                    <span className="tabular flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-gold" />
                      {formatDateHebrew(a.date)} · {a.startTime}
                    </span>
                    <span className="tabular font-medium text-noir-900">
                      {a.price} ₪
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <a
                      href={`tel:${a.phone.replace(/-/g, "")}`}
                      dir="ltr"
                      className="flex items-center gap-1.5 text-neutral-600 transition-colors hover:text-gold dark:text-neutral-300"
                    >
                      <Phone className="h-4 w-4 text-gold" />
                      {a.phone}
                    </a>
                    {a.email && (
                      <a
                        href={`mailto:${a.email}`}
                        dir="ltr"
                        className="flex items-center gap-1.5 truncate text-neutral-600 transition-colors hover:text-gold dark:text-neutral-300"
                      >
                        <Mail className="h-4 w-4 text-gold" />
                        {a.email}
                      </a>
                    )}
                  </div>

                  {a.notes && (
                    <p className="mt-2 rounded-xl bg-neutral-50 p-2.5 text-sm text-neutral-600">
                      {a.notes}
                    </p>
                  )}

                  {a.inspoSrcs.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs text-neutral-400">
                        <Heart className="h-3.5 w-3.5 text-gold" />
                        השראה שצורפה ({a.inspoSrcs.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {a.inspoSrcs.map((src, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={idx}
                            src={src}
                            alt="השראה"
                            className="h-14 w-12 rounded-lg border border-neutral-200 object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {a.status !== "cancelled" && (
                  <div className="flex border-t border-neutral-200">
                    {a.status === "pending" && (
                      <button
                        onClick={() => updateStatus(a.id, "confirmed")}
                        disabled={busy}
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        אישור
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(a.id, "cancelled")}
                      disabled={busy}
                      className="flex flex-1 items-center justify-center gap-1.5 border-r border-neutral-200 py-3 text-sm font-semibold text-neutral-600 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      ביטול תור
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
