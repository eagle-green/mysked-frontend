import { formatNumberLocale } from 'src/locales';

// ----------------------------------------------------------------------

/*
 * Locales code
 * https://gist.github.com/raushankrjha/d1c7e35cf87e69aa8b4208a8171a8416
 */

export type InputNumberValue = string | number | null | undefined;

type Options = Intl.NumberFormatOptions;

const DEFAULT_LOCALE = { code: 'en-US', currency: 'USD' };

function processInput(inputValue: InputNumberValue): number | null {
  if (inputValue == null || Number.isNaN(inputValue)) return null;
  return Number(inputValue);
}

// ----------------------------------------------------------------------

export function fNumber(inputValue: InputNumberValue, options?: Options) {
  const locale = formatNumberLocale() || DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  return fm;
}

// ----------------------------------------------------------------------

export function fCurrency(inputValue: InputNumberValue, options?: Options) {
  const locale = formatNumberLocale() || DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    style: 'currency',
    currency: locale.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  return fm;
}

// ----------------------------------------------------------------------

export function fPercent(inputValue: InputNumberValue, options?: Options) {
  const locale = formatNumberLocale() || DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options,
  }).format(number / 100);

  return fm;
}

// ----------------------------------------------------------------------

export function fShortenNumber(inputValue: InputNumberValue, options?: Options) {
  const locale = formatNumberLocale() || DEFAULT_LOCALE;

  const number = processInput(inputValue);
  if (number === null) return '';

  const fm = new Intl.NumberFormat(locale.code, {
    notation: 'compact',
    maximumFractionDigits: 2,
    ...options,
  }).format(number);

  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

// ----------------------------------------------------------------------

export function fData(inputValue: InputNumberValue) {
  const number = processInput(inputValue);
  if (number === null || number === 0) return '0 bytes';

  const units = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
  const decimal = 2;
  const baseValue = 1024;

  const index = Math.floor(Math.log(number) / Math.log(baseValue));
  const fm = `${parseFloat((number / baseValue ** index).toFixed(decimal))} ${units[index]}`;

  return fm;
}

export function formatPhoneNumberSimple(number: string | null) {
  if (!number) return '';

  // Remove all non-digit characters
  let cleaned = number.replace(/\D/g, '');

  // Canada: country code 1, 10 digits after
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.length === 10) {
    // Canadian format: XXX XXX XXXX
    const areaCode = cleaned.slice(0, 3);
    const firstPart = cleaned.slice(3, 6);
    const secondPart = cleaned.slice(6);
    return `${areaCode} ${firstPart} ${secondPart}`;
  }

  // Pakistan: country code 92, 10 digits after
  if (cleaned.length === 12 && cleaned.startsWith('92')) {
    const countryCode = cleaned.slice(0, 2);
    const remaining = cleaned.slice(2);
    
    // Mobile numbers (start with 3): +92 3XX XXX XXXX
    if (remaining.startsWith('3')) {
      const prefix = remaining.slice(0, 3);
      const firstPart = remaining.slice(3, 6);
      const secondPart = remaining.slice(6);
      return `+${countryCode} ${prefix} ${firstPart} ${secondPart}`;
    }
    
    // Landline numbers: +92 XX XXXX XXXX
    const areaCode = remaining.slice(0, 2);
    const firstPart = remaining.slice(2, 6);
    const secondPart = remaining.slice(6);
    return `+${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
  }

  // Philippines: country code 63, 10 digits after
  if (cleaned.length === 12 && cleaned.startsWith('63')) {
    cleaned = '0' + cleaned.slice(2); // Convert +63 to 0
  }
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    // Philippine format: 0XXX XXX XXXX
    const prefix = cleaned.slice(0, 4);
    const firstPart = cleaned.slice(4, 7);
    const secondPart = cleaned.slice(7);
    return `${prefix} ${firstPart} ${secondPart}`;
  }

  // Fallback: return as is
  return number;
}
