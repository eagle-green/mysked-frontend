import type { ScheduleConflict } from 'src/utils/schedule-conflict';

import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { formatConflictTime, generateConflictMessages } from 'src/utils/schedule-conflict';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface ScheduleConflictDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: (acknowledgeWarnings: boolean) => void;
  workerName: string;
  workerPhotoUrl?: string;
  conflicts: ScheduleConflict[];
  newJobStartTime: dayjs.Dayjs | Date | string;
  newJobEndTime: dayjs.Dayjs | Date | string;
  newJobSiteName?: string;
  newJobClientName?: string;
}

// ----------------------------------------------------------------------

export function ScheduleConflictDialog({
  open,
  onClose,
  onProceed,
  workerName,
  workerPhotoUrl,
  conflicts,
  newJobStartTime,
  newJobEndTime,
  newJobSiteName,
  newJobClientName,
}: ScheduleConflictDialogProps) {
  const newJobStart = dayjs(newJobStartTime);
  const newJobEnd = dayjs(newJobEndTime);

  const handleClose = () => {
    onClose();
  };

  const handleProceed = () => {
    onProceed(true);
    handleClose();
  };

  const renderConflictCard = (conflict: ScheduleConflict, index: number) => {
    const messages = generateConflictMessages(conflict);
    const isDirectOverlap = conflict.conflict_type === 'direct_overlap';
    const isGapViolation = conflict.conflict_type === 'insufficient_gap';

    return (
      <Box
        key={`${conflict.job_id}-${index}`}
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: isDirectOverlap ? 'error.main' : 'warning.main',
          borderRadius: 1,
          bgcolor: isDirectOverlap ? 'error.lighter' : 'warning.lighter',
        }}
      >
        <Stack spacing={1}>
          {/* Conflict header */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon={isDirectOverlap ? 'solar:danger-bold' : 'solar:info-circle-bold'}
              sx={{ 
                color: isDirectOverlap ? 'error.main' : 'warning.main',
                width: 20,
                height: 20,
              }}
            />
            <Chip
              label={isDirectOverlap ? 'Direct Overlap' : '8-Hour Gap Violation'}
              color={isDirectOverlap ? 'error' : 'warning'}
              size="small"
              variant="filled"
            />
          </Stack>

          {/* Conflict messages */}
          {messages.map((message, msgIndex) => (
            <Box key={msgIndex} sx={{ pl: 3 }}>
              {msgIndex === 0 ? (
                // First message (job details) with status chip inline
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Typography
                    variant="body2"
                    color={isDirectOverlap ? 'error.dark' : 'warning.dark'}
                  >
                    {message}
                  </Typography>
                  <Chip
                    label={conflict.status}
                    size="small"  
                    color={
                      conflict.status === 'draft' ? 'info' :
                      conflict.status === 'pending' ? 'warning' :
                      conflict.status === 'approved' ? 'success' :
                      conflict.status === 'accepted' ? 'success' :
                      'default'
                    }
                    sx={{ 
                      textTransform: 'capitalize',
                      ml: 1
                    }}
                  />
                </Stack>
              ) : (
                // Other messages (time info, warnings, etc.)
                <Typography
                  variant="body2"
                  color={isDirectOverlap ? 'error.dark' : 'warning.dark'}
                >
                  {message}
                </Typography>
              )}
            </Box>
          ))}

          {/* Gap hours info for gap violations */}
          {isGapViolation && (
            <Box sx={{ pl: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Current gap: {conflict.gap_hours} hours (8 hours required)
              </Typography>
            </Box>
          )}

          {/* Resolution suggestion for resolvable gap violations */}
          {isGapViolation && conflict.can_assign_with_actual_end_time && conflict.required_actual_end_time && (
            <Alert 
              severity="info" 
              sx={{ mt: 1 }}
              icon={<Iconify icon="solar:info-circle-bold" />}
            >
              <Typography variant="body2">
                <strong>Possible Resolution:</strong> Worker could finish their previous job by{' '}
                <strong>{formatConflictTime(conflict.required_actual_end_time)}</strong> to maintain the 8-hour gap.
              </Typography>
            </Alert>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify 
            icon="solar:clock-circle-bold" 
            sx={{ color: 'warning.main', width: 24, height: 24 }} 
          />
          <Box>
            <Typography variant="h6">8-Hour Gap Warning</Typography>
            <Typography variant="body2" color="text.secondary">
              Gap violation detected for {workerName}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Worker info */}
          <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={workerPhotoUrl} alt={workerName} sx={{ width: 48, height: 48 }}>
                {workerName?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {workerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  New Assignment: {formatConflictTime(newJobStart, true)} - {(() => {
                    // If end time is on a different day, show the date
                    if (newJobStart.format('YYYY-MM-DD') !== newJobEnd.format('YYYY-MM-DD')) {
                      return formatConflictTime(newJobEnd, true);
                    }
                    return formatConflictTime(newJobEnd, false);
                  })()}
                </Typography>
                {(newJobSiteName || newJobClientName) && (
                  <Typography variant="caption" color="text.secondary">
                    {newJobSiteName && `Site: ${newJobSiteName}`}
                    {newJobSiteName && newJobClientName && ' • '}
                    {newJobClientName && `Client: ${newJobClientName}`}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>



          {/* Show the specific conflict */}
          {conflicts.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                <Iconify icon="solar:info-circle-bold" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Gap Violation Details
              </Typography>
              <Stack spacing={2}>
                {conflicts.map((conflict, index) => renderConflictCard(conflict, index))}
              </Stack>
            </Box>
          )}


        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        
        <Button
          onClick={handleProceed}
          variant="contained"
          color="warning"
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Proceed
        </Button>
      </DialogActions>
    </Dialog>
  );
}
