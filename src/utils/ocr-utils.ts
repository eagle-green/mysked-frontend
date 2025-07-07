import { createWorker } from 'tesseract.js';

// ----------------------------------------------------------------------

export interface OCRResult {
  text: string;
  confidence: number;
  expirationDate?: string;
}

// ----------------------------------------------------------------------

/**
 * Extract text from an image using OCR
 */
export async function extractTextFromImage(file: File): Promise<OCRResult> {
  try {
    const worker = await createWorker('eng');

    // Configure OCR for better text recognition
    await worker.setParameters({
      tessedit_char_whitelist:
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/:.- ',
      preserve_interword_spaces: '1',
    });

    // Convert file to base64 for Tesseract
    const base64 = await fileToBase64(file);

    const { data } = await worker.recognize(base64);

    await worker.terminate();

    return {
      text: data.text,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Clean OCR text to improve date detection
 */
function cleanOCRText(text: string): string {
  // Remove excessive whitespace and normalize
  let cleaned = text.replace(/\s+/g, ' ').trim();

  // Try to fix common OCR mistakes
  cleaned = cleaned
    .replace(/[|]/g, 'I') // Fix vertical bars that should be I
    .replace(/[0O]/g, '0') // Fix O that should be 0 in dates
    .replace(/[1l]/g, '1') // Fix l that should be 1 in dates
    .replace(/[5S]/g, '5') // Fix S that should be 5 in dates
    .replace(/[8B]/g, '8') // Fix B that should be 8 in dates
    .replace(/[6G]/g, '6') // Fix G that should be 6 in dates
    .replace(/[9g]/g, '9') // Fix g that should be 9 in dates
    .replace(/[2Z]/g, '2') // Fix Z that should be 2 in dates
    .replace(/[3E]/g, '3') // Fix E that should be 3 in dates
    .replace(/[7T]/g, '7'); // Fix T that should be 7 in dates

  return cleaned;
}

/**
 * Extract expiration date from OCR text
 */
export function extractExpirationDate(text: string): string | null {
  const cleanedText = cleanOCRText(text);

  // Helper to extract all dates from a given text
  function extractAllDates(searchText: string): string[] {
    const monthShort = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*';
    const monthFull =
      '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
    const datePatterns = [
      // Flexible keyword, allow for optional whitespace/line breaks, case-insensitive
      new RegExp(
        `(?:exp\\w*|valid|expires|date|expiration|expiry|exp1ry|3xpiry)[^\\w\\n\\r]{0,10}([0-9]{1,2}\\s+${monthShort}\\s+[0-9]{4})`,
        'gi'
      ),
      new RegExp(
        `(?:exp\\w*|valid|expires|date|expiration|expiry|exp1ry|3xpiry)[^\\w\\n\\r]{0,10}(${monthShort}\\s+[0-9]{1,2}\\s+[0-9]{4})`,
        'gi'
      ),
      // Full month name, with optional comma
      new RegExp(
        `(?:exp\\w*|valid|expires|date|expiration|expiry|exp1ry|3xpiry)[^\\w\\n\\r]{0,10}(${monthFull}\\s+[0-9]{1,2},?\\s+[0-9]{4})`,
        'gi'
      ),
      // Also match 'Date: January 10, 2028' and similar
      new RegExp(`Date[^\\w\\n\\r]{0,10}([0-9]{1,2}\\s+${monthShort}\\s+[0-9]{4})`, 'gi'),
      new RegExp(`Date[^\\w\\n\\r]{0,10}(${monthShort}\\s+[0-9]{1,2}\\s+[0-9]{4})`, 'gi'),
      new RegExp(`Date[^\\w\\n\\r]{0,10}(${monthFull}\\s+[0-9]{1,2},?\\s+[0-9]{4})`, 'gi'),
      // Catch-all: any line with a month name and 4-digit year
      new RegExp(`([0-9]{1,2}\\s+${monthShort}\\s+[0-9]{4})`, 'gi'),
      new RegExp(`(${monthShort}\\s+[0-9]{1,2}\\s+[0-9]{4})`, 'gi'),
      new RegExp(`(${monthFull}\\s+[0-9]{1,2},?\\s+[0-9]{4})`, 'gi'),
      // Year-Month-Day format with month names (e.g., 2029-Jun-27, 2024-December-25)
      new RegExp(`([0-9]{4}-${monthShort}-[0-9]{1,2})`, 'gi'),
      new RegExp(`([0-9]{4}-${monthFull}-[0-9]{1,2})`, 'gi'),
      /([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/g,
      /([0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2})/g,
      // Month name + day + 2-digit year (e.g., April 6/23, Apr 6/23)
      new RegExp(`(${monthShort}\\s+\\d{1,2}/\\d{2})`, 'gi'),
      new RegExp(`(${monthFull}\\s+\\d{1,2}/\\d{2})`, 'gi'),
      // Numeric date with 2-digit year (e.g., 4/6/23)
      /([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2})/g,
    ];
    const allDates: string[] = [];
    // Log each line being checked
    const lines = searchText.split(/\n|\r/);
    for (const line of lines) {
      for (const pattern of datePatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          if (match[1]) {
            allDates.push(match[1]);
          }
        }
      }
    }
    return allDates;
  }

  // Try original text first
  let allDates = extractAllDates(text);
  if (allDates.length === 0) {
    // Fallback to cleaned text
    allDates = extractAllDates(cleanedText);
  }

  if (allDates.length > 0) {
    const parsedDates = allDates
      .map((d) => ({ raw: d, parsed: parseAndValidateDate(d) }))
      .filter((d) => d.parsed)
      .sort((a, b) => (a.parsed! > b.parsed! ? 1 : -1));
    if (parsedDates.length > 0) {
      const chosen = parsedDates[parsedDates.length - 1];
      return chosen.parsed!;
    }
  }

  return null;
}

/**
 * Parse and validate a date string
 */
function parseAndValidateDate(dateString: string): string | null {
  try {
    // Handle different date formats
    let normalizedDate = dateString.trim();

    // Handle Year-Month-Day format with month names (e.g., "2029-Jun-27", "2024-December-25")
    const yearMonthDayPattern = normalizedDate.match(
      /^(\d{4})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-(\d{1,2})$/i
    );
    if (yearMonthDayPattern) {
      const year = yearMonthDayPattern[1];
      const month = yearMonthDayPattern[2];
      const day = yearMonthDayPattern[3];
      // Compose a string like 'Jun 27, 2029'
      const dateStr = `${month} ${day}, ${year}`;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const result = `${y}-${m}-${d}`;
        return result;
      }
    }

    // Handle month name formats (e.g., "18 Sep 2027", "Sep 18 2027")
    const monthNamePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i;
    if (monthNamePattern.test(normalizedDate)) {
      // Try to parse date with month names
      const date = new Date(normalizedDate);
      if (!isNaN(date.getTime())) {
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        return result;
      }
    }

    // Handle numeric date formats
    // Replace common separators with dashes
    normalizedDate = normalizedDate.replace(/[/.]/g, '-');

    // Handle 2-digit years
    if (normalizedDate.match(/^\d{1,2}-\d{1,2}-\d{2}$/)) {
      const parts = normalizedDate.split('-');
      const year = parseInt(parts[2]);
      // Assume years 00-29 are 2000-2029, years 30-99 are 1930-1999
      const fullYear = year < 30 ? 2000 + year : 1900 + year;
      normalizedDate = `${parts[0]}-${parts[1]}-${fullYear}`;
    }

    // Try to match 'April 6/23' or 'Apr 6/23'
    const monthDayShortYear = normalizedDate.match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\/(\d{2})$/i
    );
    if (monthDayShortYear) {
      const month = monthDayShortYear[1];
      const day = monthDayShortYear[2];
      const year = parseInt(monthDayShortYear[3], 10);
      const fullYear = year < 30 ? 2000 + year : 1900 + year;
      // Compose a string like 'Apr 6, 2023'
      const dateStr = `${month} ${day}, ${fullYear}`;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    // Try to match 'April 6/23' (full month)
    const monthFullDayShortYear = normalizedDate.match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\/(\d{2})$/i
    );
    if (monthFullDayShortYear) {
      const month = monthFullDayShortYear[1];
      const day = monthFullDayShortYear[2];
      const year = parseInt(monthFullDayShortYear[3], 10);
      const fullYear = year < 30 ? 2000 + year : 1900 + year;
      const dateStr = `${month} ${day}, ${fullYear}`;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    // Try to match numeric 2-digit year (e.g., 4-6-23 or 4/6/23)
    const numericShortYear = normalizedDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
    if (numericShortYear) {
      const month = numericShortYear[1];
      const day = numericShortYear[2];
      const year = parseInt(numericShortYear[3], 10);
      const fullYear = year < 30 ? 2000 + year : 1900 + year;
      const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    // Try to parse the date
    const date = new Date(normalizedDate);

    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      return null;
    }

    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Extract expiration date from image file
 */
export async function extractExpirationDateFromImage(file: File): Promise<string | null> {
  try {
    const ocrResult = await extractTextFromImage(file);

    const expirationDate = extractExpirationDate(ocrResult.text);

    if (expirationDate) {
      return expirationDate;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Failed to extract expiration date from image:', error);
    return null;
  }
}

/**
 * Check if OCR is supported in the current environment
 */
export function isOCRSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof createWorker === 'function' &&
    typeof FileReader !== 'undefined'
  );
}
