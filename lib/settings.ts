import { prisma } from "@/lib/prisma";

export type BgTheme = "light" | "dark";

export interface BusinessSettings {
  businessName: string;
  businessTagline: string;
  phone: string;
  address: string;
  slotStepMin: string;
  /** רקע האתר: לבן (light) או שחור (dark) */
  bgTheme: BgTheme;
}

const defaults: BusinessSettings = {
  businessName: "Gel Studio",
  businessTagline: "אמנות הציפורניים",
  phone: "050-0000000",
  address: "רחוב הדוגמה 1, תל אביב",
  slotStepMin: "30",
  bgTheme: "light",
};

export function normalizeBgTheme(value: string | undefined | null): BgTheme {
  return value === "dark" ? "dark" : "light";
}

export async function getSettings(): Promise<BusinessSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const merged = { ...defaults, ...map } as BusinessSettings;
  merged.bgTheme = normalizeBgTheme(map.bgTheme ?? defaults.bgTheme);
  return merged;
}
