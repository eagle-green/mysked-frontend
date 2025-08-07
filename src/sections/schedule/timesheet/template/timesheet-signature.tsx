

import type { UseBooleanReturn } from "minimal-shared/hooks";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
//-----------------------------------------------------------------------
type TimeSheetSignatureProps = {
   dialog: UseBooleanReturn;
   onSave: (signature: string | null, type: string) => void;
   type: string;
}

export function TimeSheetSignatureDialog({dialog, type,  onSave}: TimeSheetSignatureProps) {
   const sigCanvas = useRef<SignatureCanvas | null>(null);
   const theme = useTheme();

   return (
      <Dialog fullWidth maxWidth="xs" open={dialog.value} onClose={dialog.onFalse}>
         <DialogTitle sx={{ pb: 2 }}>Signature</DialogTitle>
         <DialogContent sx={{ typography: 'body2'}}>
            <Typography variant="body1" sx={{ flexGrow: 1, py: 2 }}>
               Client Sign Off
            </Typography>

            <Paper elevation={3} sx={{ padding: 2, border: 1, borderColor: 'text.disabled', width: 1, touchAction: 'none' }}>
               <SignatureCanvas
                  penColor={theme.palette.text.secondary}
                  canvasProps={{
                     width: 250,
                     height: 200,
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
                  dialog.onFalse()
                  sigCanvas.current?.clear()
               }}
            >
               Cancel
            </Button>
            <Button
               variant="contained"
               color="error"
               onClick={() => {
                  const signature = sigCanvas.current?.isEmpty() ? null : sigCanvas.current?.getCanvas().toDataURL('image/png') as string;
                  dialog.onFalse()
                  onSave(signature, type);
               }}
            >
               Save
            </Button>
         </DialogActions>
      </Dialog>
   );
}