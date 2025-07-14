import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = {
  currentData: any;
  sx?: any;
  [key: string]: any;
};

export function ClientPreferenceEditForm({ currentData, sx, ...other }: Props) {
  return (
    <PreferenceEditForm
      context="client"
      currentData={currentData}
      currentId={currentData?.id}
      sx={sx}
      {...other}
    />
  );
}
