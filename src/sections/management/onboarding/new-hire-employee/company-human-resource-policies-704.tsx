import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy' | 'introText' | 'checkboxLabel'>;

export function CompanyHumanResourcePolicy704(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="Company Human Resource Policies - Bullying and Harassment (EG-PO-HR-704)"
      policy="hr_policies_704"
      introText="Review the PDF below (same Bullying and Harassment policy as in the hiring package). Check the box, then sign."
      checkboxLabel="I have reviewed, understood and agree to comply with all company policies and procedures as applicable."
    />
  );
}
