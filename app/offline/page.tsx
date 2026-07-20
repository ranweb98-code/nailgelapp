import { WifiOff } from "lucide-react";

export const metadata = { title: "אין חיבור · Studio Noir" };

export default function OfflinePage() {
  return (
    <main className="page-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="glass flex h-16 w-16 items-center justify-center rounded-3xl">
        <WifiOff className="h-8 w-8 text-gold" />
      </div>
      <h1 className="text-2xl text-noir-900">אין חיבור לאינטרנט</h1>
      <p className="max-w-xs text-neutral-600">
        נראה שאין כרגע חיבור. בדקו את החיבור ונסו שוב כדי לקבוע תור.
      </p>
    </main>
  );
}
