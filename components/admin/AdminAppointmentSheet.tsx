"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Clock,
  CalendarDays,
  Loader2,
  AlertCircle,
  Contact,
  Search,
} from "lucide-react";
import { Calendar } from "@/components/Calendar";
import { isValidIsraeliPhone, tryNormalizeIsraeliPhone } from "@/lib/phone";

export interface AdminServiceLite {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

export interface RescheduleTarget {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  durationMin: number;
  date: string;
  startTime: string;
}

type CustomerHit = { name: string; phone: string; email: string | null };

type ContactPickerResult = { name?: string[]; tel?: string[] };

function contactsApiSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "contacts" in navigator && "ContactsManager" in window;
}

function normalizeTimeInput(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function pickDeviceContact(): Promise<{
  name: string;
  phone: string;
} | null> {
  const nav = navigator as Navigator & {
    contacts?: {
      select: (
        props: string[],
        opts: { multiple: boolean }
      ) => Promise<ContactPickerResult[]>;
    };
  };
  if (!nav.contacts?.select) return null;
  const picked = await nav.contacts.select(["name", "tel"], {
    multiple: false,
  });
  const first = picked[0];
  if (!first) return null;
  const name = (first.name?.[0] || "").trim();
  const rawTel = first.tel?.[0] || "";
  const phone = tryNormalizeIsraeliPhone(rawTel) || rawTel;
  return { name, phone };
}

export function AdminAppointmentSheet({
  mode,
  services,
  openDaysOfWeek,
  blockedDates,
  reschedule,
  onClose,
  onSaved,
}: {
  mode: "create" | "move";
  services: AdminServiceLite[];
  openDaysOfWeek: number[];
  blockedDates: string[];
  reschedule?: RescheduleTarget | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState<string | null>(
    mode === "move" ? reschedule?.date ?? null : null
  );
  const [time, setTime] = useState<string | null>(
    mode === "move" ? reschedule?.startTime ?? null : null
  );
  const [customTime, setCustomTime] = useState(
    mode === "move" ? reschedule?.startTime ?? "" : ""
  );
  const [customerName, setCustomerName] = useState(
    mode === "move" ? reschedule?.customerName ?? "" : ""
  );
  const [phone, setPhone] = useState(
    mode === "move" ? reschedule?.phone ?? "" : ""
  );
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [showHits, setShowHits] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const canPickContacts = contactsApiSupported();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const durationMin =
    mode === "move"
      ? reschedule?.durationMin ?? selectedService?.durationMin ?? 60
      : selectedService?.durationMin ?? 60;

  const fetchSlots = useCallback(
    async (d: string) => {
      setSlotsLoading(true);
      setSlotsMsg(null);
      setSlots([]);
      try {
        const params = new URLSearchParams({
          date: d,
          durationMin: String(durationMin),
        });
        if (mode === "create" && serviceId) {
          params.set("serviceId", serviceId);
        }
        if (mode === "move" && reschedule?.id) {
          params.set("excludeId", reschedule.id);
        }
        const res = await fetch(`/api/availability?${params.toString()}`, {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!res.ok) {
          setSlotsMsg(json.error || "שגיאה בטעינת השעות. נסו שוב.");
        } else if (!json.open) {
          setSlotsMsg(json.reason || "אין שעות פנויות ביום זה");
        } else if (!json.slots?.length) {
          setSlotsMsg(
            "אין סלוטים פנויים ברשת השעות. אפשר להקליד שעה ידנית למטה."
          );
        } else {
          setSlots(json.slots);
        }
      } catch {
        setSlotsMsg("שגיאה בטעינת השעות. נסו שוב.");
      } finally {
        setSlotsLoading(false);
      }
    },
    [durationMin, mode, reschedule?.id, serviceId]
  );

  useEffect(() => {
    if (!date) return;
    if (!(mode === "move" && date === reschedule?.date)) {
      setTime(null);
      setCustomTime("");
    }
    fetchSlots(date);
  }, [date, fetchSlots, mode, reschedule?.date]);

  const loadCustomers = async (q: string) => {
    try {
      const res = await fetch(
        `/api/admin/customers?q=${encodeURIComponent(q.trim())}`,
        { credentials: "same-origin" }
      );
      if (!res.ok) return;
      const json = await res.json();
      setHits(json.customers || []);
      setShowHits(true);
    } catch {
      /* ignore */
    }
  };

  const searchCustomers = (q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void loadCustomers(q);
    }, 180);
  };

  const applyCustomer = (c: CustomerHit) => {
    setCustomerName(c.name);
    setPhone(c.phone);
    if (c.email) setEmail(c.email);
    setHits([]);
    setShowHits(false);
  };

  const onPickContact = async () => {
    if (canPickContacts) {
      try {
        const picked = await pickDeviceContact();
        if (picked) {
          if (picked.name) setCustomerName(picked.name);
          if (picked.phone) setPhone(picked.phone);
          setShowHits(false);
          return;
        }
      } catch {
        /* ביטול */
      }
    }
    nameInputRef.current?.focus();
    await loadCustomers(customerName);
  };

  const pickTime = (value: string) => {
    const normalized = normalizeTimeInput(value);
    if (!normalized) return;
    setTime(normalized);
    setCustomTime(normalized);
  };

  const validCreate =
    customerName.trim().length >= 2 && isValidIsraeliPhone(phone);
  const canSubmit =
    Boolean(date && time) &&
    (mode === "move" || (Boolean(serviceId) && validCreate));

  const submit = async () => {
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/appointments", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId,
            date,
            startTime: time,
            customerName: customerName.trim(),
            phone,
            email: email.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "אירעה שגיאה");
          if (res.status === 409) fetchSlots(date);
          return;
        }
      } else if (reschedule) {
        const res = await fetch(`/api/appointments/${reschedule.id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, startTime: time }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "אירעה שגיאה");
          if (res.status === 409) fetchSlots(date);
          return;
        }
      }
      onSaved();
    } catch {
      setError("בעיית תקשורת. בדקו את החיבור ונסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-noir-900/50 animate-fade-in"
        aria-label="סגירה"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="admin-theme relative z-10 flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-blush-card shadow-float animate-sheet-up sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-blush-border px-5 py-4">
          <h2 className="text-lg text-noir-900">
            {mode === "create" ? "קביעת תור חדש" : "הזזת תור לשעה אחרת"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100"
            aria-label="סגירה"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mode === "move" && reschedule && (
            <p className="mb-4 rounded-2xl bg-blush-muted px-3 py-2.5 text-sm text-neutral-600">
              {reschedule.customerName} · {reschedule.serviceName}
              <span className="mt-1 block tabular text-xs">
                כרגע: {reschedule.date} בשעה {reschedule.startTime}
              </span>
            </p>
          )}

          {mode === "create" && (
            <>
              <label className="label-field" htmlFor="admin-service">
                שירות
              </label>
              <select
                id="admin-service"
                className="input-field mb-4"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setTime(null);
                  setCustomTime("");
                }}
              >
                {services.length === 0 && (
                  <option value="">אין שירותים פעילים</option>
                )}
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.durationMin} דק' · {s.price} ₪
                  </option>
                ))}
              </select>

              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-600">
                  פרטי לקוח
                </span>
                <button
                  type="button"
                  onClick={onPickContact}
                  className="chip chip-active"
                >
                  <Contact className="h-3.5 w-3.5" />
                  אנשי קשר
                </button>
              </div>

              <div className="relative mb-3">
                <label className="label-field" htmlFor="admin-name">
                  שם
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    ref={nameInputRef}
                    id="admin-name"
                    className="input-field pr-10"
                    value={customerName}
                    autoComplete="off"
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      searchCustomers(e.target.value);
                    }}
                    onFocus={() => {
                      void loadCustomers(customerName);
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setShowHits(false), 200);
                    }}
                    placeholder="הקלידו שם — יופיעו לקוחות קודמים"
                  />
                </div>
                {showHits && hits.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-2xl border border-blush-border bg-blush-card shadow-md">
                    {hits.map((c) => (
                      <li key={`${c.phone}-${c.name}`}>
                        <button
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-right hover:bg-blush-muted"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyCustomer(c);
                          }}
                        >
                          <span className="text-sm font-medium text-noir-900">
                            {c.name}
                          </span>
                          <span
                            className="tabular text-xs text-neutral-500"
                            dir="ltr"
                          >
                            {c.phone}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="label-field" htmlFor="admin-phone">
                טלפון
              </label>
              <input
                id="admin-phone"
                className="input-field mb-3"
                dir="ltr"
                value={phone}
                inputMode="tel"
                onChange={(e) => {
                  setPhone(e.target.value);
                  searchCustomers(e.target.value);
                }}
                onFocus={() => {
                  if (phone.trim()) void loadCustomers(phone);
                }}
                placeholder="050-1234567"
              />

              <label className="label-field" htmlFor="admin-email">
                אימייל (אופציונלי)
              </label>
              <input
                id="admin-email"
                className="input-field mb-3"
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="label-field" htmlFor="admin-notes">
                הערות (אופציונלי)
              </label>
              <textarea
                id="admin-notes"
                className="input-field mb-4 min-h-20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </>
          )}

          <div className="glass mb-4 rounded-3xl p-4">
            <h3 className="mb-1 flex items-center gap-2 text-base text-noir-900">
              <CalendarDays className="h-5 w-5 text-gold" />
              בחרו תאריך
            </h3>
            <p className="mb-3 text-xs text-neutral-500">
              לחצו על יום ביומן, ואז בחרו או הקלידו שעה
            </p>
            <Calendar
              openDaysOfWeek={openDaysOfWeek}
              blockedDates={blockedDates}
              selected={date}
              onSelect={(next) => {
                setDate(next);
              }}
            />
          </div>

          {date && (
            <div className="glass rounded-3xl p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base text-noir-900">
                <Clock className="h-5 w-5 text-gold" />
                בחרו שעה חדשה
              </h3>

              <label className="label-field" htmlFor="admin-time">
                שעה (אפשר לבחור מהרשימה או להקליד)
              </label>
              <input
                id="admin-time"
                type="time"
                step="300"
                dir="ltr"
                className="input-field mb-4"
                value={customTime}
                onChange={(e) => pickTime(e.target.value)}
              />

              {slotsLoading && (
                <div className="flex items-center justify-center gap-2 py-5 text-neutral-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  טוען שעות פנויות...
                </div>
              )}
              {!slotsLoading && slotsMsg && (
                <div className="mb-3 flex items-center gap-2 rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-600">
                  <AlertCircle className="h-5 w-5 shrink-0 text-gold" />
                  {slotsMsg}
                </div>
              )}
              {!slotsLoading && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => pickTime(slot)}
                      className={[
                        "tabular rounded-xl border py-3 text-sm font-medium transition-all duration-150 active:scale-95",
                        time === slot
                          ? "border-gold bg-gold text-noir-900 shadow-glow"
                          : "border-neutral-200 bg-neutral-50 text-noir-900 hover:border-gold/40",
                      ].join(" ")}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-blush-border px-5 py-4 safe-bottom">
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!canSubmit || submitting}
            onClick={submit}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "create" ? (
              "שמירת התור"
            ) : (
              "הזזת התור לשעה שנבחרה"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
