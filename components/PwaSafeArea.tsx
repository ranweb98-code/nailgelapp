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

function readEnvTop(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)";
  document.body.appendChild(probe);
  const envPx = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return envPx;
}

function applyStandaloneChrome() {
  const root = document.documentElement;
  root.style.setProperty("--hero-sat", "0px");
  if (!isPwa()) return;
  root.classList.add("is-pwa");
  root.style.colorScheme = "light";
  root.style.removeProperty("background-color");
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.remove());
}

function collectMetrics(phase: string) {
  const html = document.documentElement;
  const body = document.body;
  const hero = document.querySelector(".hero-edge") as HTMLElement | null;
  const video = document.querySelector("video");
  const vv = window.visualViewport;
  const heroRect = hero?.getBoundingClientRect();
  const videoRect = video?.getBoundingClientRect();
  const htmlCs = getComputedStyle(html);
  const bodyCs = getComputedStyle(body);
  return {
    phase,
    standaloneNav: (window.navigator as Navigator & { standalone?: boolean })
      .standalone,
    displayStandalone: window.matchMedia("(display-mode: standalone)").matches,
    displayFullscreen: window.matchMedia("(display-mode: fullscreen)").matches,
    href: location.href,
    statusBarMeta: document
      .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      ?.getAttribute("content"),
    capableMeta: document
      .querySelector('meta[name="apple-mobile-web-app-capable"]')
      ?.getAttribute("content"),
    themeColorMeta: document
      .querySelector('meta[name="theme-color"]')
      ?.getAttribute("content"),
    viewportMeta: document
      .querySelector('meta[name="viewport"]')
      ?.getAttribute("content"),
    colorScheme: htmlCs.colorScheme,
    htmlBg: htmlCs.backgroundColor,
    bodyBg: bodyCs.backgroundColor,
    bodyOverflow: `${bodyCs.overflowX}/${bodyCs.overflowY}`,
    heroSat: htmlCs.getPropertyValue("--hero-sat").trim(),
    envTop: readEnvTop(),
    appliedSafeTop: 0,
    htmlPaddingTop: htmlCs.paddingTop,
    bodyPaddingTop: bodyCs.paddingTop,
    heroMarginTop: hero ? getComputedStyle(hero).marginTop : null,
    heroTop: heroRect?.top ?? null,
    videoTop: videoRect?.top ?? null,
    videoHeight: videoRect?.height ?? null,
    innerH: window.innerHeight,
    innerW: window.innerWidth,
    screenH: window.screen.height,
    screenW: window.screen.width,
    availH: window.screen.availHeight,
    vvH: vv?.height ?? null,
    vvOffsetTop: vv?.offsetTop ?? null,
    vvPageTop: vv?.pageTop ?? null,
    scrollY: window.scrollY,
    screenMinusInner: window.screen.height - window.innerHeight,
  };
}

function dbg(
  hypothesisId: string,
  message: string,
  data: Record<string, unknown>
) {
  const payload = {
    sessionId: "46ac43",
    runId: "post-fix",
    hypothesisId,
    location: "components/PwaSafeArea.tsx",
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch("http://127.0.0.1:7548/ingest/0da604c3-08cb-43cc-b0bc-5d4cdde8fe88", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "46ac43",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  fetch("/api/debug-pwa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}

export function PwaSafeArea() {
  useEffect(() => {
    applyStandaloneChrome();
    const metrics = collectMetrics("mount");
    dbg("A", "status-bar + viewport metrics", metrics);
    dbg("C", "hero/video box vs forced sat", {
      videoTop: metrics.videoTop,
      heroTop: metrics.heroTop,
      heroMarginTop: metrics.heroMarginTop,
      heroSat: metrics.heroSat,
      envTop: metrics.envTop,
      appliedSafeTop: metrics.appliedSafeTop,
      themeColorMeta: metrics.themeColorMeta,
      colorScheme: metrics.colorScheme,
    });

    const onChange = () => applyStandaloneChrome();
    window.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("resize", onChange);

    const onScroll = () => {
      const m = collectMetrics("scroll");
      dbg("A", "after scroll — if black bar is in-document, videoTop moves", {
        scrollY: m.scrollY,
        videoTop: m.videoTop,
        heroTop: m.heroTop,
        vvOffsetTop: m.vvOffsetTop,
      });
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
