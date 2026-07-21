/**
 * נרמול ואימות קישורי תמונות לגלריית השראה.
 * דפי אלבום/שיתוף (Imgur album, Drive view) לא נטענים ב-<img>.
 */

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?.*)?$/i;

export function normalizeInspoSrc(raw: string): string {
  const src = raw.trim();
  if (!src) return src;

  // נתיב מקומי
  if (src.startsWith("/")) return src;

  try {
    const u = new URL(src);

    // Google Drive: /file/d/FILE_ID/view → קישור ישיר להטמעה
    const driveMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (
      (u.hostname === "drive.google.com" ||
        u.hostname.endsWith(".google.com")) &&
      driveMatch
    ) {
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }

    // Imgur album / gallery — לא תמונה ישירה
    if (
      u.hostname.replace(/^www\./, "") === "imgur.com" &&
      (u.pathname.startsWith("/a/") || u.pathname.startsWith("/gallery/"))
    ) {
      return src; // נשאר כמו שהוא — יידחה באימות
    }

    // Imgur דף בודד: imgur.com/abc123 → i.imgur.com/abc123.jpg
    if (u.hostname.replace(/^www\./, "") === "imgur.com") {
      const id = u.pathname.replace(/^\//, "").split(/[/#?]/)[0];
      if (id && !id.includes(".") && /^[a-zA-Z0-9]+$/.test(id)) {
        return `https://i.imgur.com/${id}.jpg`;
      }
    }

    return src;
  } catch {
    return src;
  }
}

export function isDirectImageSrc(src: string): boolean {
  const normalized = normalizeInspoSrc(src).trim();
  if (!normalized) return false;

  if (normalized.startsWith("/")) return true;

  try {
    const u = new URL(normalized);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;

    const host = u.hostname.replace(/^www\./, "");

    // אלבומים / דפי שיתוף — לא תקינים
    if (host === "imgur.com" && u.pathname.startsWith("/a/")) return false;
    if (host === "imgur.com" && u.pathname.startsWith("/gallery/")) return false;
    if (host === "drive.google.com" && u.pathname.includes("/file/d/")) {
      // אחרי נרמול אמור להיות uc?export=view
      return false;
    }

    // קישורי הטמעה מוכרים
    if (host === "i.imgur.com") return true;
    if (host === "drive.google.com" && u.searchParams.get("export") === "view")
      return true;
    if (host === "lh3.googleusercontent.com") return true;

    // סיומת קובץ תמונה
    if (IMAGE_EXT.test(u.pathname)) return true;

    // query עם format= או raw
    if (/[?&](format|raw)=/i.test(u.search)) return true;

    return false;
  } catch {
    return false;
  }
}

export function inspoSrcErrorMessage(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return "נדרש נתיב או קישור לתמונה";

  const normalized = normalizeInspoSrc(trimmed);

  try {
    if (!normalized.startsWith("/")) {
      const u = new URL(normalized);
      const host = u.hostname.replace(/^www\./, "");
      if (
        host === "imgur.com" &&
        (u.pathname.startsWith("/a/") || u.pathname.startsWith("/gallery/"))
      ) {
        return "זה קישור לאלבום, לא לתמונה. ב-Imgur לחצו על התמונה → Copy link / Direct link (i.imgur.com/....jpg)";
      }
      if (host === "drive.google.com" && u.pathname.includes("/file/d/")) {
        // אמור להיות מנורמל — אם עדיין כאן, הקישור לא תקין
        return "קישור Google Drive לא נתמך כך. השתמשו בקישור ישיר או העלו ל-Imgur (Direct link).";
      }
    }
  } catch {
    return "קישור לא תקין";
  }

  if (!isDirectImageSrc(normalized)) {
    return "הקישור חייב להיות לתמונה ישירה (מסתיים ב-.jpg/.png או i.imgur.com/...), לא לדף אינטרנט";
  }

  return null;
}
