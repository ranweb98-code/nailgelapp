import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  {
    name: "לק ג'ל - יד",
    description: "מניקור מטופח עם לק ג'ל עמיד עד 3 שבועות",
    durationMin: 60,
    price: 120,
    order: 1,
  },
  {
    name: "לק ג'ל - רגל",
    description: "פדיקור עם לק ג'ל בגימור מושלם",
    durationMin: 60,
    price: 130,
    order: 2,
  },
  {
    name: "בנייה בג'ל",
    description: "בניית ציפורניים בג'ל באורך ובצורה לבחירתך",
    durationMin: 90,
    price: 200,
    order: 3,
  },
  {
    name: "מילוי בנייה",
    description: "חידוש ומילוי בנייה קיימת",
    durationMin: 75,
    price: 160,
    order: 4,
  },
  {
    name: "מניקור קלאסי",
    description: "טיפוח, עיצוב וברק טבעי לציפורניים",
    durationMin: 45,
    price: 80,
    order: 5,
  },
  {
    name: "הסרת לק ג'ל",
    description: "הסרה עדינה ושמירה על בריאות הציפורן",
    durationMin: 30,
    price: 40,
    order: 6,
  },
];

async function main() {
  console.log("🌱 מתחיל זריעת נתונים...");

  // שירותים
  const existingServices = await prisma.service.count();
  if (existingServices === 0) {
    for (const s of services) {
      await prisma.service.create({ data: s });
    }
    console.log(`✓ נוצרו ${services.length} שירותים`);
  } else {
    console.log("• שירותים כבר קיימים, מדלג");
  }

  // שעות עבודה - ראשון עד חמישי 09:00-19:00, שישי 09:00-14:00, שבת סגור
  const hours = [
    { dayOfWeek: 0, isOpen: true, startTime: "09:00", endTime: "19:00" }, // ראשון
    { dayOfWeek: 1, isOpen: true, startTime: "09:00", endTime: "19:00" }, // שני
    { dayOfWeek: 2, isOpen: true, startTime: "09:00", endTime: "19:00" }, // שלישי
    { dayOfWeek: 3, isOpen: true, startTime: "09:00", endTime: "19:00" }, // רביעי
    { dayOfWeek: 4, isOpen: true, startTime: "09:00", endTime: "19:00" }, // חמישי
    { dayOfWeek: 5, isOpen: true, startTime: "09:00", endTime: "14:00" }, // שישי
    { dayOfWeek: 6, isOpen: false, startTime: "09:00", endTime: "19:00" }, // שבת
  ];

  for (const h of hours) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: h.dayOfWeek },
      update: {},
      create: h,
    });
  }
  console.log("✓ הוגדרו שעות עבודה");

  // הגדרות עסק
  const settings = [
    { key: "businessName", value: "Studio Noir" },
    { key: "businessTagline", value: "אמנות הציפורניים" },
    { key: "phone", value: "050-0000000" },
    { key: "address", value: "רחוב הדוגמה 1, תל אביב" },
    { key: "slotStepMin", value: "30" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✓ הוגדרו הגדרות עסק");

  // גלריית השראה
  const inspo = [
    { src: "/images/inspo/nude.png", label: "ניוד טבעי", tags: "nude,almond" },
    { src: "/images/inspo/french.png", label: "פרנץ' מודרני", tags: "french,nude,almond" },
    { src: "/images/inspo/autumn.png", label: "גווני סתיו", tags: "autumn,almond" },
    { src: "/images/inspo/red.png", label: "אדום קלאסי", tags: "red,almond" },
    { src: "/images/inspo/gold.png", label: "עיטורי זהב", tags: "gold,art,nude" },
    { src: "/images/inspo/chrome.png", label: "כרום מנצנץ", tags: "chrome,almond" },
  ];
  const existingInspo = await prisma.inspoImage.count();
  if (existingInspo === 0) {
    let i = 1;
    for (const item of inspo) {
      await prisma.inspoImage.create({ data: { ...item, order: i++ } });
    }
    console.log(`✓ נוצרו ${inspo.length} תמונות השראה`);
  } else {
    console.log("• תמונות השראה כבר קיימות, מדלג");
  }

  console.log("🌸 הזריעה הושלמה בהצלחה!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
