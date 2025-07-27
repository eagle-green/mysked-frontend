import type { ISiteItem } from 'src/types/site';

import { PreferenceEditForm } from 'src/components/preference';

// ----------------------------------------------------------------------

type Props = {
  currentSite: ISiteItem;
};

export function SitePreferenceEditForm({ currentSite }: Props) {
  return (
    <PreferenceEditForm
      context="site"
      currentData={currentSite}
      currentId={currentSite?.id}
      preferenceType="not_preferred"
    />
  );
} 