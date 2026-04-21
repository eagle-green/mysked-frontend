import { useFormContext } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';

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
import { Field } from 'src/components/hook-form/fields';

import { SignatureDialog } from './signature';
import { PolicyPdfPreview } from './policy-pdf-preview';

type Props = {
  open: boolean;
  onClose(): void;
  onSave(signature: string): void;
  isPreview?: boolean;
};

export function CompanyFleetPolicyGen002({ open, onClose, onSave, isPreview = false }: Props) {
  const { getValues } = useFormContext();
  const isMobile = useMediaQuery('(max-width:768px)');
  const [acknowledge, SetAcknowledge] = useState<boolean>(false);
  const [signatureError, setSignatureError] = useState(false);
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null);
  const [frozenFuelCardForPdf, setFrozenFuelCardForPdf] = useState({
    company_name: '',
    card_number: '',
  });
  const signatureDialog = useBoolean();
  const pendingSignatureRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!open || isPreview) return;
    const fc = getValues('fuel_card');
    setFrozenFuelCardForPdf({
      company_name: String(fc?.company_name ?? ''),
      card_number: String(fc?.card_number ?? ''),
    });
  }, [open, isPreview, getValues]);

  /** Only reset when the fleet policy dialog opens/closes — not when nested SignatureDialog toggles (would wipe signature after save). */
  useEffect(() => {
    if (!open) {
      signatureDialog.onFalse();
      SetAcknowledge(false);
      setSignatureError(false);
      setCapturedSignature(null);
      return;
    }
    SetAcknowledge(false);
    setSignatureError(false);
    setCapturedSignature(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally `open` only; `signatureDialog` in deps cleared `capturedSignature` after signing
  }, [open]);

  const handleConfirm = () => {
    if (!acknowledge) return;
    const dataUrl = capturedSignature?.trim() ?? '';
    if (!dataUrl) {
      setSignatureError(true);
      return;
    }
    setSignatureError(false);
    const fc = getValues('fuel_card');
    setFrozenFuelCardForPdf({
      company_name: String(fc?.company_name ?? ''),
      card_number: String(fc?.card_number ?? ''),
    });
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
        paper: { sx: { maxHeight: isMobile ? undefined : '96vh' } },
        transition: {
          onExited: () => {
            const sig = pendingSignatureRef.current;
            pendingSignatureRef.current = null;
            if (sig) onSave(sig);
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        Company Fleet Policies - Company Fuel Cards (EG-PO-PO-FL-GEN-002)
      </DialogTitle>
      <DialogContent
        sx={{
          typography: 'body2',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          px: 3,
          gap: 2,
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
        {!isPreview && (
          <Typography variant="body2" color="text.secondary">
            Review the PDF below (same policy as in the hiring package). Enter fuel card details if
            applicable, then check the box, then sign.
          </Typography>
        )}
        <PolicyPdfPreview
          policy="fleet_gen_002"
          previewVariant={isPreview ? 'fill' : 'default'}
          frozenFuelCardForPdf={isPreview ? undefined : frozenFuelCardForPdf}
        />

        {!isPreview && (
          <>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                width: '100%',
              }}
            >
              <Field.Text name="fuel_card.company_name" label="Company Name" fullWidth />
              <Field.Text
                digitsOnly
                name="fuel_card.card_number"
                label="Card Number"
                fullWidth
              />
            </Box>

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
                      SetAcknowledge(checked);
                      setSignatureError(false);
                      if (!checked) {
                        setCapturedSignature(null);
                        return;
                      }
                      signatureDialog.onTrue();
                    }}
                  />
                }
                label="I have reviewed, understood and agree to comply with all company policies and procedures as applicable."
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                Check the box above to open the signature dialog.
              </Typography>
              {acknowledge ? (
                <>
                  {capturedSignature ? (
                    <>
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
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      A signature window should open automatically. If it did not, or you closed it,
                      click below.
                    </Typography>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      alignItems: 'center',
                      width: '100%',
                      justifyContent: { xs: 'stretch', sm: 'flex-start' },
                    }}
                  >
                    <Button
                      type="button"
                      variant="contained"
                      size={isMobile ? 'large' : 'small'}
                      fullWidth={isMobile}
                      sx={isMobile ? { minHeight: 48, py: 1.25 } : undefined}
                      onClick={() => signatureDialog.onTrue()}
                    >
                      {capturedSignature ? 'Change signature' : 'Open signature dialog'}
                    </Button>
                  </Box>
                </>
              ) : null}
              {signatureError ? (
                <FormHelperText error>
                  Please add your signature using the signature dialog.
                </FormHelperText>
              ) : null}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          width: 1,
          boxSizing: 'border-box',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: 1,
          justifyContent: 'center',
          alignItems: { xs: 'stretch', sm: 'center' },
          '& .MuiButton-root': {
            width: { xs: '100%', sm: 'auto' },
            justifyContent: 'center',
            textAlign: 'center',
            m: 0,
            ...(isMobile ? { px: 2 } : {}),
          },
        }}
      >
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          size={isMobile ? 'large' : 'medium'}
          fullWidth={isMobile}
          sx={isMobile ? { minHeight: 48, py: 1.25 } : undefined}
          onClick={() => onClose()}
        >
          Close
        </Button>
        {!isPreview && (
          <Button
            type="button"
            variant="contained"
            color="success"
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            sx={{
              ...(isMobile ? { minHeight: 48, py: 1.25 } : {}),
              m: 0,
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
        type="fleet_policy_gen_002"
        title="Sign policy (EG-PO-PO-FL-GEN-002)"
        freshSignatureOnOpen
        onSave={(signature, _type) => {
          if (signature) setCapturedSignature(signature);
        }}
        onCancel={() => {
          setSignatureError(false);
          if (!capturedSignature) {
            SetAcknowledge(false);
          }
        }}
      />
    </Dialog>
  );
}
