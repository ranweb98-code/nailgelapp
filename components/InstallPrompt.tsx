"use client";

import { useEffect, useState } from "react";
import { Share, Plus, X, Download, Bell } from "lucide-react";
import { ensurePushSubscription, isStandaloneDisplay } from "@/lib/push-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "noir-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed || isStandaloneDisplay()) return;

    const isIos = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase()
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (isIos) {
      const t = setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);

    if (choice.outcome === "accepted") {
      // מיד אחרי התקנה — מבקשים הרשאת התראות (חובה בהמשך דרך ה-Gate)
      await ensurePushSubscription({ role: "customer" });
    } else {
      localStorage.setItem(DISMISS_KEY, "1");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-fade-up px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="container-app glass-strong flex items-center gap-3 rounded-3xl p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          {showIosHint ? (
            <p className="text-sm leading-snug text-noir-900">
              להוספה למסך הבית: הקישו על{" "}
              <Share className="inline h-4 w-4 text-gold" /> ואז על &quot;הוסף
              למסך הבית&quot; <Plus className="inline h-3.5 w-3.5" />. אחרי
              הפתיחה מהמסך הבית — חובה לאפשר התראות.
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-noir-900">
                התקינו את האפליקציה
              </p>
              <p className="text-xs text-neutral-600">
                גישה מהירה + התראות על תורים{" "}
                <Bell className="inline h-3 w-3 text-gold" />
              </p>
            </>
          )}
        </div>
        {!showIosHint && (
          <button
            onClick={install}
            className="btn-primary shrink-0 px-4 py-2.5 text-sm"
            aria-label="התקן אפליקציה"
          >
            <Download className="h-4 w-4" />
            התקן
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="סגור"
          className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-noir-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
