import Box from '@mui/material/Box';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function InvoiceCreateEditNotes() {
  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Field.Text
        name="customerMemo"
        label="Message on invoice"
        placeholder="Enter message to display on invoice"
        multiline
        rows={3}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="privateNote"
        label="Message on statement"
        placeholder="Enter internal note (not visible on invoice)"
        multiline
        rows={3}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}

