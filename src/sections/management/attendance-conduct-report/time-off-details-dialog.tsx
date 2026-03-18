import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate, fTime } from 'src/utils/format-time';

const DATE_FORMAT = 'MMM DD YYYY';

export type TimeOffDetailsRequest = {
  created_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  reason?: string | null;
  confirmed_by_first_name?: string | null;
  confirmed_by_last_name?: string | null;
  confirmed_by_photo_url?: string | null;
  confirmed_at?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  request: TimeOffDetailsRequest | null;
  tabLabel: string;
};

/**
 * Time Off Request Details dialog — same layout as Attendance & Conduct tab
 * (Sick Leave (5) Details, Vacation Day (10) Details, Personal Day Off Details).
 */
export function TimeOffDetailsDialog({ open, onClose, request, tabLabel }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tabLabel ? `${tabLabel} Details` : 'Time Off Details'}</DialogTitle>
      <DialogContent>
        {request && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {(request.created_at || request.start_date) && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Requested time:
                </Typography>
                <Typography variant="body2">
                  {request.created_at
                    ? `${fDate(request.created_at, DATE_FORMAT)} at ${fTime(request.created_at)}`
                    : request.start_date
                      ? fDate(request.start_date, DATE_FORMAT)
                      : '—'}
                </Typography>
              </Box>
            )}
            {request.start_date && request.end_date && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date range:
                </Typography>
                <Typography variant="body2">
                  {`${fDate(request.start_date, DATE_FORMAT)} - ${fDate(request.end_date, DATE_FORMAT)}`}
                </Typography>
              </Box>
            )}
            {request.start_date && request.end_date && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Days:
                </Typography>
                <Typography variant="body2">
                  {dayjs(request.end_date).diff(dayjs(request.start_date), 'day') + 1}
                </Typography>
              </Box>
            )}
            {(request.confirmed_by_first_name ||
              request.confirmed_by_last_name ||
              request.confirmed_at) && (
              <Box>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                  Confirmed by:
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={request.confirmed_by_photo_url ?? undefined}
                    alt={[request.confirmed_by_first_name, request.confirmed_by_last_name]
                      .filter(Boolean)
                      .join(' ')}
                    sx={{ width: 32, height: 32 }}
                  >
                    {(request.confirmed_by_first_name ?? '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {[request.confirmed_by_first_name, request.confirmed_by_last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </Typography>
                    {request.confirmed_at && (
                      <Typography variant="caption" color="text.secondary">
                        {fDate(request.confirmed_at)} {fTime(request.confirmed_at)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
            {request.reason ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Detail:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {request.reason}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No reason provided
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
