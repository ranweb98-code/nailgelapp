import { prisma } from "@/lib/prisma";

export interface BusinessSettings {
  businessName: string;
  businessTagline: string;
  phone: string;
  address: string;
  slotStepMin: string;
}

const defaults: BusinessSettings = {
  businessName: "Gel Studio",
  businessTagline: "אמנות הציפורניים",
  phone: "050-0000000",
  address: "רחוב הדוגמה 1, תל אביב",
  slotStepMin: "30",
};

export async function getSettings(): Promise<BusinessSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...defaults, ...map } as BusinessSettings;
}
