import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy' | 'introText' | 'checkboxLabel'>;

export function CompanyFleetPolicyGen003(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="Company Fleet Policies - Usage (EG-PO-PO-FL-GEN-003 GPS)"
      policy="fleet_gen_003"
      introText="Review the PDF below (same policy as in the hiring package). Check the box, then sign."
      checkboxLabel="I have reviewed, understood, and agree to comply with all company policies and procedures as applicable."
    />
  );
}
