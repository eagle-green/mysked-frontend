import { PolicyPdfReviewSignDialog } from './policy-pdf-review-sign-dialog';

import type { PolicyPdfReviewSignDialogProps } from './policy-pdf-review-sign-dialog';

type Props = Omit<PolicyPdfReviewSignDialogProps, 'title' | 'policy'>;

export function CompanyRulesPolicies(props: Props) {
  return (
    <PolicyPdfReviewSignDialog {...props} title="Company Rules (PDF)" policy="company_rules" />
  );
}
