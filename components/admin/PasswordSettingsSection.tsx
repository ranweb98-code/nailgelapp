"use client";

import { useState } from "react";
import { Lock, Check, Loader2, AlertCircle } from "lucide-react";

export function PasswordSettingsSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 4 &&
    confirmPassword.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "לא הצלחנו לעדכן את הסיסמה");
        return;
      }
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("בעיית תקשורת. נסו שוב.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-1 flex items-center gap-2 text-lg text-noir-900">
        <Lock className="h-5 w-5 text-gold" />
        שינוי סיסמה
      </h2>
      <p className="mb-4 text-sm text-neutral-600">
        עדכון סיסמת הכניסה לפאנל הניהול
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="current-password" className="label-field">
            סיסמה נוכחית
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            className="input-field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-password" className="label-field">
            סיסמה חדשה
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="label-field">
            אימות סיסמה חדשה
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {saved && !error && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            <Check className="h-5 w-5 shrink-0" />
            הסיסמה עודכנה בהצלחה
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="btn-primary w-full"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "עדכון סיסמה"}
        </button>
      </form>
    </section>
  );
}
