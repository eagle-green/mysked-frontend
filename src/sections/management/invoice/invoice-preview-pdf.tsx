import { PDFViewer } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import InvoicePdf from 'src/pages/template/invoice-pdf';

import { Iconify } from 'src/components/iconify/iconify';

//-----------------------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PreviewInvoicePdf({ open, onClose }: Props) {
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 1200, minHeight: 800 },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography>PREVIEW PDF INVOICE</Typography>
        <IconButton edge="end" color="inherit" onClick={onClose}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: 0 }}>
        <Box sx={{ width: '100%', height: '100%' }}>
          <PDFViewer style={{ width: '100%', height: '100%', minHeight: 800 }}>
            <InvoicePdf />
          </PDFViewer>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
