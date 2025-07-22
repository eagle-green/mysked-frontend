import type { IClient } from 'src/types/client';
import type { CardProps } from '@mui/material/Card';

import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = CardProps & {
  currentData: IClient;
};

export function ClientPreferenceEditForm({ currentData, sx, ...other }: Props) {
  return (
    <PreferenceEditForm
      context="client"
      currentData={currentData}
      currentId={currentData.id}
      preferenceType="not_preferred"
      sx={sx}
      {...other}
    />
  );
}
