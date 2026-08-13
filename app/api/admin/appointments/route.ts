import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { canBookAt } from "@/lib/availability";
import { tryNormalizeIsraeliPhone } from "@/lib/phone";
import {
  sendCustomerConfirmation,
  type AppointmentEmailData,
} from "@/lib/email";
import { notifyCustomerBookedByAdmin } from "@/lib/push";

export const dynamic = "force-dynamic";

const schema = z.object({
  serviceId: z.string().min(1, "יש לבחור שירות"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה"),
  customerName: z.string().trim().min(2, "יש להזין שם מלא"),
  phone: z.string().trim().transform((value, ctx) => {
    const normalized = tryNormalizeIsraeliPhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "מספר טלפון לא תקין",
      });
      return z.NEVER;
    }
    return normalized;
  }),
  email: z
    .string()
    .trim()
    .email("כתובת אימייל לא תקינה")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
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

  const bookable = await canBookAt(
    data.date,
    data.startTime,
    service.durationMin
  );
  if (!bookable.ok) {
    return NextResponse.json({ error: bookable.reason }, { status: 409 });
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
      status: "confirmed",
    },
  });

  const emailData: AppointmentEmailData = {
    customerName: appointment.customerName,
    phone: appointment.phone,
    email: appointment.email || "",
    serviceName: appointment.serviceName,
    date: appointment.date,
    startTime: appointment.startTime,
    price: appointment.price,
    notes: appointment.notes,
  };

  await Promise.allSettled([
    appointment.email
      ? sendCustomerConfirmation(emailData)
      : Promise.resolve(true),
    notifyCustomerBookedByAdmin({
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
      status: appointment.status,
    },
    { status: 201 }
  );
}
