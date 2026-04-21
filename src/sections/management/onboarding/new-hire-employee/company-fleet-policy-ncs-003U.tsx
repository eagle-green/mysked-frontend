import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy' | 'introText' | 'checkboxLabel'>;

export function CompanyFleetPolicyNCS003U(props: Props) {
  return (
    <PolicyPdfReviewSignDialog
      {...props}
      title="Company Fleet Policies - Use of Company Vehicles (EG-PO-FL-NCS-003U)"
      policy="fleet_ncs_003u"
      introText="Review the PDF below (same policy as in the hiring package). Check the box, then sign."
      checkboxLabel="By signing this policy, I confirm that I have read, understood and agree to abide by the information contained within."
    />
  );
}
