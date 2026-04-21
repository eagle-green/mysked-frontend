import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy' | 'introText' | 'checkboxLabel'>;

export function CompanyHumanResourcePolicy(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="Company Human Resource Policies (EG-PO-HR-703)"
      policy="hr_policies_703"
      introText="Review the PDF below (same Drug and Alcohol policy as in the hiring package). Check the box, then sign."
      checkboxLabel="I have reviewed, understood and agree to comply with all company policies and procedures as applicable."
    />
  );
}
