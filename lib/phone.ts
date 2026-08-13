/** מנקה מספר לפורמט ספרות ישראלי (0501234567) בלי מקפים */
export function digitsIsraeliPhone(input: string): string {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+972")) {
    digits = "0" + digits.slice(4);
  } else if (digits.startsWith("972") && digits.length >= 11) {
    digits = "0" + digits.slice(3);
  }
  return digits.replace(/\D/g, "");
}

/** 050-1234567 או 03-1234567 — או null אם לא תקין */
export function tryNormalizeIsraeliPhone(input: string): string | null {
  const n = digitsIsraeliPhone(input);
  if (!/^0\d{8,9}$/.test(n)) return null;
  if (n.length === 10) return `${n.slice(0, 3)}-${n.slice(3)}`;
  return `${n.slice(0, 2)}-${n.slice(2)}`;
}

export function isValidIsraeliPhone(input: string): boolean {
  return tryNormalizeIsraeliPhone(input) !== null;
}
