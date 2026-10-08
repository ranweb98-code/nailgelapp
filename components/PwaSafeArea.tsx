"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DARK_FALLBACK = "#110c0d";
const LIGHT_PAGE = "#faf5f3";

function setTint(color: string) {
  document.documentElement.style.setProperty("--status-tint", color);
}

/**
 * iOS 27: צבע הפס העליון באפליקציה המותקנת נגזר מאלמנט fixed קרוב לקצה העליון.
 * הרכיב מצייר אלמנט כזה (ראו .status-tint ב-globals.css) ומעדכן את הצבע שלו
 * לפי השורה העליונה של הסרטון, כך שהפס נראה כהמשך שלו.
 */
export function PwaSafeArea() {
  const pathname = usePathname();

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>("video");

    if (!video) {
      setTint(LIGHT_PAGE);
      return;
    }

    setTint(DARK_FALLBACK);

    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 2;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;
    let lastRun = 0;
    let handle = 0;

    const sample = () => {
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        return;
      }
      try {
        // השורה העליונה של הפריים (כ-2% מהגובה)
        const stripH = Math.max(2, Math.round(video.videoHeight * 0.02));
        ctx.drawImage(
          video,
          0,
          0,
          video.videoWidth,
          stripH,
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const px = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        setTint(
          `rgb(${Math.round(r / px)}, ${Math.round(g / px)}, ${Math.round(b / px)})`
        );
      } catch {
        setTint(DARK_FALLBACK);
      }
    };

    const loop = (now: number) => {
      if (cancelled) return;
      if (now - lastRun > 250) {
        lastRun = now;
        sample();
      }
      handle = requestAnimationFrame(loop);
    };

    video.addEventListener("loadeddata", sample);
    handle = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(handle);
      video.removeEventListener("loadeddata", sample);
    };
  }, [pathname]);

  return <div className="status-tint" aria-hidden />;
}
