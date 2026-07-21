"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Sparkles,
  CalendarOff,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  X,
  Heart,
} from "lucide-react";
import { HEBREW_DAYS, formatDateHebrew } from "@/lib/time";

interface HourRow {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}
interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  active: boolean;
}
interface BlockedRow {
  id: string;
  date: string;
  reason: string | null;
}
interface InspoRow {
  id: string;
  src: string;
  label: string | null;
  tags: string;
}

export function SettingsManager({
  initialHours,
  initialServices,
  initialBlocked,
  initialInspo,
}: {
  initialHours: HourRow[];
  initialServices: ServiceRow[];
  initialBlocked: BlockedRow[];
  initialInspo: InspoRow[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <WorkingHoursSection initial={initialHours} />
      <ServicesSection initial={initialServices} />
      <InspoSection initial={initialInspo} />
      <BlockedDatesSection initial={initialBlocked} />
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg text-noir-900">
        <Icon className="h-5 w-5 text-gold" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ---------- שעות עבודה ---------- */
function WorkingHoursSection({ initial }: { initial: HourRow[] }) {
  const router = useRouter();
  const [hours, setHours] = useState<HourRow[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // מונע hydration mismatch של input[type=time] בדפדפנים עם AM/PM
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const update = (day: number, patch: Partial<HourRow>) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === day ? { ...h, ...patch } : h))
    );
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/working-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon={Clock} title="שעות עבודה">
      <ul className="flex flex-col gap-2">
        {hours.map((h) => (
          <li
            key={h.dayOfWeek}
            className="flex items-center gap-2 rounded-2xl bg-neutral-50 p-2.5 dark:bg-noir-700"
          >
            <button
              type="button"
              dir="ltr"
              onClick={() => update(h.dayOfWeek, { isOpen: !h.isOpen })}
              className={[
                "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors",
                h.isOpen ? "bg-gold" : "bg-neutral-200 dark:bg-neutral-600",
              ].join(" ")}
              aria-pressed={h.isOpen}
              aria-label={`פתוח ביום ${HEBREW_DAYS[h.dayOfWeek]}`}
            >
              <span
                className={[
                  "h-6 w-6 rounded-full bg-white shadow transition-transform",
                  h.isOpen ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
            <span className="w-12 shrink-0 text-sm font-medium text-noir-900">
              {HEBREW_DAYS[h.dayOfWeek]}
            </span>
            {h.isOpen ? (
              <div className="flex flex-1 items-center justify-end gap-1.5" dir="ltr">
                {mounted ? (
                  <>
                    <input
                      type="time"
                      value={h.startTime}
                      onChange={(e) =>
                        update(h.dayOfWeek, { startTime: e.target.value })
                      }
                      className="tabular rounded-xl border border-neutral-200 bg-white px-2 py-1.5 text-sm text-noir-900 [color-scheme:light] dark:border-neutral-600 dark:bg-noir-800 dark:text-cream dark:[color-scheme:dark]"
                    />
                    <span className="text-neutral-400">-</span>
                    <input
                      type="time"
                      value={h.endTime}
                      onChange={(e) =>
                        update(h.dayOfWeek, { endTime: e.target.value })
                      }
                      className="tabular rounded-xl border border-neutral-200 bg-white px-2 py-1.5 text-sm text-noir-900 [color-scheme:light] dark:border-neutral-600 dark:bg-noir-800 dark:text-cream dark:[color-scheme:dark]"
                    />
                  </>
                ) : (
                  <span className="tabular text-sm text-noir-900">
                    {h.startTime} - {h.endTime}
                  </span>
                )}
              </div>
            ) : (
              <span className="flex-1 text-left text-sm text-neutral-400">
                סגור
              </span>
            )}
          </li>
        ))}
      </ul>
      <button onClick={save} disabled={saving} className="btn-primary mt-4 w-full">
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : saved ? (
          <>
            <Check className="h-5 w-5" /> נשמר
          </>
        ) : (
          "שמירת שעות"
        )}
      </button>
    </SectionCard>
  );
}

type ServiceForm = {
  name: string;
  description: string;
  durationMin: string;
  price: string;
  active: boolean;
};

const emptyServiceForm = (): ServiceForm => ({
  name: "",
  description: "",
  durationMin: "60",
  price: "120",
  active: true,
});

function isValidServiceForm(form: ServiceForm) {
  return (
    form.name.trim().length >= 2 &&
    parseInt(form.durationMin, 10) >= 15 &&
    parseInt(form.price, 10) >= 0
  );
}

/* ---------- שירותים ---------- */
function ServicesSection({ initial }: { initial: ServiceRow[] }) {
  const router = useRouter();
  const [services] = useState<ServiceRow[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyServiceForm());
  const [editForm, setEditForm] = useState<ServiceForm>(emptyServiceForm());
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (s: ServiceRow) => {
    setAdding(false);
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      description: s.description || "",
      durationMin: String(s.durationMin),
      price: String(s.price),
      active: s.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyServiceForm());
  };

  const saveEdit = async (id: string) => {
    if (!isValidServiceForm(editForm)) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          durationMin: parseInt(editForm.durationMin, 10),
          price: parseInt(editForm.price, 10),
          active: editForm.active,
        }),
      });
      if (res.ok) {
        cancelEdit();
        router.refresh();
      }
    } finally {
      setEditSaving(false);
    }
  };

  const addService = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          durationMin: parseInt(form.durationMin, 10),
          price: parseInt(form.price, 10),
        }),
      });
      if (res.ok) {
        setForm(emptyServiceForm());
        setAdding(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const removeService = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const validForm = isValidServiceForm(form);
  const validEditForm = isValidServiceForm(editForm);

  return (
    <SectionCard icon={Sparkles} title="שירותים ומחירים">
      <ul className="flex flex-col gap-2">
        {services.map((s) => (
          <li
            key={s.id}
            className={[
              "rounded-2xl bg-neutral-50 p-3",
              s.active ? "" : "opacity-50",
            ].join(" ")}
          >
            {editingId === s.id ? (
              <div className="flex flex-col gap-2.5">
                <input
                  className="input-field"
                  placeholder="שם השירות"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <input
                  className="input-field"
                  placeholder="תיאור קצר (אופציונלי)"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="label-field">משך (דקות)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field tabular"
                      value={editForm.durationMin}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          durationMin: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="label-field">מחיר (₪)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field tabular"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, price: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={editForm.active}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, active: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-neutral-300 accent-gold"
                  />
                  שירות פעיל (מוצג ללקוחות)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(s.id)}
                    disabled={!validEditForm || editSaving}
                    className="btn-primary flex-1 py-3"
                  >
                    {editSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "שמירה"
                    )}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={editSaving}
                    className="btn-secondary px-4 py-3"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-noir-900">
                    {s.name}
                    {!s.active && (
                      <span className="mr-2 text-xs text-neutral-400">
                        (לא פעיל)
                      </span>
                    )}
                  </p>
                  <p className="tabular text-xs text-neutral-600">
                    {s.durationMin} דק' · {s.price} ₪
                  </p>
                </div>
                <button
                  onClick={() => startEdit(s)}
                  disabled={busyId === s.id}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-gold/10 hover:text-gold-dark disabled:opacity-50"
                  aria-label={`עריכת ${s.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeService(s.id)}
                  disabled={busyId === s.id}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label={`מחיקת ${s.name}`}
                >
                  {busyId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-3 flex flex-col gap-2.5 rounded-2xl border border-gold/30 bg-gold/5 p-3">
          <input
            className="input-field"
            placeholder="שם השירות"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="תיאור קצר (אופציונלי)"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label-field">משך (דקות)</label>
              <input
                type="number"
                inputMode="numeric"
                className="input-field tabular"
                value={form.durationMin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMin: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="label-field">מחיר (₪)</label>
              <input
                type="number"
                inputMode="numeric"
                className="input-field tabular"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addService}
              disabled={!validForm || saving}
              className="btn-primary flex-1 py-3"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "הוספה"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="btn-secondary px-4 py-3"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            cancelEdit();
            setAdding(true);
          }}
          className="btn-secondary mt-3 w-full"
        >
          <Plus className="h-5 w-5" />
          הוספת שירות
        </button>
      )}
    </SectionCard>
  );
}

/* ---------- גלריית השראה ---------- */
function InspoSection({ initial }: { initial: InspoRow[] }) {
  const router = useRouter();
  const [images, setImages] = useState<InspoRow[]>(initial);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ src: "", label: "", tags: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setImages(initial);
  }, [initial]);

  const add = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inspo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          src: form.src,
          label: form.label || null,
          tags: form.tags,
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as InspoRow;
        setImages((prev) => [...prev, created]);
        setForm({ src: "", label: "", tags: "" });
        setAdding(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/inspo/${id}`, { method: "DELETE" });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard icon={Heart} title="גלריית השראה">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-neutral-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.label || "השראה"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-900/70 to-transparent" />
              {img.label && (
                <span className="absolute bottom-1.5 right-1.5 text-[11px] font-medium text-noir-900">
                  {img.label}
                </span>
              )}
              <button
                onClick={() => remove(img.id)}
                disabled={busyId === img.id}
                className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-noir-900 shadow-sm backdrop-blur-md transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50"
                aria-label="מחיקת תמונה"
              >
                {busyId === img.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="mt-3 flex flex-col gap-2.5 rounded-2xl border border-gold/30 bg-gold/5 p-3">
          <input
            className="input-field"
            dir="ltr"
            placeholder="/images/inspo/example.png או URL"
            value={form.src}
            onChange={(e) => setForm((f) => ({ ...f, src: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="כותרת (אופציונלי)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
          <input
            className="input-field"
            dir="ltr"
            placeholder="tags: nude,almond,autumn"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={!form.src.trim() || saving}
              className="btn-primary flex-1 py-3"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "הוספה"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="btn-secondary px-4 py-3"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="btn-secondary mt-3 w-full"
        >
          <Plus className="h-5 w-5" />
          הוספת תמונה
        </button>
      )}
    </SectionCard>
  );
}

/* ---------- ימים חסומים ---------- */
function BlockedDatesSection({ initial }: { initial: BlockedRow[] }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedRow[]>(initial);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setBlocked(initial);
  }, [initial]);

  const add = async () => {
    if (!date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason: reason || null }),
      });
      if (res.ok) {
        const created = (await res.json()) as BlockedRow;
        setBlocked((prev) =>
          [...prev, created].sort((a, b) => a.date.localeCompare(b.date))
        );
        setDate("");
        setReason("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blocked-dates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlocked((prev) => prev.filter((b) => b.id !== id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard icon={CalendarOff} title="ימים חסומים (חופשות)">
      {blocked.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {blocked.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-noir-900">
                  {formatDateHebrew(b.date)}
                </p>
                {b.reason && (
                  <p className="text-xs text-neutral-600">{b.reason}</p>
                )}
              </div>
              <button
                onClick={() => remove(b.id)}
                disabled={busyId === b.id}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                aria-label="הסרת יום חסום"
              >
                {busyId === b.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2.5 rounded-2xl bg-neutral-50 p-3">
        <input
          type="date"
          dir="ltr"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          suppressHydrationWarning
          className="input-field [color-scheme:light] dark:[color-scheme:dark]"
        />
        <input
          className="input-field"
          placeholder="סיבה (אופציונלי)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          onClick={add}
          disabled={!date || saving}
          className="btn-primary w-full py-3"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Plus className="h-5 w-5" />
              חסימת תאריך
            </>
          )}
        </button>
      </div>
    </SectionCard>
  );
}
