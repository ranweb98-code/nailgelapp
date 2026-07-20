"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Settings, LogOut, Home } from "lucide-react";

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
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-5 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl dark:border-neutral-800 dark:bg-noir-900/90">
      <div className="container-app px-0">
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 font-serif text-lg font-medium text-noir-900">
            פאנל ניהול
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href="/"
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-gold-dark dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <Home className="h-4 w-4" />
              מסך הבית
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-gold-dark dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <LogOut className="h-4 w-4" />
              יציאה
            </button>
          </div>
        </div>

        <nav className="mt-2 flex gap-1">
          {tabs.map((t) => {
            const active =
              t.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold text-noir-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
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
