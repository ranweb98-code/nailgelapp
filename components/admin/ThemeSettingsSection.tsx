"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Check, Loader2 } from "lucide-react";
import type { BgTheme } from "@/lib/settings";

export function ThemeSettingsSection({
  initialTheme,
}: {
  initialTheme: BgTheme;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<BgTheme>(initialTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (next: BgTheme) => {
    setTheme(next);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgTheme: next }),
      });
      if (res.ok) {
        document.documentElement.dataset.theme = next;
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg text-noir-900 dark:text-cream">
        {theme === "dark" ? (
          <Moon className="h-5 w-5 text-gold" />
        ) : (
          <Sun className="h-5 w-5 text-gold" />
        )}
        רקע האתר
      </h2>
      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        בחרו רקע לבן או שחור לכל האתר
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => void save("light")}
          disabled={saving}
          className={[
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
            theme === "light"
              ? "border-gold bg-gold/10"
              : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700",
          ].join(" ")}
        >
          <span className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
            <Sun className="h-5 w-5 text-noir-900" />
          </span>
          <span className="text-sm font-medium text-noir-900 dark:text-cream">
            לבן
          </span>
        </button>
        <button
          type="button"
          onClick={() => void save("dark")}
          disabled={saving}
          className={[
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
            theme === "dark"
              ? "border-gold bg-gold/10"
              : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700",
          ].join(" ")}
        >
          <span className="flex h-12 w-full items-center justify-center rounded-xl bg-noir-900 shadow-sm">
            <Moon className="h-5 w-5 text-cream" />
          </span>
          <span className="text-sm font-medium text-noir-900 dark:text-cream">
            שחור
          </span>
        </button>
      </div>
      <div className="mt-3 flex h-5 items-center gap-2 text-xs text-neutral-500">
        {saving && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            שומר...
          </>
        )}
        {!saving && saved && (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            נשמר
          </>
        )}
      </div>
    </section>
  );
}
