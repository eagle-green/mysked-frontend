const SIN_LEN = 9;

/** Extract up to 9 digits for storage / validation. */
export function normalizeCanadianSin(input: string | undefined | null): string {
  if (input == null) return '';
  return String(input).replace(/\D/g, '').slice(0, SIN_LEN);
}

/** Display SIN as ###-###-### when complete; progressive groups while typing. */
export function formatSinForDisplay(input: string | undefined | null): string {
  const d = normalizeCanadianSin(input);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}
