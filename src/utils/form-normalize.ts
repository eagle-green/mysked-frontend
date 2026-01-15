// Converts all null or undefined values in an object to ''
// Also converts ISO date strings to YYYY-MM-DD format for DatePicker fields
export function normalizeFormValues<T extends Record<string, any>>(data: T): Record<keyof T, any> {
  const result = {} as Record<keyof T, any>;

  for (const key in data) {
    const value = data[key];
    if (key === 'photo_url') {
      result[key] = value ?? null;
    } else if ((key === 'birth_date' || key === 'hire_date') && value) {
      // Convert ISO date strings (YYYY-MM-DDTHH:mm:ss.sssZ) to YYYY-MM-DD format
      result[key] = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
    } else {
      result[key] = value ?? '';
    }
  }

  return result;
}
