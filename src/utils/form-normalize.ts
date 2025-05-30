// Converts all null or undefined values in an object to ''
export function normalizeFormValues<T extends Record<string, any>>(data: T): Record<keyof T, any> {
  const result = {} as Record<keyof T, any>;

  for (const key in data) {
    const value = data[key];
    if (key === 'photo_url') {
      result[key] = value ?? null;
    } else {
      result[key] = value ?? '';
    }
  }

  return result;
}
