import Link from "next/link";
import {
  Clock,
  MapPin,
  Phone,
  ChevronLeft,
  Calendar,
  Heart,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { HEBREW_DAYS } from "@/lib/time";
import { ServiceCard } from "@/components/ServiceCard";
import { InspoPhoto } from "@/components/InspoPhoto";
import { runCleanup } from "@/lib/cleanup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await runCleanup().catch(() => {});

  const [services, settings, hours, inspo] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    getSettings(),
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.inspoImage.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      take: 8,
    }),
  ]);

  return (
    <main className="page-bg min-h-dvh pb-28">
      {/* Hero - וידאו + שם בסריף + קצה עגול */}
      <section className="hero-curve hero-edge relative z-[1] h-[72vh] min-h-[480px] w-full overflow-hidden bg-noir-900">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          src="/videos/hero.mp4"
          className="hero-edge-media absolute inset-x-0 bottom-0 w-full object-cover object-center"
        />
        <div className="hero-scrim hero-edge-media absolute inset-x-0 bottom-0" aria-hidden />

        <div className="absolute inset-x-0 bottom-0 z-[3] px-6 pb-6">
          <div className="container-app px-0">
            <p className="mb-2 text-xs uppercase tracking-[0.4em] text-gold-light">
              {settings.businessTagline}
            </p>
            <h1 className="hero-brand font-display text-[2.65rem] font-normal italic leading-[0.9] tracking-[0.02em] text-cream sm:text-6xl">
              {settings.businessName}
            </h1>
            <p className="mt-3 max-w-xs text-balance text-sm leading-relaxed text-cream-soft">
              לק ג'ל, בנייה ומניקור בעבודת יד מוקפדת. קבעו תור בכמה הקשות.
            </p>
          </div>
        </div>
      </section>

      {/* CTA — נכנס מתחת לקשת ההירו */}
      <section className="container-app relative z-[2] mt-5">
        <Link href="/book" className="btn-primary w-full">
          <Calendar className="h-5 w-5" />
          קביעת תור
        </Link>
      </section>

      {/* Services */}
      <section className="container-app mt-6">
        <div className="glass rounded-3xl p-5">
          <ul className="flex flex-col gap-3">
            {services.map((s, i) => (
              <li
                key={s.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <ServiceCard
                  id={s.id}
                  name={s.name}
                  description={s.description}
                  durationMin={s.durationMin}
                  price={s.price}
                  index={i}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Inspo gallery strip */}
      {inspo.length > 0 && (
        <section className="mt-6">
          <div className="container-app mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-gold" />
              <h2 className="text-xl text-noir-900">גלריית השראה</h2>
            </div>
            <Link
              href="/book"
              className="flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-gold-dark"
            >
              בחרו לתור
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {inspo.map((img) => (
              <Link
                key={img.id}
                href="/book"
                className="group relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-2xl border border-blush-border bg-blush-muted dark:border-neutral-700 dark:bg-noir-700"
              >
                <InspoPhoto
                  src={img.src}
                  alt={img.label || "השראה"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-900/70 to-transparent" />
                {img.label && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-noir-900/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {img.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hours & contact */}
      <section className="container-app mt-6">
        <div className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            <h2 className="text-lg text-noir-900">שעות פעילות</h2>
          </div>
          <ul className="flex flex-col divide-y divide-neutral-200">
            {hours.map((h) => (
              <li
                key={h.dayOfWeek}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-neutral-600">
                  יום {HEBREW_DAYS[h.dayOfWeek]}
                </span>
                <span
                  className={
                    h.isOpen
                      ? "tabular font-medium text-noir-900"
                      : "font-medium text-neutral-400"
                  }
                >
                  {h.isOpen ? `${h.startTime} - ${h.endTime}` : "סגור"}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-4 text-sm">
            <a
              href={`tel:${settings.phone.replace(/-/g, "")}`}
              className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-gold-dark"
            >
              <Phone className="h-4 w-4 text-gold" />
              {settings.phone}
            </a>
            <p className="flex items-center gap-2 text-neutral-600">
              <MapPin className="h-4 w-4 text-gold" />
              {settings.address}
            </p>
          </div>
        </div>
      </section>

      <footer className="container-app mt-8 text-center">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-gold-dark"
        >
          כניסת בעלת העסק
          <ChevronLeft className="h-3 w-3" />
        </Link>
      </footer>
    </main>
  );
}
