import type { IEmployeePreferences } from 'src/types/preference';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

interface EnhancedPreferenceIndicatorsProps {
  preferences: IEmployeePreferences;
  size?: 'small' | 'medium';
}

export function EnhancedPreferenceIndicators({ preferences, size = 'small' }: EnhancedPreferenceIndicatorsProps) {
  const theme = useTheme();
  
  const circleSize = size === 'small' ? 6 : 8;
  const spacing = size === 'small' ? 0.25 : 0.5;
  const groupSpacing = size === 'small' ? 0.75 : 1;

  // Check if there are any preferences at all
  const hasAnyPreferences = 
    preferences.company || preferences.site || preferences.client;

  if (!hasAnyPreferences) {
    return null; // Don't show anything if no preferences
  }

  // Helper function to get preference status
  const getPreferenceStatus = (preference: any) => {
    if (!preference) return null;
    if (preference.type === 'preferred') return 'preferred';
    if (preference.type === 'not_preferred' && preference.isMandatory) return 'mandatory';
    if (preference.type === 'not_preferred') return 'not_preferred';
    return null;
  };

  // Get status for each entity
  const companyStatus = getPreferenceStatus(preferences.company);
  const siteStatus = getPreferenceStatus(preferences.site);
  const clientStatus = getPreferenceStatus(preferences.client);

  // Check if we have preferences in each category
  const hasPreferred = companyStatus === 'preferred' || siteStatus === 'preferred' || clientStatus === 'preferred';
  const hasNotPreferred = companyStatus === 'not_preferred' || siteStatus === 'not_preferred' || clientStatus === 'not_preferred';
  const hasMandatory = companyStatus === 'mandatory' || siteStatus === 'mandatory' || clientStatus === 'mandatory';

  const renderCircleGroup = (type: 'preferred' | 'not_preferred' | 'mandatory', show: boolean) => {
    if (!show) return null;

    let color: string;
    
    switch (type) {
      case 'preferred':
        color = theme.palette.success.main;
        break;
      case 'not_preferred':
        color = theme.palette.warning.main;
        break;
      case 'mandatory':
        color = theme.palette.error.main;
        break;
      default:
        color = theme.palette.grey[400];
    }

    const circles = [companyStatus, siteStatus, clientStatus].map((status, index) => {
      const isFilled = status === type;
      return (
        <Box
          key={index}
          sx={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            backgroundColor: isFilled ? color : 'transparent',
            border: `1px solid ${color}`,
            flexShrink: 0,
          }}
        />
      );
    });

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing }}>
        {circles}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: groupSpacing }}>
      {renderCircleGroup('preferred', hasPreferred)}
      {renderCircleGroup('not_preferred', hasNotPreferred)}
      {renderCircleGroup('mandatory', hasMandatory)}
    </Box>
  );
}

export default EnhancedPreferenceIndicators; 