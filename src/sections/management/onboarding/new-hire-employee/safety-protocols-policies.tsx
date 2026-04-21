import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy'>;

export function SafetyProtocolPolicies(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="EG - Safety Protocols (PDF)"
      policy="safety_protocols"
    />
  );
}
