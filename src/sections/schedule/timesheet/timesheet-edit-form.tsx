
import type { Theme, SxProps } from '@mui/material/styles';

import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useRouter } from 'src/routes/hooks';

import { isDevMode } from 'src/utils/timecard-helpers';
import { normalizeFormValues } from 'src/utils/form-normalize';

import { fetcher, endpoints } from 'src/lib/axios';
import { roleList, provinceList } from 'src/assets/data';

import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { TimeCardModel, TimeSheetDetailSchema, TimeSheetDetailSchemaType } from "./schema/timesheet-schema";


// ----------------------------------------------------------------------

type Props = {
  currentRecord?: TimeCardModel;
};

export function TimeSheetRecodingFormView({ currentRecord }: Props) {
   const router = useRouter();
   const queryClient = useQueryClient();
   const confirmDialog = useBoolean();
   const { user } = useAuthContext();
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
      control,
      handleSubmit,
      watch,
      reset,
      formState: { isSubmitting },
   } = methods;

   const models = watch();

   console.log(id);

   const { data, refetch } = useQuery({
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

   const onSubmit = handleSubmit(async () => {

   });

   return(
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
