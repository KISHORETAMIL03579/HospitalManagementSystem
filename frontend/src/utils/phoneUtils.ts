/**
 * Validates international phone number according to standard E.164 rules.
 * Accepts numbers starting with '+' followed by country dialing code and subscriber number (7 to 15 digits total).
 */
export function isValidInternationalPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const clean = phone.trim();
  const digitsOnly = clean.replace(/\D/g, "");
  // E.164 standard: starts with '+', 7 to 15 digits total
  return (
    clean.startsWith("+") && digitsOnly.length >= 7 && digitsOnly.length <= 15
  );
}

/**
 * Normalizes phone numbers to a consistent E.164 representation (+<digits>).
 */
export function normalizeInternationalPhone(phone?: string | null): string {
  if (!phone) return "";
  const clean = phone.trim();
  const digitsOnly = clean.replace(/\D/g, "");
  return digitsOnly ? `+${digitsOnly}` : "";
}
