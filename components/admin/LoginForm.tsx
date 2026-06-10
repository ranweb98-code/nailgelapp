"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "סיסמה שגויה");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("בעיית תקשורת. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass flex flex-col gap-4 rounded-3xl p-6">
      <div>
        <label htmlFor="password" className="label-field">
          סיסמה
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            id="password"
            type="password"
            autoFocus
            className="input-field pr-11"
            placeholder="הזינו סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || password.length === 0}
        className="btn-primary w-full"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "כניסה"}
      </button>
    </form>
  );
}
