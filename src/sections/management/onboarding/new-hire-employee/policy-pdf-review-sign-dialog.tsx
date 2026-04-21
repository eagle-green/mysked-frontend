import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';

import { SignatureDialog } from './signature';
import { PolicyPdfPreview } from './policy-pdf-preview';

import type { PolicyPdfKind } from './policy-pdf-preview';

const DEFAULT_INTRO =
  'Review the hiring-package PDF above. Check the box to open a separate window where you can sign, then confirm here.';

const DEFAULT_CHECKBOX =
  'I have reviewed this policy in the PDF above and agree to proceed with signing.';

/** Document reference shown in the nested “Sign policy (…)” dialog — matches hiring-package PDF policy numbers where defined. */
const POLICY_SIGN_DIALOG_REF: Record<PolicyPdfKind, string> = {
  safety_protocols: 'EG - Safety Protocols',
  company_rules: 'Company Rules',
  motive_cameras: 'Motive Cameras',
  fire_extinguisher: 'Fire Extinguisher',
  hr_policies_703: 'EG-PO-HR-703',
  hr_policies_704: 'EG-PO-HR-704',
  fleet_ncs_001: 'EG-PO-FL-NCS-001',
  fleet_ncs_003u: 'EG-PO-FL-NCS-003U',
  fleet_gen_002: 'EG-PO-PO-FL-GEN-002',
  fleet_gen_003: 'EG-PO-PO-FL-GEN-003 GPS',
};

export function defaultPolicySignatureDialogTitle(kind: PolicyPdfKind): string {
  return `Sign policy (${POLICY_SIGN_DIALOG_REF[kind]})`;
}

export type PolicyPdfReviewSignDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  isPreview?: boolean;
  title: string;
  policy: PolicyPdfKind;
  /** Helper line under the PDF (defaults to hiring-package / manager wording). */
  introText?: string;
  /** Acknowledgement checkbox label. */
  checkboxLabel?: string;
  /** Title on the nested signature dialog (defaults to `Sign policy (…)` from `policy`). */
  signatureDialogTitle?: string;
};

export function PolicyPdfReviewSignDialog({
  open,
  onClose,
  onSave,
  isPreview = false,
  title,
  policy,
  introText = DEFAULT_INTRO,
  checkboxLabel = DEFAULT_CHECKBOX,
  signatureDialogTitle,
}: PolicyPdfReviewSignDialogProps) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [acknowledge, setAcknowledge] = useState(false);
  const [signatureError, setSignatureError] = useState(false);
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null);
  const signatureDialog = useBoolean();
  const pendingSignatureRef = useRef<string | null>(null);

  /** Only reset when the policy dialog opens/closes — not when nested SignatureDialog toggles (would wipe signature after save). */
  useEffect(() => {
    if (!open) {
      signatureDialog.onFalse();
      setAcknowledge(false);
      setSignatureError(false);
      setCapturedSignature(null);
      return;
    }
    setAcknowledge(false);
    setSignatureError(false);
    setCapturedSignature(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally `open` only; `signatureDialog` in deps caused re-runs that cleared `capturedSignature` right after signing
  }, [open]);

  const resolvedSignatureDialogTitle =
    signatureDialogTitle ?? defaultPolicySignatureDialogTitle(policy);

  const handleConfirm = () => {
    if (!acknowledge) return;
    const dataUrl = capturedSignature?.trim() ?? '';
    if (!dataUrl) {
      setSignatureError(true);
      return;
    }
    setSignatureError(false);
    pendingSignatureRef.current = dataUrl;
    onClose();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: { maxHeight: isMobile ? undefined : '96vh' },
        },
        transition: {
          onExited: () => {
            const sig = pendingSignatureRef.current;
            pendingSignatureRef.current = null;
            if (sig) onSave(sig);
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent
        sx={{
          typography: 'body2',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          px: 3,
          pb: 2,
          overflow: 'auto',
          ...(isPreview
            ? {
                height: 'auto',
                maxHeight: 'calc(96vh - 120px)',
                minHeight: 0,
              }
            : {
                height: isMobile ? 'calc(100vh - 200px)' : 'min(90vh, 920px)',
              }),
        }}
      >
        <PolicyPdfPreview
          policy={policy}
          previewVariant={isPreview ? 'fill' : 'default'}
        />

        {!isPreview && (
          <>
            <Typography variant="body2" color="text.secondary">
              {introText}
            </Typography>
            <Box
              sx={{
                bgcolor: 'divider',
                p: 1,
                borderRadius: 1,
                width: '100%',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledge}
                    onChange={(_, checked) => {
                      setAcknowledge(checked);
                      setSignatureError(false);
                      if (!checked) {
                        setCapturedSignature(null);
                        return;
                      }
                      signatureDialog.onTrue();
                    }}
                  />
                }
                label={checkboxLabel}
              />
            </Box>
            {!acknowledge ? (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                Check the box above to open the signature dialog.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                {capturedSignature ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 1.5,
                      maxWidth: 360,
                      width: '100%',
                    }}
                  >
                    <Typography variant="body2" color="success.main">
                      Signature captured. You can change it before confirming.
                    </Typography>
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        bgcolor: 'background.paper',
                        width: '100%',
                        maxWidth: 320,
                      }}
                    >
                      <Box
                        component="img"
                        alt=""
                        src={capturedSignature}
                        sx={{
                          display: 'block',
                          maxHeight: 120,
                          width: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                    <Button
                      type="button"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        minHeight: 48,
                        py: 1.25,
                        px: { xs: 2, sm: 3 },
                        alignSelf: 'stretch',
                      }}
                      onClick={() => signatureDialog.onTrue()}
                    >
                      Change signature
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      A signature window should open automatically. If it did not, or you closed it,
                      click below.
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        alignItems: 'center',
                        width: '100%',
                        justifyContent: { xs: 'stretch', sm: 'flex-start' },
                      }}
                    >
                      <Button
                        type="button"
                        variant="contained"
                        size="large"
                        fullWidth={isMobile}
                        sx={{
                          minHeight: 48,
                          py: 1.25,
                          px: { xs: 2, sm: 3 },
                          minWidth: { sm: 220 },
                        }}
                        onClick={() => signatureDialog.onTrue()}
                      >
                        Open signature dialog
                      </Button>
                    </Box>
                  </>
                )}
                {signatureError ? (
                  <FormHelperText error>
                    Please add your signature using the dialog above.
                  </FormHelperText>
                ) : null}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          pt: 1,
          width: 1,
          boxSizing: 'border-box',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1.5, sm: 2 },
          justifyContent: 'flex-end',
          alignItems: { xs: 'stretch', sm: 'center' },
          '& .MuiButton-root': {
            width: { xs: '100%', sm: 'auto' },
            minHeight: 48,
            py: 1.25,
            px: { xs: 2, sm: 3 },
            minWidth: { sm: 160 },
            justifyContent: 'center',
            textAlign: 'center',
            m: 0,
          },
        }}
      >
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          size="large"
          fullWidth={isMobile}
          onClick={() => onClose()}
        >
          Close
        </Button>
        {!isPreview && (
          <Button
            type="button"
            variant="contained"
            color="success"
            size="large"
            fullWidth={isMobile}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            sx={{
              minWidth: { sm: 200 },
              '& .MuiButton-startIcon': { marginLeft: 0, marginRight: 1 },
            }}
            onClick={handleConfirm}
            disabled={!acknowledge || !capturedSignature}
          >
            Sign and confirm
          </Button>
        )}
      </DialogActions>

      <SignatureDialog
        dialog={signatureDialog}
        type={`policy_pdf_review_${policy}`}
        title={resolvedSignatureDialogTitle}
        freshSignatureOnOpen
        onSave={(signature, _type) => {
          if (signature) setCapturedSignature(signature);
        }}
        onCancel={() => {
          setSignatureError(false);
          // No signature saved yet — treat cancel as revoking acknowledgement.
          if (!capturedSignature) {
            setAcknowledge(false);
          }
        }}
      />
    </Dialog>
  );
}
