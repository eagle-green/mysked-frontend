import type { NewHire, PolicyAgreement } from 'src/types/new-hire';

/** Employee signature image for a policy row (only after that policy is signed). */
export function employeePolicySignature(
  data: NewHire,
  key: keyof PolicyAgreement
): string {
  return data.policy_agreement_signatures?.[key]?.trim() ?? '';
}
