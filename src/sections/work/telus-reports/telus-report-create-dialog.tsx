import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';
import { useQuery } from '@tanstack/react-query';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function TelusReportCreateDialog({ open, onClose, onSuccess }: Props) {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [recipientEmail, setRecipientEmail] = useState('telus@example.com');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch jobs for the selected date range
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs-for-telus-report', startDate?.format('YYYY-MM-DD'), endDate?.format('YYYY-MM-DD')],
    queryFn: async () => {
      if (!startDate || !endDate) return { jobs: [] };

      const params = new URLSearchParams({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        page: '1',
        rowsPerPage: '1000',
        client_type: 'telus', // Only TELUS jobs
      });

      const response = await fetcher(`${endpoints.work.job}?${params.toString()}&is_open_job=false`);
      return response.data;
    },
    enabled: open && !!startDate && !!endDate,
  });

  const handleReportTypeChange = useCallback((type: 'daily' | 'weekly') => {
    setReportType(type);
    
    if (type === 'daily') {
      const today = dayjs();
      setStartDate(today);
      setEndDate(today);
    } else {
      // Set to current week (Monday to Sunday)
      const today = dayjs();
      const monday = today.startOf('week').add(1, 'day'); // Start from Monday
      const sunday = monday.add(6, 'day'); // End on Sunday
      setStartDate(monday);
      setEndDate(sunday);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    if (!jobsData?.jobs || jobsData.jobs.length === 0) {
      toast.error('No jobs found for the selected date range');
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading('Creating TELUS report...');

    try {
      const jobIds = jobsData.jobs.map((job: any) => job.id);

      await fetcher([
        endpoints.work.telusReports.create,
        {
          method: 'POST',
          data: {
            report_type: reportType,
            report_start_date: startDate.format('YYYY-MM-DD'),
            report_end_date: endDate.format('YYYY-MM-DD'),
            job_ids: jobIds,
            recipient_email: recipientEmail,
          },
        },
      ]);

      toast.dismiss(toastId);
      toast.success('TELUS report created successfully!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Create report error:', error);
      toast.error(error?.error || 'Failed to create TELUS report');
    } finally {
      setIsCreating(false);
    }
  }, [startDate, endDate, reportType, recipientEmail, jobsData, onSuccess]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      setReportType('daily');
      setStartDate(dayjs());
      setEndDate(dayjs());
      setRecipientEmail('telus@example.com');
      onClose();
    }
  }, [isCreating, onClose]);

  const jobCount = jobsData?.jobs?.length || 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create TELUS Report</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              label="Report Type"
              onChange={(e) => handleReportTypeChange(e.target.value as 'daily' | 'weekly')}
              disabled={isCreating}
            >
              <MenuItem value="daily">Daily Report</MenuItem>
              <MenuItem value="weekly">Weekly Report</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => {
                setStartDate(newValue);
                if (reportType === 'daily') {
                  setEndDate(newValue);
                }
              }}
              disabled={isCreating}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              disabled={isCreating || reportType === 'daily'}
              minDate={startDate || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Stack>

          <TextField
            fullWidth
            label="Recipient Email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={isCreating}
            type="email"
            helperText="TELUS email address to send the report to"
          />

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Report Summary
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Period: {startDate?.format('MMM D, YYYY')} - {endDate?.format('MMM D, YYYY')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jobs Found: {isLoadingJobs ? (
                  <CircularProgress size={12} sx={{ ml: 1 }} />
                ) : (
                  <strong>{jobCount}</strong>
                )}
              </Typography>
            </Stack>
          </Box>

          {jobCount === 0 && !isLoadingJobs && (
            <Typography variant="body2" color="warning.main">
              No jobs found for the selected date range. Please select a different date range.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={isCreating || jobCount === 0 || isLoadingJobs}
          startIcon={isCreating ? <CircularProgress size={20} /> : null}
        >
          {isCreating ? 'Creating...' : 'Create Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
