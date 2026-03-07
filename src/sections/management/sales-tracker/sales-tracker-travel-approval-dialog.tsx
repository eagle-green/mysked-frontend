import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type TravelApprovalContext = {
  entryId: string;
  workerAddress: string;
  jobSiteAddress: string;
  submittedTravelMinutes: number;
  approvedTravelMinutes: number | null;
  approvalNote: string | null;
  approvedAt: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  entryId: string | null;
  onSuccess?: () => void;
};

function minutesToHoursMinutes(min: number): { hours: number; minutes: number } {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return { hours, minutes };
}

function hoursMinutesToMinutes(h: number, m: number): number {
  return Math.round(h * 60 + m);
}

export function SalesTrackerTravelApprovalDialog({
  open,
  onClose,
  entryId,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [approvedHours, setApprovedHours] = useState<number>(0);
  const [approvedMinutes, setApprovedMinutes] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const { data: context, isLoading } = useQuery({
    queryKey: ['travel-approval-context', entryId],
    queryFn: async () => {
      if (!entryId) return null;
      const res = await fetcher(endpoints.timesheet.travelApprovalContext(entryId));
      return res as TravelApprovalContext;
    },
    enabled: open && !!entryId,
    staleTime: 0,
  });

  useEffect(() => {
    if (context) {
      const approved = context.approvedTravelMinutes ?? context.submittedTravelMinutes;
      const { hours, minutes } = minutesToHoursMinutes(approved);
      setApprovedHours(hours);
      setApprovedMinutes(minutes);
      setNote(context.approvalNote ?? '');
    }
  }, [context]);

  const approveMutation = useMutation({
    mutationFn: async (payload: { approved_minutes: number; note?: string }) => {
      if (!entryId) throw new Error('No entry');
      await fetcher([
        endpoints.timesheet.approveTravelTime(entryId),
        { method: 'patch', data: payload },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-tracker'] });
      queryClient.invalidateQueries({ queryKey: ['travel-approval-context', entryId] });
      toast.success('Travel time approved');
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve travel time');
    },
  });

  const handleApprove = () => {
    const approvedMinutesTotal = hoursMinutesToMinutes(approvedHours, approvedMinutes);
    if (approvedMinutesTotal < 0) {
      toast.error('Approved time cannot be negative');
      return;
    }
    approveMutation.mutate({
      approved_minutes: approvedMinutesTotal,
      note: note.trim() || undefined,
    });
  };

  const submittedDisplay = context
    ? `${minutesToHoursMinutes(context.submittedTravelMinutes).hours}h ${minutesToHoursMinutes(context.submittedTravelMinutes).minutes}m`
    : '—';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Approve Travel Time</DialogTitle>
      <DialogContent>
        {isLoading || !context ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Employee address
              </Typography>
              <Typography variant="body2">{context.workerAddress}</Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Job site address
              </Typography>
              <Typography variant="body2">{context.jobSiteAddress}</Typography>
            </Card>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Travel time submitted by worker
              </Typography>
              <Typography variant="body1">{submittedDisplay}</Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Approved hrs"
                type="number"
                size="small"
                value={approvedHours}
                onChange={(e) =>
                  setApprovedHours(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                inputProps={{ min: 0, step: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                }}
                sx={{ width: 120 }}
              />
              <TextField
                label="Approved min"
                type="number"
                size="small"
                value={approvedMinutes}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  setApprovedMinutes(Math.min(59, Math.max(0, v)));
                }}
                inputProps={{ min: 0, max: 59, step: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
                sx={{ width: 120 }}
              />
            </Stack>
            <TextField
              label="Note (optional)"
              placeholder="e.g. reason for adjustment"
              multiline
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleApprove}
          disabled={isLoading || !context || approveMutation.isPending}
        >
          {approveMutation.isPending ? 'Saving…' : 'Approve travel time'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
