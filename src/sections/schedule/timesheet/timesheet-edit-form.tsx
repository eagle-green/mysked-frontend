
import type { Theme, SxProps } from '@mui/material/styles';

import dayjs from 'dayjs';
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

import { fDate, fTime } from 'src/utils/format-time';
import { normalizeFormValues } from 'src/utils/form-normalize';
import { getFullAddress, isDevMode } from 'src/utils/timecard-helpers';

import { _timesheet } from 'src/_mock/_timesheet';
import { fetcher, endpoints } from 'src/lib/axios';
import { roleList, provinceList } from 'src/assets/data';

import { Label } from "src/components/label";
import { Iconify } from 'src/components/iconify/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { TimecardEntry, TimeCardStatus } from 'src/types/timecard';

import { TimeCardModel, TimeSheetDetailSchema, TimeSheetDetailSchemaType } from "./schema/timesheet-schema";



// ----------------------------------------------------------------------
export function TimeSheetRecodingFormView() {
   const router = useRouter();
   const queryClient = useQueryClient();
   const confirmDialog = useBoolean();
   const { user } = useAuthContext();
   const { id } = useParams<{ id: string }>();

   const { data, isLoading, refetch } = useQuery({
      queryKey: ['timesheet', id],
      queryFn: async () => {
         if (!id) return null;
         //TODO:: Removing this if statement once api is ready
         if (!isDevMode()) {
            const response = await fetcher(`${endpoints.timesheet}/${id}`);
            return response.data;
         }
         return new Promise<any>((resolve, reject) => {
            try {
               const mock = _timesheet as unknown as TimecardEntry[];
               const timesheet = mock.find(_mock => _mock.id === id);
               if (timesheet) {
                  timeSheetModel.UpdateTimeFields(
                     timesheet.travelStart,
                     timesheet.travelEnd,
                     timesheet.shiftStart,
                     timesheet.shiftEnd,
                     timesheet.breakStart,
                     timesheet.breakEnd,
                     timesheet.travelToKm,
                     timesheet.travelDuringKm,
                     timesheet.setupTimeHrs,
                     timesheet.packupTimeHrs
                  );
                  timeSheetModel.AddJob(data.job);
                  timeSheetModel.date = fDate(data.date);
                  setTimeSheetModel(timeSheetModel)
                  resolve(timesheet)
               }
               resolve({});
            } catch (err) {
               console.error('Failed to process mock data:', err);
               reject(err);
            }
         });
      },
      enabled: !!id,
   });
   const [timeSheetModel, setTimeSheetModel] = useState<TimeCardModel>(new TimeCardModel());
   const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

   const methods = useForm<TimeSheetDetailSchemaType>({
      mode: 'onChange',
      resolver: zodResolver(TimeSheetDetailSchema),
      values: timeSheetModel
   });

   const {
      control,
      handleSubmit,
      watch,
      reset,
      formState: { isSubmitting },
   } = methods;

   const models = watch();
   const [shiftHour, setShiftHour] = useState<number | string>('');

   // Reset form when model changes
   useEffect(() => {
      if (data) {
         const normalizedValues = normalizeFormValues(data);
         reset(normalizedValues);
      }
   }, [data, reset]);

   // ✅ Calculate shift duration
   useEffect(() => {
      if (models.shiftStart && models.shiftEnd) {
         const start = dayjs(models.shiftStart);
         const end = dayjs(models.shiftEnd);
         const hours = end.diff(start, 'minute') / 60;
         setShiftHour(hours.toFixed(2));
      } else {
      setShiftHour(0);
      }
   }, [models.shiftStart, models.shiftEnd]);

   const onSubmit = handleSubmit(async () => {

   });

   return(
      <Form
         methods={methods}
      >
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
                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Iconify icon="solar:case-minimalistic-bold"/>
                        <Stack sx={{
                              display: 'flex',
                              flexDirection: 'column'
                           }}
                        >
                           <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                              JOB NUMBER
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
                              {timeSheetModel.job?.job_number || ''}
                           </Typography>
                        </Stack>
                     </Box>

                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Iconify icon="solar:bill-list-bold-duotone"/>
                        <Stack sx={{
                              display: 'flex',
                              flexDirection: 'column'
                           }}
                        >
                           <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                              PO NUMBER
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
                              PO-1
                           </Typography>
                        </Stack>
                     </Box>
                  </Stack>


                  <Stack sx={{ width: 1 }}>
                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Iconify icon="mingcute:location-fill"/>
                        <Stack sx={{
                              display: 'flex',
                              flexDirection: 'column'
                           }}
                        >
                           <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                              {` ${timeSheetModel.job?.company?.name || '' }`}
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '.8rem'}}>
                            {timeSheetModel?.job?.company ? getFullAddress(timeSheetModel.job.company): ''}
                           </Typography>
                        </Stack>
                     </Box>

                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Iconify icon="solar:user-id-bold"/>
                        <Stack sx={{
                              display: 'flex',
                              flexDirection: 'column'
                           }}
                        >
                           <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                              CLIENT
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
                            { timeSheetModel.job?.client?.name || 'CLIENT NAME' }
                           </Typography>
                        </Stack>
                     </Box>
                  </Stack>

                  <Stack sx={{ width: 1 }}>
                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Iconify icon="solar:user-id-bold"/>
                        <Stack sx={{
                              display: 'flex',
                              flexDirection: 'column'
                           }}
                        >
                           <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                              SUBMITTED BY
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
                              WORKER NAME
                           </Typography>
                        </Stack>
                     </Box>
                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Iconify icon="solar:user-id-bold"/>
                        <Stack sx={{
                              display: 'flex',
                              flexDirection: 'column'
                           }}
                        >
                           <Typography variant="caption" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                              APPROVED BY
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '.9rem'}}>
                              APPROVEER NAME
                           </Typography>
                        </Stack>
                     </Box>
                  </Stack>

               </Stack>

               <Stack>
                  <Box
                     sx={{ bgcolor: 'background.neutral' }}
                  >
                     <Box sx={{ p: 3 }}>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontSize: '1.2rem' }}>
                           Time Summary
                        </Typography>
                     </Box>

                     <Stack>
                        <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1}}>
                           <Typography variant="body1" sx={{ color: 'text.primary' }}>
                              Travel Details
                           </Typography>
                           <Typography variant="body1" sx={{ color: 'text.disabled', display: 'flex', gap: 2, alignItems: 'center' }}>
                             Total Travel Hours Duration: <span style={{ color: 'text.primary'}}>{shiftHour ? shiftHour : 'Ongoing...'}</span>
                           </Typography>
                        </Box>
                        <Box
                           sx={{
                              p: 3,
                              gap: 2,
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                           }}
                        >
                           <Field.Text
                              fullWidth
                              name="date"
                              label="Date"
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={timeSheetModel.date}
                              disabled
                           />

                           <Field.MobileDateTimePicker
                              name="shiftStart"
                              label="Travel Start Date/Time"
                              value={timeSheetModel.shiftStart ? dayjs(timeSheetModel.shiftStart) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="shiftEnd"
                              label="Travel End Date/Time"
                              value={timeSheetModel.shiftEnd ? dayjs(timeSheetModel.shiftEnd) : null}
                           />
                        </Box>

                         <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1}}>
                           <Typography variant="body1" sx={{ color: 'text.primary' }}>
                              Shift Details
                           </Typography>
                           <Typography variant="body1" sx={{ color: 'text.disabled', display: 'flex', gap: 2, alignItems: 'center' }}>
                             Total Shift Duration (Excluded break hours): <span>{+shiftHour ? shiftHour : 'Ongoing...'}</span>
                           </Typography>
                        </Box>
                        <Box
                           sx={{
                              p: 3,
                              gap: 2,
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                           }}
                        >
                           <Field.MobileDateTimePicker
                              name="shiftStart"
                              label="Shift Start Date/Time"
                              value={timeSheetModel.shiftStart ? dayjs(timeSheetModel.shiftStart) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="breakStart"
                              label="Break Start Date/Time"
                              value={timeSheetModel.shiftEnd ? dayjs(timeSheetModel.shiftEnd) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="breakEnd"
                              label="Break End Date/Time"
                              value={timeSheetModel.shiftEnd ? dayjs(timeSheetModel.shiftEnd) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="shiftEnd"
                              label="Shift End Date/Time"
                              value={timeSheetModel.shiftEnd ? dayjs(timeSheetModel.shiftEnd) : null}
                           />
                        </Box>
                        
                     </Stack>
                  </Box>
               </Stack>

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
                     <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 2 }}>
                        <Typography variant="body1" sx={{ flexGrow: 1, fontSize: '1.2rem', py: 2 }}>
                          Travel & Distance
                        </Typography>

                        <Field.Text
                              fullWidth
                              name="date"
                              label="Travel To"
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={timeSheetModel.date}
                              disabled
                           />
                        <Field.Text
                           fullWidth
                           name="date"
                           label="Travel From"
                           slotProps={{ inputLabel: { shrink: true } }}
                           value={timeSheetModel.date}
                           disabled
                        />
                        <Field.Text
                           fullWidth
                           name="date"
                           label="Travel During"
                           slotProps={{ inputLabel: { shrink: true } }}
                           value={timeSheetModel.date}
                           disabled
                        />
                     </Box>
                  </Stack>

                  <Stack sx={{ width: 1 }}>
                     <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', gap: 2, flexDirection: 'column' }}>
                        <Box 
                           sx={{ mb: 1, display: 'flex', alignItems: 'start', gap: 2, width: 1 }}
                        >
                           <Typography variant="body1" sx={{ flexGrow: 1, fontSize: '1.2rem', py: 2 }}>
                              Submissios & Approvals
                           </Typography>
                           
                           <Typography variant="body1" sx={{ fontSize: '1.2rem', py: 2 }}>
                              <Label
                                 variant="soft"
                                 color={
                                    (timeSheetModel.status === TimeCardStatus.DRAFT && 'secondary') ||
                                    (timeSheetModel?.status === TimeCardStatus.SUBMITTED && 'info') ||
                                    (timeSheetModel?.status === TimeCardStatus.APPROVED && 'success') ||
                                    (timeSheetModel?.status === TimeCardStatus.REJECTED && 'error') ||
                                    'default'
                                 }
                                 >
                                 {timeSheetModel?.status?.toUpperCase()}
                              </Label>
                           </Typography>
                        </Box>
                        <Box 
                           sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, width: 1 }}
                        >
                           <Field.Text
                              fullWidth
                              name="date"
                              label="Submitted At"
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={timeSheetModel.date}
                              disabled
                           />
                           <Field.Text
                              fullWidth
                              name="date"
                              label="Approved At"
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={timeSheetModel.date}
                              disabled
                           />
                        </Box>
                        <Box 
                           sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, width: 1 }}
                        >
                           <Typography variant="body1" sx={{ flexGrow: 1,  fontSize: '.9rem', py: 2 }}>
                              Operator Sign Off
                           </Typography>
                           <Typography variant="body1" sx={{ flexGrow: 1,  fontSize: '.9rem', py: 2 }}>
                              Client Sign Off
                           </Typography>
                        </Box>
                     </Box>
                  </Stack>

               </Stack>
            </Card>
         </Box>
      </Form>
   );

}
