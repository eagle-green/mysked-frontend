// ----------------------------------------------------------------------
import { z as zod } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { normalizeFormValues } from 'src/utils/form-normalize';

import { Field, Form } from 'src/components/hook-form';

type Props = {
  open: boolean;
  onClose: () => void;
  currentData?: any;
  onUpdateSuccess: (currentData?: any) => void;
};

const InspectionTypeSchema = zod.object({
  label: zod.string().min(1, { message: 'Label is required!' }),
  description: zod.string().min(1, { message: 'Description is required!' }),
  is_required: zod.boolean(),
});

export function PreTripInspectionFormDialog({
  currentData,
  open,
  onClose,
  onUpdateSuccess,
}: Props) {
  const queryClient = useQueryClient();

  const isEditMode = !!currentData?.id;

  const defaultValues: any = {
    label: '',
    description: '',
    is_required: '',
  };

  const methods = useForm<any>({
    mode: 'all',
    resolver: zodResolver(InspectionTypeSchema),
    defaultValues,
    values: currentData ? normalizeFormValues(currentData) : defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    control,
    watch,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (isEditMode && !currentData?.id) return;
    onUpdateSuccess(data);
  });

  const isRequired = watch('is_required');

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 720 },
        },
      }}
    >
      <DialogTitle>{isEditMode ? 'Quick update' : 'Create New Inspection Type'}</DialogTitle>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Box
            sx={{
              pt: 1,
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(1, 1fr)' },
            }}
          >
            <Field.Text name="label" label="Inspection Type Label*" />
            {/* <Field.Text name="field_name" label="Inspection Type Field Name* " /> */}
            <Field.Text fullWidth multiline rows={4} name="description" label="Description*" />
            <Stack>
              <Controller
                name="is_required"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Required"
                  />
                )}
              />
              <Typography variant="caption" color="text.disabled">
                {isRequired
                  ? 'Must be completed during inspection'
                  : 'Optional — include this if the information is available during inspection'}
              </Typography>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
