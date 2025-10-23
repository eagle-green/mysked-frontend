import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Form } from 'src/components/hook-form';
import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

import type { InvoiceDetailType } from './invoice-generate';

//--------------------------------------------------

type serviceControlType = { service: string; quantity: number; unitPrice: number };

type Props = {
  open: boolean;
  onClose: () => void;
  currentInvoice?: InvoiceDetailType | null;
  onUpdateSuccess: (data: InvoiceDetailType) => void;
};

export function InvoiceQuickEditForm({ currentInvoice, open, onClose, onUpdateSuccess }: Props) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));

  const defaultValues: InvoiceDetailType = {
    invoiceNumber: '',
    customerName: '',
    clientName: '',
    address: '',
    isReviewed: false,
    services: [{ service: 'LCT', quantity: 3, unitPrice: 90 }],
  };

  const methods = useForm<InvoiceDetailType>({
    mode: 'all',
    defaultValues,
    values: currentInvoice || defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    watch,
    control,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    onUpdateSuccess(data);
  });
  const services = watch('services') || [];

  const servicesControlFields = (index: number): Record<string, string> => ({
    service: `services[${index}].service`,
    quantity: `services[${index}].quantity`,
    unitPrice: `services[${index}].unitPrice`,
  });

  const defaultServicesValue: Omit<serviceControlType, 'id'> = {
    service: '',
    quantity: 0,
    unitPrice: 0,
  };

  const SERVICES_OPTIONS = [
    {
      value: 'tcp',
      label: 'TCP',
    },
    {
      value: 'lct',
      label: 'LCT',
    },
    {
      value: 'hwy',
      label: 'HWY',
    },
  ];
  const {
    fields: serviceFields,
    append: apprendServiceFields,
    remove: removeServiceFields,
  } = useFieldArray({
    control,
    name: 'services',
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 1200 },
        },
      }}
    >
      <DialogTitle>
        {currentInvoice?.invoiceNumber || defaultValues.invoiceNumber} (
        {currentInvoice?.customerName || defaultValues.customerName})
      </DialogTitle>

      <Divider sx={{ borderStyle: 'dashed', mb: 2 }} />

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          {/* <Box
            sx={{
              pt: 1,
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
            }}
          >
            <Field.Text name="invoiceNumber" label="Invoice #" disabled size="small" />
            <Field.Text name="customerName" label="Customer Name" disabled size="small" />
            <Field.Text name="clientName" label="Client Name" disabled size="small" />
          </Box> */}

          <Box
            sx={{
              mt: 2,
            }}
          >
            {serviceFields.map((fields, index) => (
              <Box
                key={`service-${fields.id}-${index}`}
                sx={{
                  gap: 2,
                  width: 1,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-end', md: 'center' },
                  mt: 1.5,
                }}
              >
                {/* <Field.Select
                  name={servicesControlFields(index).service}
                  label="Service"
                  size="small"
                >
                  {SERVICES_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Field.Select> */}

                <Field.Text
                  name={servicesControlFields(index).service}
                  label="Service"
                  size="small"
                />

                <Field.Text
                  name={servicesControlFields(index).quantity}
                  label="Quantity"
                  size="small"
                />
                <Field.Text
                  name={servicesControlFields(index).unitPrice}
                  label="Unit Price"
                  size="small"
                />
                {!isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={() => {
                      removeServiceFields(index);
                    }}
                    disabled={services.length <= 1}
                    sx={{ px: 4.5 }}
                  >
                    Remove
                  </Button>
                )}
                {isXsSmMd && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={() => {
                      removeServiceFields(index);
                    }}
                    disabled={services.length <= 1}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            ))}
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{ mt: 2, flexShrink: 0, alignItems: 'flex-start', px: 2 }}
              onClick={() => {
                apprendServiceFields({
                  ...defaultServicesValue,
                });
              }}
            >
              Add Service
            </Button>
          </Box>
        </DialogContent>

        <Divider sx={{ borderStyle: 'dashed', mt: 2 }} />

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              onClose();
              reset();
            }}
          >
            Cancel
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            Update
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
