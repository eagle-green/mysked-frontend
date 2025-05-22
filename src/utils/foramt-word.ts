export const capitalizeWords = (str: string | null | undefined): string | null | undefined => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
};
