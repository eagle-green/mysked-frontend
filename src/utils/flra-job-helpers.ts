import type { IJobWorker } from 'src/types/job';

/**
 * Worker statuses that should not count toward LCT vs TCP / FLRA position mix.
 * Aligns with effective on-site roles (same idea as job workers API used for timesheet FLRA check,
 * which omits called_in_sick / no_show / rejected assignments).
 */
const EXCLUDE_FROM_FLRA_POSITION_MIX = new Set([
  'called_in_sick',
  'no_show',
  'rejected',
  'cancelled',
]);

/** Returns workers whose assignment still counts for FLRA LCT/TCP determination. */
export function filterWorkersForFlraPositionMix(workers: IJobWorker[] | undefined | null): IJobWorker[] {
  if (!workers?.length) return [];
  return workers.filter((w) => {
    const s = (w.status || '').toLowerCase();
    return !EXCLUDE_FROM_FLRA_POSITION_MIX.has(s);
  });
}
