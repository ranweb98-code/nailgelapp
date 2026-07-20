"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, BellOff, ShieldAlert } from "lucide-react";
import {
  ensurePushSubscription,
  isStandaloneDisplay,
  notificationPermission,
} from "@/lib/push-client";

type GateState = "checking" | "ok" | "need-permission" | "denied" | "unsupported";

/**
 * שער חובה למשתמשי האפליקציה המותקנת (standalone):
 * בלי הרשאת התראות — לא ממשיכים להשתמש באפליקציה.
 */
export function NotificationPermissionGate() {
  const pathname = usePathname();
  const role: "customer" | "owner" = pathname?.startsWith("/admin")
    ? "owner"
    : "customer";

  const [state, setState] = useState<GateState>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async () => {
    if (typeof window === "undefined") return;

    // בדפי התחברות לאפדמין — לא חוסמים לפני שיש session
    if (pathname === "/admin/login") {
      setState("ok");
      return;
    }

    // רק באפליקציה המותקנת — בדפדפן רגיל לא חוסמים
    if (!isStandaloneDisplay()) {
      setState("ok");
      return;
    }

    const perm = notificationPermission();
    if (perm === "unsupported") {
      setState("unsupported");
      return;
    }
    if (perm === "denied") {
      setState("denied");
      return;
    }
    if (perm === "granted") {
      const result = await ensurePushSubscription({ role });
      setState(result.ok ? "ok" : "need-permission");
      if (!result.ok && result.reason === "no-vapid") {
        setError("חסרים מפתחות התראות בשרת. פנו למפתח.");
      }
      return;
    }

    setState("need-permission");
  }, [role, pathname]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  const enable = async () => {
    setBusy(true);
    setError(null);
    const result = await ensurePushSubscription({ role });
    setBusy(false);

    if (result.ok) {
      setState("ok");
      return;
    }

    if (result.reason === "denied") {
      setState("denied");
      return;
    }

    const messages: Record<string, string> = {
      "no-sw": "האפליקציה עדיין נטענת. נסו שוב בעוד רגע.",
      "no-vapid": "חסרים מפתחות התראות. פנו למפתח.",
      unsupported: "המכשיר לא תומך בהתראות.",
      insecure: "נדרש חיבור מאובטח (HTTPS).",
      "save-failed": "שמירת ההרשמה נכשלה. נסו שוב.",
    };
    setError(messages[result.reason || ""] || "לא הצלחנו להפעיל התראות.");
    setState("need-permission");
  };

  if (state === "checking" || state === "ok") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-noir-900/80 p-5 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
          {state === "denied" ? (
            <BellOff className="h-8 w-8 text-gold" />
          ) : state === "unsupported" ? (
            <ShieldAlert className="h-8 w-8 text-gold" />
          ) : (
            <Bell className="h-8 w-8 text-gold" />
          )}
        </div>

        <h2 className="text-xl font-semibold text-noir-900">
          {state === "denied"
            ? "ההתראות חסומות"
            : state === "unsupported"
              ? "אין תמיכה בהתראות"
              : "נדרשות הרשאות להתראות"}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {state === "denied"
            ? "כדי לקבל עדכונים על תורים, יש לאפשר התראות בהגדרות המכשיר/הדפדפן ואז לחזור לאפליקציה."
            : state === "unsupported"
              ? "המכשיר או הדפדפן לא תומכים בהתראות Push. אפשר להמשיך מהדפדפן הרגיל."
              : role === "owner"
                ? "בעלת העסק חייבת לאפשר התראות כדי לקבל התראה על כל תור חדש."
                : "כדי להשתמש באפליקציה המותקנת חובה לאפשר התראות — לאישורי תורים ותזכורות."}
        </p>

        {error && (
          <p className="mt-3 rounded-2xl bg-rose-500/10 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        {state === "need-permission" && (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="btn-primary mt-5 w-full"
          >
            <Bell className="h-5 w-5" />
            {busy ? "מפעילים..." : "אפשרי התראות"}
          </button>
        )}

        {state === "denied" && (
          <button
            type="button"
            onClick={() => void evaluate()}
            className="btn-primary mt-5 w-full"
          >
            בדקתי — נסו שוב
          </button>
        )}
      </div>
    </div>
  );
}
