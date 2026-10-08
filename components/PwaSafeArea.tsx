"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function isPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function setThemeColor(content: string | null) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.remove());
  if (!content) return;
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = content;
  document.head.appendChild(meta);
}

function applyStandaloneChrome(pathname: string) {
  const root = document.documentElement;
  root.style.setProperty("--hero-sat", "0px");
  if (!isPwa()) return;
  root.classList.add("is-pwa");

  if (pathname === "/") {
    // Translucent bar over the hero: no opaque theme-color, no light color-scheme.
    root.style.colorScheme = "dark";
    setThemeColor("transparent");
  } else {
    root.style.colorScheme = "light";
    setThemeColor("#FAF5F3");
  }
}

export function PwaSafeArea() {
  const pathname = usePathname();

  useEffect(() => {
    applyStandaloneChrome(pathname || "/");
    const onChange = () => applyStandaloneChrome(pathname || "/");
    window.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
    };
  }, [pathname]);

  return null;
}
