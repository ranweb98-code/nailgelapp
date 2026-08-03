"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share, Plus, Download, Smartphone } from "lucide-react";
import { ensurePushSubscription, isStandaloneDisplay } from "@/lib/push-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SKIP_KEY = "noir-install-dismissed";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  if (/android|iphone|ipad|ipod/.test(ua)) return true;
  return window.navigator.maxTouchPoints > 1 && window.innerWidth < 1024;
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

type GatePhase = "checking" | "hidden" | "recommend";

/**
 * בכניסה ראשונה מהדפדפן (לא ממסך הבית) — מציגים קודם המלצה להוספה למסך הבית.
 * אפשר להמשיך בדפדפן; אחרי התקנה ופתיחה מ-standalone — השער לא מוצג.
 */
export function HomeScreenInstallGate() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<GatePhase>("checking");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [iosHint, setIosHint] = useState(false);
  const [installBusy, setInstallBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname?.startsWith("/admin")) {
      setPhase("hidden");
      return;
    }

    if (isStandaloneDisplay()) {
      setPhase("hidden");
      return;
    }

    if (!isMobileDevice()) {
      setPhase("hidden");
      return;
    }

    if (localStorage.getItem(SKIP_KEY)) {
      setPhase("hidden");
      return;
    }

    setIosHint(isIosDevice());
    setPhase("recommend");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [pathname]);

  const skip = () => {
    localStorage.setItem(SKIP_KEY, "1");
    setPhase("hidden");
  };

  const install = async () => {
    if (!deferred) return;
    setInstallBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") {
        localStorage.setItem(SKIP_KEY, "1");
        await ensurePushSubscription({ role: "customer" });
        setPhase("hidden");
      }
    } finally {
      setInstallBusy(false);
    }
  };

  if (phase !== "recommend") return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-noir-900/75 p-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] backdrop-blur-sm sm:items-center">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
          <Smartphone className="h-5 w-5 text-gold" />
        </div>

        <h2 className="text-xl font-semibold text-noir-900">
          הוסיפו את Studio Noir למסך הבית
        </h2>

        {iosHint ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            כך תקבלו גישה מהירה ותזכורות על תורים. הקישו על{" "}
            <Share className="inline h-4 w-4 text-gold" aria-hidden /> למטה,
            ובחרו &quot;הוסף למסך הבית&quot;{" "}
            <Plus className="inline h-3.5 w-3.5" aria-hidden />. אחרי שתפתחו
            מהאייקון — נבקש לאפשר התראות.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            מומלץ להתקין את האפליקציה למסך הבית — גישה מהירה, חוויה מלאה
            והתראות על תורים ואישורים.
          </p>
        )}

        {!iosHint && deferred && (
          <button
            type="button"
            onClick={() => void install()}
            disabled={installBusy}
            className="btn-primary mt-5 w-full"
          >
            <Download className="h-5 w-5" />
            {installBusy ? "מתקינים..." : "הוסיפו למסך הבית"}
          </button>
        )}

        {iosHint && (
          <p className="mt-4 rounded-2xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
            אחרי שהוספתם — סגרו את הדפדפן ופתחו את האפליקציה מהאייקון
            במסך הבית.
          </p>
        )}

        <button
          type="button"
          onClick={skip}
          className="mt-4 w-full rounded-2xl py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-noir-900"
        >
          המשיכי בדפדפן בינתיים
        </button>
      </div>
    </div>
  );
}
