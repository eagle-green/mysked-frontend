/** North American phone for display: `778 123 1234` (strips leading +1 / 1). */
export function formatNanpPhoneDisplay(input: string | null | undefined): string {
  if (input == null || input === '') return '';
  const digits = String(input).replace(/\D/g, '');
  let d = digits;
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return String(input).trim();
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
