"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Settings, LogOut } from "lucide-react";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const tabs = [
    { href: "/admin", label: "תורים", icon: CalendarDays },
    { href: "/admin/settings", label: "הגדרות", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-5 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl">
      <div className="container-app px-0">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-medium text-noir-900">
            פאנל ניהול
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-gold-dark"
          >
            <LogOut className="h-4 w-4" />
            יציאה
          </button>
        </div>

        <nav className="mt-2 flex gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href;
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold text-noir-900"
                    : "text-neutral-600 hover:bg-neutral-100",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
