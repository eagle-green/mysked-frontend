import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = {
  currentCompany: any;
  sx?: any;
  [key: string]: any;
};

export function CompanyPreferenceEditForm({ currentCompany, sx, ...other }: Props) {
  return (
    <PreferenceEditForm
      context="company"
      currentData={currentCompany}
      currentId={currentCompany?.id}
      preferenceType="not_preferred"
      sx={sx}
      {...other}
    />
  );
} 