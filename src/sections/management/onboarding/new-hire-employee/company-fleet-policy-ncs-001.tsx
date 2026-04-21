import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy' | 'introText' | 'checkboxLabel'>;

export function CompanyFleetPolicyNCS001(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="Company Fleet Policies - PRE TRIP & POST TRIP (EG-PO-FL-NCS-001)"
      policy="fleet_ncs_001"
      introText="Review the PDF below (same policy as in the hiring package). Check the box, then sign."
      checkboxLabel="I have reviewed, understood and agree to comply with all company policies and procedures as applicable."
    />
  );
}
