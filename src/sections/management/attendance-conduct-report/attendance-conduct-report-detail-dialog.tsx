import { useState } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate, fTime } from 'src/utils/format-time';
import { openDocumentUrl, getDocumentDisplayUrl } from 'src/utils/document-url';

import { JobDetailsDialog } from 'src/sections/work/calendar/job-details-dialog';

import {
  isAttachmentPdf,
  isAttachmentImage,
  AttachmentPdfPreview,
  AttachmentImagePreview,
} from './attendance-conduct-report-attachment-previews';

// ----------------------------------------------------------------------

const SCORE_DEDUCT_PER_OCCURRENCE: Record<string, number> = {
  noShowUnpaid: 15,
  sentHomeNoPpe: 10,
  leftEarlyNoNotice: 5,
  lateOnSite: 5,
  refusalOfShifts: 10,
  calledInSick: 5,
  unapprovedDaysOffShortNotice: 5,
  unauthorizedDriving: 15,
  drivingInfractions: 10,
  verbalWarningsWriteUp: 5,
};

function formatScoreImpactValue(value: number): string {
  return value === 0 ? '0' : String(value);
}

function formatWriteUpCategoryLabel(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export type ReportDetail = {
  category?: string;
  job_id?: string | null;
  job_number?: string | null;
  report_date_time?: string | null;
  start_time?: string | null;
  created_at?: string | null;
  arrived_at_site_time?: string | null;
  arrived_time?: string | null;
  notified_at?: string | null;
  score?: string | number | null;
  hours?: string | number | null;
  memo?: string | null;
  reason?: string | null;
  write_up_category?: string | null;
  detail?: string | null;
  attachment_urls?: string[] | null;
  created_by_first_name?: string | null;
  created_by_last_name?: string | null;
  created_by_photo_url?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  report: ReportDetail | null;
  title: string;
};

export function AttendanceConductReportDetailDialog({
  open,
  onClose,
  report,
  title,
}: Props) {
  const [jobDetailsDialogOpen, setJobDetailsDialogOpen] = useState(false);
  const [selectedJobIdForDetails, setSelectedJobIdForDetails] = useState<string | null>(null);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {report.category === 'unapprovedDaysOffShortNotice' &&
                report.notified_at != null &&
                report.notified_at !== '' && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" component="div">
                      When they notified:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                      {`${fDate(report.notified_at as string)} at ${fTime(report.notified_at as string)}`}
                    </Typography>
                  </Box>
                )}

              {Boolean(
                report.job_id &&
                  ['sentHomeNoPpe', 'leftEarlyNoNotice', 'lateOnSite', 'unapprovedDaysOffShortNotice'].includes(
                    report.category as string
                  )
              ) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Job:
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => {
                        setSelectedJobIdForDetails(String(report.job_id));
                        setJobDetailsDialogOpen(true);
                      }}
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      #{String(report.job_number ?? report.job_id)}
                    </Link>
                  </Typography>
                </Box>
              )}

              {report.category !== 'unapprovePayoutWithoutDayOff' &&
                report.category !== 'unapprovedDaysOffShortNotice' &&
                Boolean(report.report_date_time || report.start_time || report.created_at) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" component="div">
                      Date & Time:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                      {report.report_date_time
                        ? `${fDate(report.report_date_time as string)} at ${fTime(report.report_date_time as string)}`
                        : report.start_time
                          ? `${fDate(report.start_time as string)} at ${fTime(report.start_time as string)}`
                          : `${fDate(report.created_at as string)} at ${fTime(report.created_at as string)}`}
                    </Typography>
                  </Box>
                )}

              {report.category === 'lateOnSite' &&
                Boolean(report.arrived_at_site_time || report.arrived_time) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" component="div">
                      Arrived Time:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                      {fTime((report.arrived_at_site_time ?? report.arrived_time) as string)}
                    </Typography>
                  </Box>
                )}

              {report.category === 'unapprovePayoutWithoutDayOff' && Boolean(report.report_date_time) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Request date
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                    {fDate(report.report_date_time as string)}{' '}
                    {fTime(report.report_date_time as string)
                      ? `at ${fTime(report.report_date_time as string)}`
                      : ''}
                  </Typography>
                </Box>
              )}

              {report.category === 'verbalWarningsWriteUp' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Category:
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                    {formatWriteUpCategoryLabel(report.write_up_category as string)}
                  </Typography>
                </Box>
              )}

              {![
                'unapprovePayoutWithoutDayOff',
                'sickLeave5',
                'sickLeaveUnpaid',
                'vacationDay10',
                'vacationDayUnpaid',
                'personalDayOffUnpaid',
              ].includes(report.category ?? '') && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Score Impact:
                  </Typography>
                  <Typography variant="body2" color="error.main" component="div" sx={{ mt: 0.25, fontWeight: 600 }}>
                    {formatScoreImpactValue(
                      report.score != null && report.score !== ''
                        ? -Math.abs(Number(report.score))
                        : -Math.abs(SCORE_DEDUCT_PER_OCCURRENCE[report.category as string] ?? 0)
                    )}
                  </Typography>
                </Box>
              )}

              {Boolean(report.created_by_first_name || report.created_by_last_name || report.created_at) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                    Reported by:
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      src={(report.created_by_photo_url as string) ?? undefined}
                      alt={[report.created_by_first_name, report.created_by_last_name].filter(Boolean).join(' ')}
                      sx={{ width: 32, height: 32 }}
                    >
                      {(report.created_by_first_name as string)?.charAt(0)?.toUpperCase() ?? '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {String(
                          [report.created_by_first_name, report.created_by_last_name].filter(Boolean).join(' ')
                        )}
                      </Typography>
                      {report.created_at && (
                        <Typography variant="caption" color="text.secondary">
                          {fDate(report.created_at as string)} {fTime(report.created_at as string)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              )}

              {Boolean(
                report.category === 'unapprovePayoutWithoutDayOff' &&
                  report.hours != null &&
                  report.hours !== ''
              ) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Hours:
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 0.25 }}>
                    {Number(report.hours) % 1 === 0
                      ? String(Math.round(Number(report.hours)))
                      : String(Number(report.hours))}
                  </Typography>
                </Box>
              )}

              {(report.memo || report.detail) ? (
                <Box>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {report.category === 'verbalWarningsWriteUp'
                      ? 'Detail:'
                      : report.category === 'unapprovePayoutWithoutDayOff'
                        ? 'Memo / Notes'
                        : 'Memo / Reason:'}
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ mt: 0.25, whiteSpace: 'pre-wrap' }}>
                    {(report.memo ?? report.detail) as string}
                  </Typography>
                </Box>
              ) : (
                report.category !== 'unapprovePayoutWithoutDayOff' && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {report.category === 'verbalWarningsWriteUp'
                      ? 'No detail provided'
                      : 'No memo or reason provided'}
                  </Typography>
                )
              )}

              {['unauthorizedDriving', 'drivingInfractions', 'verbalWarningsWriteUp'].includes(
                report.category ?? ''
              ) &&
                Array.isArray(report.attachment_urls) &&
                report.attachment_urls.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Attachments:
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                      {report.attachment_urls.map((url: string, i: number) => {
                        const displayUrl = getDocumentDisplayUrl(url);
                        if (isAttachmentPdf(url)) {
                          return (
                            <Box key={i}>
                              <AttachmentPdfPreview url={displayUrl} index={i} />
                            </Box>
                          );
                        }
                        if (isAttachmentImage(url)) {
                          return (
                            <Box key={i}>
                              <AttachmentImagePreview url={displayUrl} index={i} />
                            </Box>
                          );
                        }
                        return (
                          <Box key={i}>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => openDocumentUrl(displayUrl)}
                              sx={{ textTransform: 'none', p: 0, minHeight: 0 }}
                            >
                              Attachment {i + 1} — Open in new tab
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <JobDetailsDialog
        open={jobDetailsDialogOpen}
        onClose={() => {
          setJobDetailsDialogOpen(false);
          setSelectedJobIdForDetails(null);
        }}
        jobId={selectedJobIdForDetails ?? ''}
      />
    </>
  );
}
