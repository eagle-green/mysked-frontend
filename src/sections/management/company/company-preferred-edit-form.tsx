import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = {
  currentCompany: any;
  sx?: any;
  [key: string]: any;
};

export function CompanyPreferredEditForm({ currentCompany, sx, ...other }: Props) {
  return (
    <PreferenceEditForm
      context="company"
      currentData={currentCompany}
      currentId={currentCompany?.id}
      preferenceType="preferred"
      sx={sx}
      {...other}
    />
  );
} 