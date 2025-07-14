import type { ISiteItem } from 'src/types/site';

import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = {
  currentSite: ISiteItem;
  sx?: any;
  [key: string]: any;
};

export function SitePreferenceEditForm({ currentSite, sx, ...other }: Props) {
  return (
    <PreferenceEditForm
      context="site"
      currentData={currentSite}
      currentId={currentSite?.id}
      sx={sx}
      {...other}
    />
  );
} 