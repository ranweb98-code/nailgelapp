import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable } from "@/lib/availability";
import {
  sendCustomerConfirmation,
  sendOwnerNewAppointment,
  type AppointmentEmailData,
} from "@/lib/email";
import { notifyNewAppointment } from "@/lib/push";

export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  serviceId: z.string().min(1, "יש לבחור שירות"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה"),
  customerName: z.string().trim().min(2, "יש להזין שם מלא"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{1,2}-?\d{7}$/, "מספר טלפון לא תקין"),
  email: z
    .string()
    .trim()
    .email("כתובת אימייל לא תקינה")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional(),
  inspoIds: z.array(z.string()).max(20).optional(),
  /** endpoint של מנוי Push במכשיר הנוכחי — לקישור מיידי לפני שליחת התראה */
  pushEndpoint: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });
  if (!service || !service.active) {
    return NextResponse.json({ error: "השירות אינו זמין" }, { status: 404 });
  }

  // בדיקה שהסלוט עדיין פנוי (מניעת קביעה כפולה)
  const available = await isSlotAvailable(
    data.date,
    data.startTime,
    service.durationMin
  );
  if (!available) {
    return NextResponse.json(
      { error: "השעה שנבחרה כבר נתפסה. אנא בחרו שעה אחרת." },
      { status: 409 }
    );
  }

  // אימות תמונות ההשראה שנבחרו
  let inspoImages: { src: string; label: string | null }[] = [];
  let inspoIdsCsv: string | null = null;
  if (data.inspoIds && data.inspoIds.length > 0) {
    const found = await prisma.inspoImage.findMany({
      where: { id: { in: data.inspoIds }, active: true },
      select: { id: true, src: true, label: true },
    });
    if (found.length > 0) {
      inspoIdsCsv = found.map((f) => f.id).join(",");
      inspoImages = found.map((f) => ({ src: f.src, label: f.label }));
    }
  }

  const email = data.email?.trim() ? data.email.trim().toLowerCase() : null;

  const appointment = await prisma.appointment.create({
    data: {
      serviceId: service.id,
      serviceName: service.name,
      durationMin: service.durationMin,
      price: service.price,
      date: data.date,
      startTime: data.startTime,
      customerName: data.customerName,
      phone: data.phone,
      email,
      notes: data.notes,
      inspoIds: inspoIdsCsv,
      status: "pending",
    },
  });

  // מקשרים את מנוי ה-Push של המכשיר לפרטי הלקוחה לפני שליחת ההתראה
  if (data.pushEndpoint) {
    await prisma.pushSubscription
      .updateMany({
        where: { endpoint: data.pushEndpoint },
        data: {
          phone: data.phone,
          email,
          role: "customer",
        },
      })
      .catch(() => {});
  }

  const emailData: AppointmentEmailData = {
    customerName: appointment.customerName,
    phone: appointment.phone,
    email: appointment.email || "",
    serviceName: appointment.serviceName,
    date: appointment.date,
    startTime: appointment.startTime,
    price: appointment.price,
    notes: appointment.notes,
    inspoImages,
  };

  // אימיילים + Push למי שהתקין את האפליקציה
  await Promise.allSettled([
    sendOwnerNewAppointment(emailData),
    appointment.email
      ? sendCustomerConfirmation(emailData)
      : Promise.resolve(true),
    notifyNewAppointment({
      customerName: appointment.customerName,
      phone: appointment.phone,
      email: appointment.email || "",
      serviceName: appointment.serviceName,
      date: appointment.date,
      startTime: appointment.startTime,
    }),
  ]);

  return NextResponse.json(
    {
      id: appointment.id,
      serviceName: appointment.serviceName,
      date: appointment.date,
      startTime: appointment.startTime,
      price: appointment.price,
    },
    { status: 201 }
  );
}
