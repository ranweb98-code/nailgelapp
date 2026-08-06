"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { normalizeInspoSrc } from "@/lib/inspoUrl";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** בגלריה אופקית lazy לפעמים לא טוען — ברירת מחדל eager */
  eager?: boolean;
};

export function InspoPhoto({
  src,
  alt,
  className = "h-full w-full object-cover",
  eager = true,
}: Props) {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeInspoSrc(src);
  const external =
    normalized.startsWith("http://") || normalized.startsWith("https://");

  useEffect(() => {
    setFailed(false);
  }, [normalized]);

  if (failed) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-blush-muted text-neutral-500 dark:bg-noir-700 dark:text-neutral-400"
        aria-hidden
      >
        <ImageIcon className="h-6 w-6 opacity-60" />
        <span className="px-2 text-center text-[10px] leading-tight">
          לא נטען
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={normalized}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      {...(external ? { referrerPolicy: "no-referrer" as const } : {})}
      onError={() => setFailed(true)}
    />
  );
}
