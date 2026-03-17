/**
 * Conduct score display: 100–90 success, 89–70 warning, 69–0 error.
 */
export function getConductScoreColor(
  score: number
): 'success' | 'warning' | 'error' {
  const s = Number(score);
  if (s >= 90) return 'success';
  if (s >= 70) return 'warning';
  return 'error';
}
