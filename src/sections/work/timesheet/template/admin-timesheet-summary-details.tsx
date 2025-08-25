import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type TimeSummaryHeaderProps = {
  header: string;
  hours: number;
  details: string;
  break_hours?: number;
};

export function TimeSummaryHeader({ header, hours, details, break_hours }: TimeSummaryHeaderProps) {
  return (
    <Box sx={{ p: 3, bgcolor: 'background.neutral' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            {header}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {details}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {hours || 0}
          </Typography>
          {break_hours !== undefined && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Break: {break_hours} min
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
