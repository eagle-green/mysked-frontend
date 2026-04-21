import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy'>;

export function CompanyMotiveCameras(props: Props) {
  return (
    <PolicyPdfReviewSignDialog {...props} title="Motive Cameras (PDF)" policy="motive_cameras" />
  );
}
