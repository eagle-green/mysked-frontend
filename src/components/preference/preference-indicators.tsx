import type { IPreferenceCircleProps } from 'src/types/preference';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function PreferenceIndicators({ indicators, size = 'small' }: IPreferenceCircleProps) {
  const theme = useTheme();
  
  const circleSize = size === 'small' ? 8 : 10;
  const spacing = size === 'small' ? 0.5 : 0.75;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing }}>
      {indicators.map((isPreferred, index) => (
        <Box
          key={index}
          sx={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            backgroundColor: isPreferred ? theme.palette.success.main : 'transparent',
            border: `1px solid ${isPreferred ? theme.palette.success.main : theme.palette.grey[400]}`,
            flexShrink: 0,
          }}
        />
      ))}
    </Box>
  );
}

export default PreferenceIndicators; 