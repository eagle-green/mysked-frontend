import type { UseBooleanReturn } from 'minimal-shared/hooks';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
//-----------------------------------------------------------------------
type TimeSheetSignatureProps = {
  title: string;
  dialog: UseBooleanReturn;
  onSave: (signature: string | null, type: string) => void;
  type: string;
};

export function TimeSheetSignatureDialog({ dialog, type, title, onSave }: TimeSheetSignatureProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const theme = useTheme();

  return (
    <Dialog fullWidth maxWidth="xs" open={dialog.value} onClose={dialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>Signature</DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ flexGrow: 1, py: 2 }}>
          {title}
        </Typography>

        {/* Client Signature Message */}
        {type === 'operator' && (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: 'info.lighter',
              border: '1px solid',
              borderColor: 'info.main',
              borderRadius: 1
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'info.darker',
                fontWeight: 'medium',
                textAlign: 'center',
                lineHeight: 1.5
              }}
            >
              By signing this invoice as a representative of the customer confirms that the hours recorded are accurate and were performed by the name of the employee(s) in a satisfactory manner.
            </Typography>
          </Paper>
        )}

        <Paper elevation={3}>
          <SignatureCanvas
            penColor={theme.palette.text.secondary}
            minWidth={2}
            maxWidth={3}
            throttle={16}
            velocityFilterWeight={0.7}
            canvasProps={{
              width: 400,
              height: 200,
              style: {
                width: '100%',
                height: 200,
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                borderColor: `${theme.palette.text.secondary}`,
              },
            }}
            ref={sigCanvas}
          />
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            sigCanvas.current?.clear();
          }}
        >
          Clear
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            dialog.onFalse();
            sigCanvas.current?.clear();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const signature = sigCanvas.current?.isEmpty()
              ? null
              : (sigCanvas.current?.getCanvas().toDataURL('image/png') as string);
            dialog.onFalse();
            onSave(signature, type);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
