import { Resend } from "resend";
import { formatDateHebrew } from "@/lib/time";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Gel Studio <onboarding@resend.dev>";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@example.com";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
}

async function send({ to, subject, html }: SendArgs): Promise<boolean> {
  if (!resend) {
    // מצב preview - מדפיס ל-console כדי שהדמו יעבוד גם בלי מפתח Resend
    console.log("\n========== 📧 [EMAIL PREVIEW] ==========");
    console.log(`אל:     ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`נושא:   ${subject}`);
    console.log("----------------------------------------");
    console.log(htmlToText(html));
    console.log("========================================\n");
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface AppointmentEmailData {
  customerName: string;
  phone: string;
  email: string;
  serviceName: string;
  date: string;
  startTime: string;
  price: number;
  notes?: string | null;
  inspoImages?: { src: string; label: string | null }[];
}

const BUSINESS_NAME = "Studio Noir";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function layout(title: string, body: string): string {
  return `
  <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#FBF7F2; padding:32px 0; margin:0;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 8px 30px rgba(43,38,34,0.08);">
      <div style="background:linear-gradient(135deg,#B76E79,#9E5763); padding:32px 28px; text-align:center;">
        <div style="color:#F5E0E3; font-size:13px; letter-spacing:3px; text-transform:uppercase;">${BUSINESS_NAME}</div>
        <h1 style="color:#ffffff; font-size:24px; margin:8px 0 0;">${title}</h1>
      </div>
      <div style="padding:28px;">
        ${body}
      </div>
      <div style="padding:18px 28px; background:#FBF7F2; text-align:center; color:#A89F96; font-size:12px;">
        נשלח אוטומטית ממערכת התורים של ${BUSINESS_NAME}
      </div>
    </div>
  </div>`;
}

function detailsTable(data: AppointmentEmailData): string {
  const rows: [string, string][] = [
    ["שירות", data.serviceName],
    ["תאריך", formatDateHebrew(data.date)],
    ["שעה", data.startTime],
    ["מחיר", `${data.price} ₪`],
    ["שם", data.customerName],
    ["טלפון", data.phone],
  ];
  if (data.notes) rows.push(["הערות", data.notes]);

  return `<table style="width:100%; border-collapse:collapse; font-size:15px; color:#2B2622;">
    ${rows
      .map(
        ([k, v]) => `<tr>
        <td style="padding:10px 0; color:#6B635C; border-bottom:1px solid #F4ECE2; width:90px;">${k}</td>
        <td style="padding:10px 0; font-weight:600; border-bottom:1px solid #F4ECE2;">${v}</td>
      </tr>`
      )
      .join("")}
  </table>`;
}

function inspoStrip(data: AppointmentEmailData): string {
  if (!data.inspoImages || data.inspoImages.length === 0) return "";
  const thumbs = data.inspoImages
    .map((img) => {
      const url = img.src.startsWith("http") ? img.src : `${BASE_URL}${img.src}`;
      return `<img src="${url}" alt="${img.label || "השראה"}" width="72" height="90" style="width:72px;height:90px;object-fit:cover;border-radius:10px;border:1px solid #F4ECE2;" />`;
    })
    .join("");
  return `<div style="margin-top:18px;">
    <p style="color:#6B635C; font-size:13px; margin:0 0 8px;">תמונות השראה שנבחרו</p>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">${thumbs}</div>
  </div>`;
}

// אימייל לבעלת העסק - נקבע תור חדש
export async function sendOwnerNewAppointment(
  data: AppointmentEmailData
): Promise<boolean> {
  const body = `
    <p style="color:#2B2622; font-size:16px; margin-top:0;">נקבע תור חדש דרך האתר 🌸</p>
    ${detailsTable(data)}
    ${inspoStrip(data)}
    <p style="color:#6B635C; font-size:14px; margin:18px 0 0;">ניתן לאשר או לבטל את התור דרך פאנל הניהול.</p>
  `;
  return send({
    to: OWNER_EMAIL,
    subject: `תור חדש: ${data.customerName} · ${data.serviceName} · ${data.startTime}`,
    html: layout("תור חדש נקבע", body),
  });
}

// אימייל אישור ללקוחה
export async function sendCustomerConfirmation(
  data: AppointmentEmailData
): Promise<boolean> {
  if (!data.email?.trim()) return true;
  const body = `
    <p style="color:#2B2622; font-size:16px; margin-top:0;">היי ${data.customerName}, התור שלך נקלט בהצלחה!</p>
    ${detailsTable(data)}
    ${inspoStrip(data)}
    <p style="color:#6B635C; font-size:14px; margin-top:18px;">נשמח לראותך. אם צריך לשנות או לבטל, ניתן ליצור קשר בטלפון.</p>
    <p style="color:#B76E79; font-weight:600; margin-bottom:0;">מחכים לך 💅</p>
  `;
  return send({
    to: data.email,
    subject: `אישור תור · ${formatDateHebrew(data.date)} בשעה ${data.startTime}`,
    html: layout("התור שלך מאושר", body),
  });
}

// תזכורת ללקוחה לפני התור
export async function sendCustomerReminder(
  data: AppointmentEmailData
): Promise<boolean> {
  if (!data.email?.trim()) return true;
  const body = `
    <p style="color:#2B2622; font-size:16px; margin-top:0;">תזכורת קטנה 💖 יש לך תור מתקרב:</p>
    ${detailsTable(data)}
    <p style="color:#6B635C; font-size:14px; margin-bottom:0;">נתראה בקרוב!</p>
  `;
  return send({
    to: data.email,
    subject: `תזכורת לתור מחר · ${data.startTime}`,
    html: layout("תזכורת לתור", body),
  });
}
