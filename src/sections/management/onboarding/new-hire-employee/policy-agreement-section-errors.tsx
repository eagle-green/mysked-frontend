import type { PolicyAgreement, ManagementAgreement } from 'src/types/new-hire';

import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

const MGMT_POLICY_KEYS: (keyof ManagementAgreement)[] = [
  'safety_company_protocols',
  'company_rules',
  'motive_cameras',
  'company_fire_extiguisher',
];

type Props = {
  policyKey: keyof PolicyAgreement;
  /** When true, also surface `supervisor_agreement` / `safety_manager_agreement` errors for rows that have hiring-manager signing. */
  includeHiringManagerErrors?: boolean;
};

/**
 * Inline validation messages for a single policy row (employee acknowledgement + optional hiring-manager columns).
 */
export function PolicyAgreementSectionErrors({
  policyKey,
  includeHiringManagerErrors = false,
}: Props) {
  const {
    formState: { errors },
  } = useFormContext();

  const pa = errors.policy_agreement as
    | Partial<Record<keyof PolicyAgreement, { message?: string }>>
    | undefined;
  const pas = errors.policy_agreement_signatures as
    | Partial<Record<keyof PolicyAgreement, { message?: string }>>
    | undefined;

  const messages: string[] = [];
  const push = (msg?: string) => {
    if (msg) messages.push(msg);
  };

  push(pa?.[policyKey]?.message);
  push(pas?.[policyKey]?.message);

  if (includeHiringManagerErrors && MGMT_POLICY_KEYS.includes(policyKey as keyof ManagementAgreement)) {
    const sup = errors.supervisor_agreement as
      | Partial<Record<keyof ManagementAgreement, { message?: string }>>
      | undefined;
    const sm = errors.safety_manager_agreement as
      | Partial<Record<keyof ManagementAgreement, { message?: string }>>
      | undefined;
    const k = policyKey as keyof ManagementAgreement;
    push(sup?.[k]?.message);
    push(sm?.[k]?.message);
  }

  if (messages.length === 0) return null;
  const unique = [...new Set(messages)];

  return (
    <Alert
      severity="error"
      sx={{
        mb: 2,
        width: '100%',
        alignItems: 'flex-start',
        py: 1.25,
        '& .MuiAlert-icon': {
          alignSelf: 'flex-start',
          py: 0,
          pt: 0.375,
          mr: 1.25,
        },
        '& .MuiAlert-message': { py: 0, width: 1, minWidth: 0 },
      }}
      role="alert"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {unique.map((msg) => (
          <Typography key={msg} variant="body2" component="div">
            {msg}
          </Typography>
        ))}
      </Box>
    </Alert>
  );
}
