import type { IUser } from 'src/types/user';
import type { CardProps } from '@mui/material/Card';

import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = CardProps & {
  currentData: IUser;
};

export function UserPreferredEditForm({ currentData, sx, ...other }: Props) {
  return (
    <PreferenceEditForm
      context="user"
      currentData={currentData}
      currentId={currentData.id}
      preferenceType="preferred"
      sx={sx}
      {...other}
    />
  );
} 