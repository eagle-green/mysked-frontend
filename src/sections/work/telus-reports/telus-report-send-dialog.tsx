import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  report: any;
};

export function TelusReportSendDialog({ open, onClose, report }: Props) {
  const [emailSubject, setEmailSubject] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEmailLocked, setIsEmailLocked] = useState(true);
  const queryClient = useQueryClient();

  // Fetch TELUS email from backend
  const { data: telusEmailData } = useQuery({
    queryKey: ['telus-email'],
    queryFn: async () => {
      const response = await fetcher(endpoints.work.telusReports.getEmail);
      return response;
    },
    enabled: open,
  });

  const telusEmail = telusEmailData?.email || '';

  const handleClose = useCallback(() => {
    if (!isSending) {
      setEmailSubject('');
      setRecipientEmail(report?.recipient_email || '');
      setIsEmailLocked(true);
      onClose();
    }
  }, [isSending, onClose, report]);

  const handleSend = useCallback(async () => {
    const emailToSend = isEmailLocked ? (report?.recipient_email || telusEmail || '') : recipientEmail;
    
    if (!emailToSend) {
      toast.error('Please enter a recipient email address');
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('Sending TELUS report...');

    try {
      await fetcher([
        endpoints.work.telusReports.sendEmail(report.id),
        {
          method: 'POST',
          data: {
            email_subject: emailSubject || undefined,
            recipient_email: emailToSend,
          },
        },
      ]);

      toast.dismiss(toastId);
      toast.success('TELUS report sent successfully!');
      
      queryClient.invalidateQueries({ queryKey: ['telus-reports'] });
      handleClose();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Send error:', error);
      toast.error(error?.error || 'Failed to send TELUS report');
    } finally {
      setIsSending(false);
    }
  }, [report, emailSubject, recipientEmail, isEmailLocked, telusEmail, queryClient, handleClose]);

  // Set default values when dialog opens
  useEffect(() => {
    if (open && report) {
      setRecipientEmail(report.recipient_email || telusEmail || '');
      setIsEmailLocked(true);
      // Format date range based on report type
      const startDateFormatted = dayjs(report.report_start_date).format('MMM D, YYYY');
      const endDateFormatted = dayjs(report.report_end_date).format('MMM D, YYYY');
      const defaultSubject = report.report_type === 'daily'
        ? `TELUS Daily Report - ${startDateFormatted}`
        : `TELUS Weekly Report - ${startDateFormatted} - ${endDateFormatted}`;
      setEmailSubject(defaultSubject);
    }
  }, [open, report, telusEmail]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send TELUS Report</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Report Details
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Type: <strong>{report?.report_type === 'daily' ? 'Daily' : 'Weekly'}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Period: <strong>
                  {dayjs(report?.report_start_date).format('MMM D, YYYY')} -{' '}
                  {dayjs(report?.report_end_date).format('MMM D, YYYY')}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs: <strong>{report?.job_count}</strong>
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Recipient Email
            </Typography>
            {isEmailLocked ? (
              <Box
                sx={{
                  p: 1.5,
                  pr: 0.5,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {report?.recipient_email || telusEmail || 'Not configured (will use default)'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsEmailLocked(false);
                    setRecipientEmail(report?.recipient_email || telusEmail || '');
                  }}
                  disabled={isSending}
                  sx={{ ml: 1 }}
                >
                  <Iconify
                    icon={'solar:lock-bold' as any}
                    width={20}
                  />
                </IconButton>
              </Box>
            ) : (
              <TextField
                fullWidth
                label="Recipient Email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isSending}
                type="email"
                required
                placeholder={report?.recipient_email || telusEmail || 'Enter email address'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setIsEmailLocked(true);
                            setRecipientEmail('');
                          }}
                          disabled={isSending}
                          edge="end"
                        >
                          <Iconify
                            icon={'solar:unlock-bold' as any}
                            width={20}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          </Box>

          <TextField
            fullWidth
            label="Email Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            disabled={isSending}
            placeholder={
              report?.report_type === 'daily'
                ? `TELUS Daily Report - ${dayjs(report?.report_start_date).format('MMM D, YYYY')}`
                : `TELUS Weekly Report - ${dayjs(report?.report_start_date).format('MMM D, YYYY')} - ${dayjs(report?.report_end_date).format('MMM D, YYYY')}`
            }
          />

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'warning.lighter',
              border: (theme) => `1px solid ${theme.palette.warning.light}`,
            }}
          >
            <Typography variant="body2" color="warning.darker">
              <strong>Important:</strong> This will send the TELUS report via email with the exported data attached. Make sure all information is correct before sending.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={isSending || (!isEmailLocked && !recipientEmail) || (isEmailLocked && !report?.recipient_email && !telusEmail)}
          startIcon={isSending ? <CircularProgress size={20} /> : null}
        >
          {isSending ? 'Sending...' : 'Send Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
