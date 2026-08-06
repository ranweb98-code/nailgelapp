import Link from "next/link";
import {
  Hand,
  Footprints,
  Gem,
  Layers,
  Sparkles,
  Eraser,
  Clock,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

const ICONS: LucideIcon[] = [Hand, Footprints, Gem, Layers, Sparkles, Eraser];

interface Props {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  index: number;
}

export function ServiceCard({
  id,
  name,
  description,
  durationMin,
  price,
  index,
}: Props) {
  const Icon = ICONS[index % ICONS.length];

  return (
    <Link
      href={`/book?service=${id}`}
      className="group flex items-center gap-4 rounded-2xl border border-blush-border bg-blush-muted p-4 transition-all duration-200 hover:border-gold/40 hover:bg-blush-card active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-gold/10 text-gold-dark transition-colors group-hover:bg-gold group-hover:text-noir-900">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-base font-semibold text-noir-900">{name}</h3>
        {description && (
          <p className="line-clamp-1 text-xs text-neutral-600">{description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-neutral-600">
          <span className="tabular flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {durationMin} דק'
          </span>
          <span className="tabular font-semibold text-gold-dark">
            {price} ₪
          </span>
        </div>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-gold-dark" />
    </Link>
  );
}
