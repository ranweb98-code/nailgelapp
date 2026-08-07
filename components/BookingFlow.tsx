"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Check,
  ChevronRight,
  Loader2,
  CalendarDays,
  AlertCircle,
  Sparkles,
  Heart,
  Home,
  CalendarCheck,
} from "lucide-react";
import { Calendar } from "@/components/Calendar";
import { InspoGallery } from "@/components/InspoGallery";
import { formatDateHebrew } from "@/lib/time";
import { type InspoImageLite } from "@/lib/inspoTags";

export interface ServiceLite {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
}

interface Props {
  services: ServiceLite[];
  openDaysOfWeek: number[];
  blockedDates: string[];
  initialServiceId?: string;
  inspoImages: InspoImageLite[];
}

type Step = "service" | "datetime" | "inspo" | "details";

const STEPS: { key: Step; label: string }[] = [
  { key: "service", label: "שירות" },
  { key: "datetime", label: "מועד" },
  { key: "inspo", label: "השראה" },
  { key: "details", label: "פרטים" },
];

interface SuccessData {
  serviceName: string;
  date: string;
  startTime: string;
  price: number;
}

export function BookingFlow({
  services,
  openDaysOfWeek,
  blockedDates,
  initialServiceId,
  inspoImages,
}: Props) {
  const router = useRouter();

  const initialService =
    services.find((s) => s.id === initialServiceId) || null;

  const [step, setStep] = useState<Step>(
    initialService ? "datetime" : "service"
  );
  const [service, setService] = useState<ServiceLite | null>(initialService);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [selectedInspo, setSelectedInspo] = useState<string[]>([]);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const fetchSlots = useCallback(async (d: string, serviceId: string) => {
    setSlotsLoading(true);
    setSlotsMsg(null);
    setSlots([]);
    try {
      const res = await fetch(
        `/api/availability?date=${d}&serviceId=${serviceId}`
      );
      const json = await res.json();
      if (!json.open) {
        setSlotsMsg(json.reason || "אין שעות פנויות ביום זה");
        setSlots([]);
      } else if (json.slots.length === 0) {
        setSlotsMsg("כל השעות תפוסות ביום זה. נסו תאריך אחר.");
      } else {
        setSlots(json.slots);
      }
    } catch {
      setSlotsMsg("שגיאה בטעינת השעות. נסו שוב.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (date && service) {
      setTime(null);
      fetchSlots(date, service.id);
    }
  }, [date, service, fetchSlots]);

  const selectService = (s: ServiceLite) => {
    setService(s);
    setDate(null);
    setTime(null);
    setStep("datetime");
  };

  const toggleInspo = (id: string) => {
    setSelectedInspo((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (!service || !date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      let pushEndpoint: string | undefined;
      try {
        pushEndpoint = localStorage.getItem("noir-push-endpoint") || undefined;
      } catch {
        /* ignore */
      }
      if (!pushEndpoint && "serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          pushEndpoint = sub?.endpoint;
        } catch {
          /* ignore */
        }
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date,
          startTime: time,
          customerName: form.customerName,
          phone: form.phone,
          email: form.email.trim() || undefined,
          notes: form.notes || undefined,
          inspoIds: selectedInspo.length ? selectedInspo : undefined,
          pushEndpoint,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "אירעה שגיאה. נסו שוב.");
        if (res.status === 409 && date && service) {
          setTime(null);
          setStep("datetime");
          fetchSlots(date, service.id);
        }
        return;
      }
      setSuccess(json);
    } catch {
      setError("בעיית תקשורת. בדקו את החיבור ונסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const validDetails =
    form.customerName.trim().length >= 2 &&
    /^0\d{1,2}-?\d{7}$/.test(form.phone.trim()) &&
    (form.email.trim() === "" ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));

  if (success) {
    return <SuccessScreen data={success} onReset={() => router.push("/")} />;
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);
  const selectedInspoImages = inspoImages.filter((img) =>
    selectedInspo.includes(img.id)
  );

  return (
    <div className="page-bg min-h-dvh pb-32">
      {/* Header + Stepper */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-5 pb-3 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-xl">
        <div className="container-app px-0">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-noir-900"
              aria-label="חזרה לדף הבית"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-medium text-noir-900">קביעת תור</h1>
            <div className="w-9" />
          </div>

          <ol className="mt-3 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={[
                    "h-1 rounded-full transition-colors duration-300",
                    i <= currentStepIndex ? "bg-gold" : "bg-neutral-200",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[11px] transition-colors",
                    i <= currentStepIndex
                      ? "font-medium text-gold-dark"
                      : "text-neutral-400",
                  ].join(" ")}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="container-app pt-5">
        {/* ----- שלב 1: בחירת שירות ----- */}
        {step === "service" && (
          <div className="services-panel animate-fade-up">
            <h2 className="mb-1 text-2xl text-noir-900">איזה טיפול תרצו?</h2>
            <p className="mb-5 font-sans text-sm text-neutral-600">בחרו שירות כדי להמשיך</p>
            <ul className="flex flex-col gap-3">
              {services.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectService(s)}
                    className="glass flex w-full items-center gap-4 rounded-2xl p-4 text-right transition-all duration-200 hover:border-gold/30 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-yad text-xl font-bold leading-tight tracking-wide text-noir-900">
                        {s.name}
                      </h3>
                      {s.description && (
                        <p className="text-xs text-neutral-600">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-3 text-xs">
                        <span className="tabular flex items-center gap-1 text-neutral-600">
                          <Clock className="h-3 w-3" />
                          {s.durationMin} דק'
                        </span>
                        <span className="tabular font-semibold text-gold-dark">
                          {s.price} ₪
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 rotate-180 text-neutral-400" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ----- שלב 2: תאריך ושעה ----- */}
        {step === "datetime" && service && (
          <div className="animate-fade-up">
            <button
              type="button"
              onClick={() => setStep("service")}
              className="chip mb-4"
            >
              {service.name} · {service.price} ₪
              <span className="text-gold">· שינוי</span>
            </button>

            <div className="glass mb-4 rounded-3xl p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg text-noir-900">
                <CalendarDays className="h-5 w-5 text-gold" />
                בחרו תאריך
              </h2>
              <Calendar
                openDaysOfWeek={openDaysOfWeek}
                blockedDates={blockedDates}
                selected={date}
                onSelect={setDate}
              />
            </div>

            {date && (
              <div className="glass animate-fade-up rounded-3xl p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg text-noir-900">
                  <Clock className="h-5 w-5 text-gold" />
                  שעות פנויות
                </h2>

                {slotsLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-neutral-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    טוען שעות...
                  </div>
                )}

                {!slotsLoading && slotsMsg && (
                  <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
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
                        onClick={() => setTime(slot)}
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
          </div>
        )}

        {/* ----- שלב 3: השראה ----- */}
        {step === "inspo" && (
          <div className="animate-fade-up">
            <h2 className="mb-1 flex items-center gap-2 text-2xl text-noir-900">
              <Heart className="h-6 w-6 text-gold" />
              הוסיפו השראה
            </h2>
            <p className="mb-5 text-sm text-neutral-600">
              בחרו תמונות שתרצו להראות לי (אפשר לדלג)
            </p>

            {inspoImages.length > 0 ? (
              <InspoGallery
                images={inspoImages}
                selected={selectedInspo}
                onToggle={toggleInspo}
              />
            ) : (
              <p className="text-sm text-neutral-400">אין כרגע תמונות בגלריה.</p>
            )}
          </div>
        )}

        {/* ----- שלב 4: פרטים ----- */}
        {step === "details" && service && date && time && (
          <div className="animate-fade-up">
            <h2 className="mb-4 text-2xl text-noir-900">הפרטים שלכם</h2>

            <div className="glass-light mb-4 overflow-hidden rounded-3xl">
              <div className="flex items-center gap-3 p-4">
                <CalendarCheck className="h-5 w-5 text-rose-500" />
                <div className="text-sm">
                  <p className="font-semibold text-noir-900">{service.name}</p>
                  <p className="tabular text-noir-700">
                    {formatDateHebrew(date)} · {time} · {service.price} ₪
                  </p>
                </div>
              </div>
              {selectedInspoImages.length > 0 && (
                <div className="flex items-center gap-2 border-t border-black/10 px-4 py-3">
                  <span className="text-xs font-medium text-noir-700">
                    השראה ({selectedInspoImages.length}):
                  </span>
                  <div className="flex -space-x-2 space-x-reverse">
                    {selectedInspoImages.slice(0, 5).map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={img.src}
                        alt=""
                        className="h-9 w-9 rounded-lg border-2 border-cream object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (validDetails) submit();
              }}
            >
              <div>
                <label htmlFor="name" className="label-field">
                  שם מלא
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="input-field"
                  placeholder="ישראלה ישראלי"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="phone" className="label-field">
                  טלפון
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  className="input-field text-right"
                  placeholder="050-1234567"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="email" className="label-field">
                  אימייל{" "}
                  <span className="font-normal text-neutral-400">(אופציונלי)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  className="input-field text-right"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-neutral-400">
                  אם תמלאו — נשלח אישור ותזכורת למייל
                </p>
              </div>

              <div>
                <label htmlFor="notes" className="label-field">
                  הערות (אופציונלי)
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  className="input-field resize-none"
                  placeholder="בקשות מיוחדות, צבע מועדף..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-200">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {error}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      <BottomBar
        step={step}
        canContinueDatetime={!!date && !!time}
        canSubmit={validDetails}
        submitting={submitting}
        inspoCount={selectedInspo.length}
        onNext={() => {
          if (step === "datetime") setStep("inspo");
          else if (step === "inspo") setStep("details");
        }}
        onBack={() => {
          if (step === "details") setStep("inspo");
          else if (step === "inspo") setStep("datetime");
        }}
        onSubmit={submit}
      />
    </div>
  );
}

function BottomBar({
  step,
  canContinueDatetime,
  canSubmit,
  submitting,
  inspoCount,
  onNext,
  onBack,
  onSubmit,
}: {
  step: Step;
  canContinueDatetime: boolean;
  canSubmit: boolean;
  submitting: boolean;
  inspoCount: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  if (step === "service") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur-xl">
      <div className="container-app flex gap-3 px-0">
        {(step === "details" || step === "inspo") && (
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            חזרה
          </button>
        )}
        {step === "datetime" && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinueDatetime}
            className="btn-primary flex-1"
          >
            המשך
          </button>
        )}
        {step === "inspo" && (
          <button type="button" onClick={onNext} className="btn-primary flex-[2]">
            {inspoCount > 0 ? `המשך · ${inspoCount} נבחרו` : "דלג והמשך"}
          </button>
        )}
        {step === "details" && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="btn-primary flex-[2]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                אישור התור
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessScreen({
  data,
  onReset,
}: {
  data: SuccessData;
  onReset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="animate-scale-in">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gold/15">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold">
            <Sparkles className="h-8 w-8 text-noir-900" />
          </div>
        </div>
      </div>

      <h1 className="animate-fade-up text-3xl text-noir-900">התור נקבע!</h1>
      <p className="mt-2 animate-fade-up text-neutral-600 [animation-delay:80ms] dark:text-neutral-400">
        התור נקלט בהצלחה. נתראה בקרוב!
      </p>

      <div className="glass mt-6 w-full max-w-sm animate-fade-up rounded-3xl p-5 text-right [animation-delay:160ms]">
        <Row label="שירות" value={data.serviceName} />
        <Row label="תאריך" value={formatDateHebrew(data.date)} />
        <Row label="שעה" value={data.startTime} />
        <Row label="מחיר" value={`${data.price} ₪`} last />
      </div>

      <div className="mt-6 w-full max-w-sm animate-fade-up [animation-delay:240ms]">
        <button onClick={onReset} className="btn-primary w-full">
          <Home className="h-5 w-5" />
          חזרה לדף הבית
        </button>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between py-2.5",
        last ? "" : "border-b border-neutral-200",
      ].join(" ")}
    >
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="tabular text-sm font-semibold text-noir-900">{value}</span>
    </div>
  );
}
