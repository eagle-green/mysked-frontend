/**
 * Normalize `timesheet_emails` for forms (useFieldArray). The API may return a JSON string or an array.
 */
export function parseTimesheetEmailsFromClient(
  client: { timesheet_emails?: unknown } | null | undefined
): string[] {
  if (!client) return [''];
  const raw = client.timesheet_emails;
  if (Array.isArray(raw) && raw.length > 0) {
    const filtered = raw.filter((e): e is string => typeof e === 'string' && !!e.trim());
    return filtered.length ? filtered : [''];
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p) && p.length > 0) {
        const filtered = p.filter((e): e is string => typeof e === 'string' && !!e.trim());
        if (filtered.length) return filtered;
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return [''];
}

/**
 * Client-facing document emails (timesheets, FLRA) — only `timesheet_emails`, not primary `email`.
 */
export function getRecipientEmailsFromClient(client: any): string[] {
  if (!client) return [];
  const raw = client.timesheet_emails;
  let arr: string[] = [];
  if (Array.isArray(raw)) {
    arr = raw
      .filter((e: unknown) => typeof e === 'string' && String(e).trim())
      .map((e) => String(e).trim().toLowerCase());
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        arr = p
          .filter((e): e is string => typeof e === 'string' && !!e.trim())
          .map((e) => e.trim().toLowerCase());
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return arr;
}
