"use client";

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { type InspoImageLite, tagLabel } from "@/lib/inspoTags";
import { InspoPhoto } from "@/components/InspoPhoto";

interface Props {
  images: InspoImageLite[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function InspoGallery({ images, selected, onToggle }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => img.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [images]);

  const filtered = useMemo(
    () =>
      activeTag ? images.filter((img) => img.tags.includes(activeTag)) : images,
    [images, activeTag]
  );

  return (
    <div>
      {/* Filter chips */}
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={`chip shrink-0 ${activeTag === null ? "chip-active" : ""}`}
        >
          הכל
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={`chip shrink-0 ${activeTag === tag ? "chip-active" : ""}`}
          >
            {tagLabel(tag)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((img) => {
          const isSelected = selected.includes(img.id);
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onToggle(img.id)}
              aria-pressed={isSelected}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-neutral-100 transition-all duration-200 active:scale-[0.98] dark:bg-noir-700 ${
                isSelected
                  ? "border-gold ring-2 ring-gold/50"
                  : "border-neutral-200"
              }`}
            >
              <InspoPhoto
                src={img.src}
                alt={img.label || "השראה"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-900/70 via-transparent to-transparent" />

              {img.label && (
                <span className="absolute bottom-2 right-2 rounded-md bg-noir-900/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                  {img.label}
                </span>
              )}

              <span
                className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
                  isSelected
                    ? "bg-gold text-noir-900"
                    : "bg-white/80 text-noir-900 shadow-sm"
                }`}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
