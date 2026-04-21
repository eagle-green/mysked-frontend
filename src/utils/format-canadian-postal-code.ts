/** Canadian postal code after formatting: `A1A 1B1` (7 characters). */
export const CANADIAN_POSTAL_CODE_FULL = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;

/**
 * Uppercase letters, strip non-alphanumeric, keep at most 6 symbols, insert space after third.
 * Example: `v6y1g2` → `V6Y 1G2`
 */
export function formatCanadianPostalCodeInput(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const core = cleaned.slice(0, 6);
  if (core.length <= 3) return core;
  return `${core.slice(0, 3)} ${core.slice(3)}`;
}
