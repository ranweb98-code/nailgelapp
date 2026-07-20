"use client";

import { useEffect } from "react";
import { ensurePushSubscription } from "@/lib/push-client";

/** נרשם ל-Push כבעלת עסק כשפאנל הניהול פתוח באפליקציה המותקנת */
export function OwnerPushSetup() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    void ensurePushSubscription({ role: "owner" });
  }, []);

  return null;
}
