import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { getPositionColor } from 'src/utils/format-role';
import { fDate, fTime, fDateTime, formatPatterns } from 'src/utils/format-time';

import { provinceList } from 'src/assets/data/assets';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

/** Touch-friendly primary action (this list is only shown on small screens). */
const mobileViewSx = { minHeight: 48, py: 1.25, fontSize: '0.95rem', fontWeight: 600 } as const;

/** TableNoData is for <Table> rows; on mobile we need block layout so empty state spans full card width. */
function MobileDeductNoData() {
  return (
    <Box sx={{ width: '100%', minWidth: 0, alignSelf: 'stretch', px: 2 }}>
      <EmptyContent filled sx={{ py: 6, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }} />
    </Box>
  );
}

/** Same layout as the deduction table "Reported by" column. */
function ReportedByBlock({
  firstName,
  lastName,
  photoUrl,
  dateTime,
}: {
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  dateTime?: string | null;
}) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!name && !dateTime) return null;
  return (
    <ListItemText
      primary={
        name ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={photoUrl ?? undefined} alt={name} sx={{ width: 32, height: 32 }}>
              {firstName?.charAt(0)?.toUpperCase() ?? '?'}
            </Avatar>
            <Typography variant="body2" noWrap>
              {name}
            </Typography>
          </Stack>
        ) : null
      }
      secondary={
        dateTime && dayjs(dateTime).isValid()
          ? fDateTime(dateTime, formatPatterns.recordedByDateTime)
          : undefined
      }
      slotProps={{
        primary: { sx: { typography: 'body2' } },
        secondary: { sx: { mt: 0.5, typography: 'caption' } },
      }}
    />
  );
}

const NO_SHOW_DATE = 'MMM DD YYYY';

function getAddressFromJob(job: any): string {
  if (job?.site_display_address?.trim()) return job.site_display_address.trim();
  let addr = [
    job?.site_unit_number,
    job?.site_street_number,
    job?.site_street_name,
    job?.site_city,
    job?.site_province,
    job?.site_postal_code,
    job?.site_country,
  ]
    .filter(Boolean)
    .join(', ')
    .trim();
  if (addr && provinceList?.length) {
    provinceList.forEach(({ value, code }: { value: string; code: string }) => {
      addr = addr.replace(value, code);
    });
  }
  return addr || '';
}

export type DeductHistoryMobileListProps = {
  isMdUp: boolean;
  /** Current deduction tab */
  categoryTab: string;
  /** Paginated rows for the active table */
  deductPagedRows: any[];
  /** All rows in tab (for empty) */
  deductCurrentRows: any[];
  /** Conduct score breakdown object (for fallback / summary) */
  data: Record<string, any>;
  categoriesToShow: { value: string; label: string; key: string }[];
  isLoadingConduct: boolean;
  isLoadingNoShow: boolean;
  isLoadingReports: boolean;
  isLoadingRejected: boolean;
  isLoadingCalledInSick: boolean;
  onDeductView: (row: any) => void;
  onOpenJob: (jobId: string) => void;
  formatWriteUpCategoryLabel: (v: string | null | undefined) => string;
  formatScoreImpactValue: (v: number) => string;
  getScoreImpactDisplay: (categoryKey: string, incidentDate: string | Date | null | undefined) => string;
  showAdminActions: boolean;
  onReportMenuOpen: (el: HTMLElement, id: string) => void;
};

/**
 * Stacked job-style row card (No Show, Sent home, Left early, Refusals, Called sick, Unapproved time off).
 */
function mobileJobGroupCard(
  job: any,
  params: {
    categoryTab: string;
    hasJob: (j: any) => boolean;
    isNoShow: boolean;
    isRefusal: boolean;
    isCalledInSick: boolean;
    isUnapprovedDaysOff: boolean;
    onOpenJob: (jobId: string) => void;
    onDeductView: (row: any) => void;
    formatScoreImpactValue: (v: number) => string;
    getScoreImpactDisplay: (k: string, d: string | Date | null | undefined) => string;
    /** When false (e.g. worker profile), job # is plain text — no link to job details. */
    allowJobNumberLinks: boolean;
  }
) {
  const {
    categoryTab,
    hasJob,
    isNoShow,
    isRefusal,
    isCalledInSick,
    isUnapprovedDaysOff,
    onOpenJob,
    onDeductView,
    formatScoreImpactValue,
    getScoreImpactDisplay,
    allowJobNumberLinks,
  } = params;
  const jobLinked = hasJob(job);
  const positionLabel =
    job.position != null && job.position !== ''
      ? (JOB_POSITION_OPTIONS.find((opt) => opt.value === job.position)?.label || job.position)
      : 'N/A';

  let scoreText: string;
  if (isNoShow || isRefusal || isCalledInSick) {
    if (job.conduct_score_impact != null && job.conduct_score_impact !== '') {
      const v = Number(job.conduct_score_impact);
      if (!Number.isNaN(v)) {
        const neg = v <= 0 ? v : -Math.abs(v);
        scoreText = formatScoreImpactValue(neg);
      } else {
        scoreText = isNoShow ? getScoreImpactDisplay('noShowUnpaid', job.start_time) : isRefusal ? '—' : '—';
      }
    } else {
      scoreText = isNoShow ? getScoreImpactDisplay('noShowUnpaid', job.start_time) : isRefusal ? '—' : '—';
    }
  } else if (isUnapprovedDaysOff) {
    if (job.score != null && job.score !== '' && !Number.isNaN(Number(job.score)))
      scoreText = formatScoreImpactValue(-Math.abs(Number(job.score)));
    else scoreText = getScoreImpactDisplay('unapprovedDaysOffShortNotice', job.start_time);
  } else {
    if (job.score != null && job.score !== '' && !Number.isNaN(Number(job.score)))
      scoreText = formatScoreImpactValue(-Math.abs(Number(job.score)));
    else {
      const sk =
        categoryTab === 'sentHomeNoPpe'
          ? 'sentHomeNoPpe'
          : categoryTab === 'leftEarlyNoNotice'
            ? 'leftEarlyNoNotice'
            : 'unapprovedDaysOffShortNotice';
      scoreText = getScoreImpactDisplay(sk, job.start_time);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
            {jobLinked && job.job_number && allowJobNumberLinks ? (
              <Link
                component="button"
                variant="subtitle2"
                onClick={() => onOpenJob(String(job.job_id))}
                sx={{ fontWeight: 700, color: 'primary.main' }}
              >
                #{job.job_number}
              </Link>
            ) : job.job_number != null && job.job_number !== '' ? (
              <Typography variant="subtitle2" color={allowJobNumberLinks ? 'text.secondary' : 'text.primary'} sx={{ fontWeight: 700 }}>
                #{job.job_number}
              </Typography>
            ) : (
              <Typography variant="subtitle2" color="text.secondary">
                —
              </Typography>
            )}
            <Label variant="soft" color={getPositionColor(job.position)} sx={{ flexShrink: 0 }}>
              {positionLabel}
            </Label>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {fDate(job.start_time, NO_SHOW_DATE)}
            {(job.worker_start_time != null || job.worker_end_time != null) && (
              <Box component="span" sx={{ display: 'block', mt: 0.25, typography: 'caption' }}>
                {[job.worker_start_time, job.worker_end_time]
                  .filter(Boolean)
                  .map((t) => fTime(t))
                  .join(' - ')}
              </Box>
            )}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Score
          </Typography>
          <Typography variant="body2" color="error.main" fontWeight={700}>
            {scoreText}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Avatar
          src={
            (job.company?.logo_url || job.company_logo_url || job.logo_url || '').trim()
              ? (job.company?.logo_url || job.company_logo_url || job.logo_url).trim()
              : undefined
          }
          alt={job.company_name || job.company?.name}
          sx={{ width: 36, height: 36 }}
        >
          {(job.company_name || job.company?.name || '?').charAt(0).toUpperCase()}
        </Avatar>
        <Box minWidth={0} flex={1}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {job.company_name || job.company?.name || '—'}
          </Typography>
          {job.site_name && (
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {job.site_name}
            </Typography>
          )}
          {getAddressFromJob(job) ? (
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }} display="block" mt={0.25}>
              {getAddressFromJob(job)}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ borderTop: (t) => `1px solid ${t.palette.divider}`, pt: 1.5, mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          Reported by
        </Typography>
        <ReportedByBlock
          firstName={job.created_by_first_name ?? job.incident_reporter_first_name}
          lastName={job.created_by_last_name ?? job.incident_reporter_last_name}
          photoUrl={job.created_by_photo_url ?? job.incident_reporter_photo_url}
          dateTime={job.created_at ?? job.incident_reported_at}
        />
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={() => onDeductView(job)}
        sx={{ mt: 0.5, ...mobileViewSx }}
      >
        View
      </Button>
    </Card>
  );
}

export function DeductHistoryMobileList(p: DeductHistoryMobileListProps) {
  const {
    isMdUp,
    categoryTab,
    deductPagedRows,
    deductCurrentRows,
    data,
    categoriesToShow,
    isLoadingConduct,
    isLoadingNoShow,
    isLoadingReports,
    isLoadingRejected,
    isLoadingCalledInSick,
    onDeductView,
    onOpenJob,
    formatWriteUpCategoryLabel,
    formatScoreImpactValue,
    getScoreImpactDisplay,
    showAdminActions,
    onReportMenuOpen,
  } = p;

  if (isMdUp) {
    return null;
  }

  const hasJob = (j: any) => j.job_id != null && String(j.job_id).trim() !== '';
  const isUnapprovedDaysOff = categoryTab === 'unapprovedDaysOffShortNotice';

  const isJobGroup =
    categoryTab === 'noShowUnpaid' ||
    categoryTab === 'sentHomeNoPpe' ||
    categoryTab === 'leftEarlyNoNotice' ||
    categoryTab === 'calledInSick' ||
    categoryTab === 'refusalOfShifts' ||
    categoryTab === 'unapprovedDaysOffShortNotice';

  if (isJobGroup) {
    const isNoShow = categoryTab === 'noShowUnpaid';
    const isRefusal = categoryTab === 'refusalOfShifts';
    const isCalledInSick = categoryTab === 'calledInSick';
    const isLoadingJobs = isNoShow
      ? isLoadingNoShow || isLoadingReports
      : isRefusal
        ? isLoadingRejected
        : isCalledInSick
          ? isLoadingCalledInSick
          : false;
    if (isLoadingJobs) {
      return (
        <Box sx={{ width: '100%', minWidth: 0, px: 2, py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        </Box>
      );
    }
    if (deductCurrentRows.length === 0) {
      return <MobileDeductNoData />;
    }
    return (
      <Stack spacing={2} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
        {deductPagedRows.map((job: any, index: number) => (
          <Box key={String(job.id ?? job.job_worker_id ?? job.job_id ?? `row-${index}`)} sx={{ width: '100%', minWidth: 0 }}>
            {mobileJobGroupCard(job, {
              categoryTab,
              hasJob,
              isNoShow,
              isRefusal,
              isCalledInSick,
              isUnapprovedDaysOff,
              onOpenJob,
              onDeductView,
              formatScoreImpactValue,
              getScoreImpactDisplay,
              allowJobNumberLinks: showAdminActions,
            })}
          </Box>
        ))}
      </Stack>
    );
  }

  if (categoryTab === 'lateOnSite') {
    if (deductCurrentRows.length === 0) {
      return <MobileDeductNoData />;
    }
    return (
      <Stack spacing={2} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
        {deductPagedRows.map((job: any, index: number) => {
          const positionLabel =
            job.position != null && job.position !== ''
              ? (JOB_POSITION_OPTIONS.find((opt) => opt.value === job.position)?.label || job.position)
              : 'N/A';
          const st =
            job.score != null && job.score !== '' && !Number.isNaN(Number(job.score))
              ? formatScoreImpactValue(-Math.abs(Number(job.score)))
              : getScoreImpactDisplay('lateOnSite', job.start_time);
          return (
            <Card key={job.id ?? job.job_worker_id ?? `${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%', minWidth: 0 }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  {job.job_id && showAdminActions ? (
                    <Link
                      component="button"
                      variant="subtitle2"
                      onClick={() => onOpenJob(String(job.job_id))}
                      sx={{ fontWeight: 700, color: 'primary.main' }}
                    >
                      #{job.job_number}
                    </Link>
                  ) : (
                    <Typography variant="subtitle2" fontWeight={700}>
                      #{job.job_number}
                    </Typography>
                  )}
                  <Typography color="error.main" fontWeight={600}>
                    {st}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {fDate(job.start_time, NO_SHOW_DATE)}
                </Typography>
                <Label color={getPositionColor(job.position)}>{positionLabel}</Label>
                <Button variant="contained" size="large" fullWidth onClick={() => onDeductView(job)} sx={mobileViewSx}>
                  View
                </Button>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    );
  }

  if (
    categoryTab === 'vacationDayUnpaid' ||
    categoryTab === 'sickLeaveUnpaid' ||
    categoryTab === 'personalDayOffUnpaid' ||
    categoryTab === 'vacationDay10' ||
    categoryTab === 'sickLeave5'
  ) {
    if (deductCurrentRows.length === 0) {
      return <MobileDeductNoData />;
    }
    return (
      <Stack spacing={2} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
        {deductPagedRows.map((row: any, index: number) => (
          <Card key={row.id ?? index} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary">
                Requested:{' '}
                {row.requested_time != null
                  ? `${fDate(row.requested_time, NO_SHOW_DATE)}${row.requested_time_has_time ? ` ${fTime(row.requested_time)}` : ''}`
                  : '—'}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {row.date_range ??
                  (row.start_date && row.end_date
                    ? `${fDate(row.start_date, NO_SHOW_DATE)} – ${fDate(row.end_date, NO_SHOW_DATE)}`
                    : '—')}
              </Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Days
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.days != null
                    ? row.days
                    : row.start_date && row.end_date
                      ? dayjs(row.end_date).diff(dayjs(row.start_date), 'day') + 1
                      : '—'}
                </Typography>
              </Stack>
              <Button variant="contained" size="large" fullWidth onClick={() => onDeductView(row)} sx={mobileViewSx}>
                View
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (categoryTab === 'unauthorizedDriving' || categoryTab === 'drivingInfractions') {
    if (deductCurrentRows.length === 0) {
      return <MobileDeductNoData />;
    }
    return (
      <Stack spacing={2} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
        {deductPagedRows.map((row: any, index: number) => (
          <Card key={row.id ?? index} variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%', minWidth: 0 }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {row.date != null ? fDate(row.date, NO_SHOW_DATE) : '—'}
                </Typography>
                <Typography variant="h6" color="error.main" mt={0.5}>
                  {getScoreImpactDisplay(categoryTab, row.date)}
                </Typography>
              </Box>
              {showAdminActions && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => onReportMenuOpen(e.currentTarget, String(row.report_id ?? row.id))}
                    aria-label="Row actions"
                  >
                    <Iconify icon="eva:more-vertical-fill" />
                  </IconButton>
                </Box>
              )}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => onDeductView(row)}
                sx={mobileViewSx}
              >
                View
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (categoryTab === 'unapprovePayoutWithoutDayOff') {
    if (deductCurrentRows.length === 0) {
      return <MobileDeductNoData />;
    }
    return (
      <Stack spacing={2} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
        {deductPagedRows.map((row: any, index: number) => (
          <Card key={row.id ?? index} variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%', minWidth: 0 }}>
            <Stack spacing={1}>
              <Typography variant="body2">
                Requested: {row.requested_date != null ? fDate(row.requested_date, NO_SHOW_DATE) : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hours:{' '}
                {row.hours != null && row.hours !== ''
                  ? (Number(row.hours) % 1 === 0 ? String(Math.round(Number(row.hours))) : String(row.hours))
                  : '—'}
              </Typography>
              <Button size="large" fullWidth variant="contained" onClick={() => onDeductView(row)} sx={mobileViewSx}>
                View
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (categoryTab === 'verbalWarningsWriteUp') {
    if (deductCurrentRows.length === 0) {
      return <MobileDeductNoData />;
    }
    return (
      <Stack spacing={2} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
        {deductPagedRows.map((row: any, index: number) => (
          <Card key={row.id ?? index} variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%', minWidth: 0 }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {row.date != null ? fDate(row.date, NO_SHOW_DATE) : '—'}
                </Typography>
                <Typography color="error.main" fontWeight={600}>
                  {getScoreImpactDisplay('verbalWarningsWriteUp', row.date)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatWriteUpCategoryLabel(row.category)}
              </Typography>
              <Button size="large" fullWidth variant="contained" onClick={() => onDeductView(row)} sx={mobileViewSx}>
                View
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (isLoadingConduct) {
    return (
      <Box sx={{ width: '100%', minWidth: 0, px: 2, py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    );
  }
  return (
    <Stack spacing={1.5} sx={{ p: 2, pt: 0, width: '100%', minWidth: 0 }}>
      {categoriesToShow.map((cat) => {
        const count = (data as Record<string, number>)[cat.key] ?? 0;
        return (
          <Card key={cat.value} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="body2" fontWeight={500}>
                {cat.label}
              </Typography>
              {count > 0 ? <Typography fontWeight={700}>{count}</Typography> : <Typography color="text.disabled">—</Typography>}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
