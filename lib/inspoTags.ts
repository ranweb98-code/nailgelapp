// תוויות תגים לגלריית ההשראה (טהור - שמיש בצד לקוח ושרת)

export const TAG_LABELS: Record<string, string> = {
  nude: "ניוד",
  almond: "שקדייה",
  french: "פרנץ'",
  autumn: "סתיו",
  red: "אדום",
  gold: "זהב",
  chrome: "כרום",
  art: "אומנותי",
};

export interface InspoImageLite {
  id: string;
  src: string;
  label: string | null;
  tags: string[];
}

export function parseTags(csv: string): string[] {
  return csv
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] || tag;
}
