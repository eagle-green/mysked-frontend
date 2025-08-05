
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { isDevMode } from 'src/utils/timecard-helpers';
import { normalizeFormValues } from 'src/utils/form-normalize';

import { fetcher, endpoints } from 'src/lib/axios';

import {
  TimeCardModel,
  TimeSheetDetailSchema
} from './schema/timesheet-schema';

import type {
  TimeSheetDetailSchemaType} from './schema/timesheet-schema';

// ----------------------------------------------------------------------

type Props = {
  currentRecord?: TimeCardModel;
};

export function TimeSheetRecodingFormView({ currentRecord }: Props) {
  const { id } = useParams<{ id: string }>();

  const timeRecordingModel = new TimeCardModel();

  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const methods = useForm<TimeSheetDetailSchemaType>({
    mode: 'onChange',
    resolver: zodResolver(TimeSheetDetailSchema),
    defaultValues: timeRecordingModel,
    values: currentRecord ? normalizeFormValues(currentRecord) : timeRecordingModel,
  });

  const {
    reset,
  } = methods;

  useQuery({
    queryKey: ['timesheet', id],
    queryFn: async () => {
      if (!id) return null;
      //TODO:: Removing this if statement once api is ready
      if (!isDevMode()) {
        const response = await fetcher(`${endpoints.timesheet}/${id}`);
        return response.data;
      }

      return [];
    },
    enabled: !!id,
  });

  // Reset form when model changes
  useEffect(() => {
    if (currentRecord) {
      const normalizedValues = normalizeFormValues(currentRecord);
      reset(normalizedValues);
    }
  }, [currentRecord, reset]);



  return (
    <Box
      sx={[
        (theme) => ({
          mt: 5,
          width: 1,
          borderRadius: 2,
          border: `dashed 1px ${theme.vars.palette.divider}`,
          bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
        }),
      ]}
    >
      <Card>
        <Stack
          divider={
            <Divider
              flexItem
              orientation={mdUp ? 'vertical' : 'horizontal'}
              sx={{ borderStyle: 'dashed' }}
            />
          }
          sx={{ p: 3, gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
        >
          <Stack sx={{ width: 1 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
                Job #:
              </Typography>
            </Box>
          </Stack>
          <Stack sx={{ width: 1 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
                Site:
              </Typography>
            </Box>
          </Stack>
          <Stack sx={{ width: 1 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
                Client:
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}
