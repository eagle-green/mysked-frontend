import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy'>;

export function CompanyFireExtinguisherGuide(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="Fire Extinguisher (PDF)"
      policy="fire_extinguisher"
    />
  );
}
