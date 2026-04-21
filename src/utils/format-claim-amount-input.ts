/** Display for TD1 claim line inputs: thousands separators, empty when unset (no leading 0). */
export function formatIntegerWithCommasDisplay(value: unknown): string {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 0) return '';
    return Math.trunc(value).toLocaleString('en-US');
  }
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}
