import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import dayjs from 'dayjs';
import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';

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
  const queryClient = useQueryClient();

  const handleSend = useCallback(async () => {
    if (!recipientEmail) {
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
            recipient_email: recipientEmail,
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
  }, [report, emailSubject, recipientEmail, queryClient]);

  const handleClose = useCallback(() => {
    if (!isSending) {
      setEmailSubject('');
      setRecipientEmail(report?.recipient_email || '');
      onClose();
    }
  }, [isSending, onClose, report]);

  // Set default values when dialog opens
  useEffect(() => {
    if (open && report) {
      setRecipientEmail(report.recipient_email || 'telus@example.com');
      // Format date range based on report type
      const startDateFormatted = dayjs(report.report_start_date).format('MMM D, YYYY');
      const endDateFormatted = dayjs(report.report_end_date).format('MMM D, YYYY');
      const defaultSubject = report.report_type === 'daily'
        ? `TELUS Daily Report - ${startDateFormatted}`
        : `TELUS Weekly Report - ${startDateFormatted} - ${endDateFormatted}`;
      setEmailSubject(defaultSubject);
    }
  }, [open, report]);

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

          <TextField
            fullWidth
            label="Recipient Email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={isSending}
            type="email"
            required
          />

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
          disabled={isSending || !recipientEmail}
          startIcon={isSending ? <CircularProgress size={20} /> : null}
        >
          {isSending ? 'Sending...' : 'Send Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
