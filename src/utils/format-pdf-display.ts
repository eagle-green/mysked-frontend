import type { ManagementAgreement } from 'src/types/new-hire';

import dayjs from 'dayjs';

/** Title-case a single word (handles ALL CAPS input). */
function titleCaseWord(w: string): string {
  const t = w.trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** One field (last name, first name, city, etc.) → Title Case. */
export function formatSingleNameField(s: string | null | undefined): string {
  if (s == null || !String(s).trim()) return '';
  return String(s)
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}

/** "FIRST LAST" or "first last" → "First Last" for hiring package PDFs. */
export function formatPersonNameTitleCase(
  first?: string | null,
  last?: string | null,
  middle?: string | null
): string {
  const parts = [first, middle, last]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean)
    .map((p) =>
      p
        .split(/\s+/)
        .map(titleCaseWord)
        .join(' ')
    );
  return parts.join(' ');
}

/**
 * Policy acknowledgement employee line: given name then family name (e.g. "John Doe") for PDF headers and filenames.
 */
export function formatPolicyAcknowledgementEmployeeName(
  first?: string | null,
  last?: string | null
): string {
  const given = formatSingleNameField(first);
  const family = formatSingleNameField(last);
  return [given, family].filter(Boolean).join(' ');
}

/** US-style date MM/DD/YYYY for policy PDF lines (stable regardless of runtime locale). */
export function formatDateUsSlash(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const y = now.getFullYear();
  return `${m}/${d}/${y}`;
}

/**
 * Hiring package PDFs: display dates as MM/DD/YYYY. Handles ISO (YYYY-MM-DD) or slash strings from forms.
 */
export function formatDateMmDdYyyyForPdf(input: string | null | undefined): string {
  if (input == null || String(input).trim() === '') return '';
  const s = String(input).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [mm, dd, yyyy] = s.split('/');
    return `${mm.padStart(2, '0')}/${dd.padStart(2, '0')}/${yyyy}`;
  }
  const d = dayjs(s);
  return d.isValid() ? d.format('MM/DD/YYYY') : s;
}

/** Gender field values → Male / Female / Other */
export function formatGenderDisplay(g: string | null | undefined): string {
  if (g == null || g === '') return '';
  const k = String(g).trim().toLowerCase();
  if (k === 'male') return 'Male';
  if (k === 'female') return 'Female';
  if (k === 'other') return 'Other';
  return titleCaseWord(g);
}

/** NANP display as (778) 123-4353 */
export function formatNanpPhoneParentheses(input: string | null | undefined): string {
  if (input == null || input === '') return '';
  const digits = String(input).replace(/\D/g, '');
  let d = digits;
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return String(input).trim();
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Hiring manager line on policy PDFs: prefer HR manager, else supervisor. */
export function hiringManagerDisplayName(data: {
  hr_manager?: { display_name?: string };
  supervisor?: { display_name?: string };
}): string {
  const h = data.hr_manager?.display_name?.trim();
  if (h) return h;
  return data.supervisor?.display_name?.trim() ?? '';
}

/**
 * Name printed on the HIRING MANAGER line after signing. Uses the captured signer when present
 * (actual person who signed), otherwise falls back to the assigned hiring manager / supervisor on file.
 */
export function hiringManagerSignatureLineName(
  data: {
    hr_manager?: { display_name?: string };
    supervisor?: { display_name?: string };
    supervisor_agreement_signer_names?: Partial<Record<keyof ManagementAgreement, string>>;
  },
  field: keyof ManagementAgreement
): string {
  const fromSigner = data.supervisor_agreement_signer_names?.[field]?.trim();
  if (fromSigner) return fromSigner;
  return hiringManagerDisplayName(data);
}
