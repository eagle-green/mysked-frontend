import type { ICalendarJob } from 'src/types/calendar';

import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { uuidv4 } from 'minimal-shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DialogActions from '@mui/material/DialogActions';

import { fIsAfter } from 'src/utils/format-time';

import { createJob, updateJob, deleteJob } from 'src/actions/calendar';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type JobSchemaType = zod.infer<typeof JobSchema>;

export const JobSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: 'Title is required!' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  description: zod
    .string()
    .min(1, { message: 'Description is required!' })
    .min(50, { message: 'Description must be at least 50 characters' }),
  // Not required
  color: zod.string(),
  allDay: zod.boolean(),
  start: zod.union([zod.string(), zod.number()]),
  end: zod.union([zod.string(), zod.number()]),
});

// ----------------------------------------------------------------------

type Props = {
  colorOptions: string[];
  onClose: () => void;
  currentJob?: ICalendarJob;
};

export function CalendarForm({ currentJob, colorOptions, onClose }: Props) {
  const methods = useForm<JobSchemaType>({
    mode: 'all',
    resolver: zodResolver(JobSchema),
    defaultValues: currentJob,
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const dateError = fIsAfter(values.start, values.end);

  const onSubmit = handleSubmit(async (data) => {
    const jobData = {
      id: currentJob?.id ? currentJob?.id : uuidv4(),
      color: data?.color,
      title: data?.title,
      allDay: data?.allDay,
      description: data?.description,
      end: data?.end,
      start: data?.start,
    };

    try {
      if (!dateError) {
        if (currentJob?.id) {
          await updateJob(jobData);
          toast.success('Update success!');
        } else {
          await createJob(jobData);
          toast.success('Create success!');
        }
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  });

  const onDelete = useCallback(async () => {
    try {
      await deleteJob(`${currentJob?.id}`);
      toast.success('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [currentJob?.id, onClose]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Stack spacing={3}>
          <Field.Text name="title" label="Title" />

          <Field.Text name="description" label="Description" multiline rows={3} />

          {/* <Field.Switch name="allDay" label="All day" /> */}

          <Field.MobileDateTimePicker name="start" label="Start date" />

          <Field.MobileDateTimePicker
            name="end"
            label="End date"
            slotProps={{
              textField: {
                error: dateError,
                helperText: dateError ? 'End date must be later than start date' : null,
              },
            }}
          />

          {/* <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                value={field.value as string}
                onChange={(color) => field.onChange(color as string)}
                options={colorOptions}
              />
            )}
          /> */}
        </Stack>
      </Scrollbar>

      <DialogActions sx={{ flexShrink: 0 }}>
        {!!currentJob?.id && (
          <Tooltip title="Delete event">
            <IconButton color="error" onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" variant="contained" loading={isSubmitting} disabled={dateError}>
          Save changes
        </Button>
      </DialogActions>
    </Form>
  );
}
