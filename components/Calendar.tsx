"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { HEBREW_MONTHS, toDateString } from "@/lib/time";

interface Props {
  openDaysOfWeek: number[];
  blockedDates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
}

const SHORT_DAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

export function Calendar({
  openDaysOfWeek,
  blockedDates,
  selected,
  onSelect,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = toDateString(today);
  const openSet = useMemo(() => new Set(openDaysOfWeek), [openDaysOfWeek]);
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isDayAvailable = (date: Date): boolean => {
    const ds = toDateString(date);
    if (date < today) return false;
    if (!openSet.has(date.getDay())) return false;
    if (blockedSet.has(ds)) return false;
    return true;
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goNext}
          aria-label="חודש הבא"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-noir-900 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center font-serif text-lg font-medium text-noir-900">
          {HEBREW_MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="חודש קודם"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-noir-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {SHORT_DAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-neutral-400"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const ds = toDateString(date);
          const available = isDayAvailable(date);
          const isSelected = selected === ds;
          const isToday = ds === todayStr;

          return (
            <button
              key={ds}
              type="button"
              disabled={!available}
              onClick={() => onSelect(ds)}
              aria-label={`${date.getDate()} ב${HEBREW_MONTHS[date.getMonth()]}`}
              aria-pressed={isSelected}
              className={[
                "tabular relative flex aspect-square items-center justify-center rounded-xl text-sm font-medium transition-all duration-150",
                isSelected
                  ? "bg-gold text-noir-900 shadow-glow"
                  : available
                    ? "text-noir-900 hover:bg-neutral-100 active:scale-95"
                    : "cursor-not-allowed text-neutral-400/30",
                isToday && !isSelected ? "ring-1 ring-gold/40" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
        <span className="inline-block h-2 w-2 rounded-full bg-gold/70" />
        ימים זמינים לקביעת תור
      </p>
    </div>
  );
}
