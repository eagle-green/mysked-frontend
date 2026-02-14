import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getPositionColor } from 'src/utils/format-role';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  metrics?: {
    tcp_active: number;
    tcp_available: number;
    lct_active: number;
    lct_available: number;
    hwy_active: number;
    hwy_available: number;
    field_supervisor_active: number;
    field_supervisor_available: number;
  };
};

export function JobDispatchNoteSummary({ metrics }: Props) {
  if (!metrics) return null;

  const renderMetricItem = (
    label: string,
    active: number,
    available: number,
    roleKey: 'tcp' | 'lct' | 'hwy' | 'field_supervisor'
  ) => {
    const color = getPositionColor(roleKey);
    
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Label color={color}>{label}</Label>
        <Typography variant="body2" color="text.secondary">
          Active: <strong>{active}</strong> / Available: <strong>{available}</strong>
        </Typography>
      </Stack>
    );
  };

  return (
    <Stack spacing={1}>
      {renderMetricItem('TCP', metrics.tcp_active, metrics.tcp_available, 'tcp')}
      {renderMetricItem('LCT', metrics.lct_active, metrics.lct_available, 'lct')}
      {renderMetricItem('HWY', metrics.hwy_active, metrics.hwy_available, 'hwy')}
      {renderMetricItem('Field Supervisor', metrics.field_supervisor_active, metrics.field_supervisor_available, 'field_supervisor')}
    </Stack>
  );
}
