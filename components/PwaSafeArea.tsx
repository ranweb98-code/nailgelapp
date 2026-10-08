"use client";

import { useEffect } from "react";

function isPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function readSafeTop(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)";
  document.body.appendChild(probe);
  const envPx = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();

  const min = Math.min(screen.width, screen.height);
  const max = Math.max(screen.width, screen.height);
  const guessed = min >= 375 && max >= 812 ? 59 : 47;

  if (!isPwa()) return envPx;
  return Math.max(envPx, guessed);
}

function applySafeTop() {
  const px = readSafeTop();
  const root = document.documentElement;
  root.style.setProperty("--hero-sat", `${px}px`);
  if (isPwa()) {
    root.classList.add("is-pwa");
    root.style.backgroundColor = "#110C0D";
  }
}

export function PwaSafeArea() {
  useEffect(() => {
    applySafeTop();
    const onChange = () => applySafeTop();
    window.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("resize", onChange);
    const timers = [50, 150, 300, 600, 1200].map((ms) =>
      window.setTimeout(applySafeTop, ms)
    );
    return () => {
      window.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return null;
}
