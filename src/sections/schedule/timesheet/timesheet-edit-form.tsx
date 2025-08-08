
import dayjs from 'dayjs';
import { Icon } from '@iconify/react';
import { useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, Suspense, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname, useRouter, useSearchParams } from 'src/routes/hooks';

import { normalizeFormValues } from 'src/utils/form-normalize';
import { fDate, fIsAfter, fIsSame } from 'src/utils/format-time';
import { getFullAddress, isDevMode } from 'src/utils/timecard-helpers';

import { _timesheet } from 'src/_mock/_timesheet';
import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from "src/components/label";
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { UserType } from 'src/auth/types';

import { IDatePickerControl } from 'src/types/common';
import { TimecardEntry, TimeSheetStatus } from 'src/types/timecard';
import { ITimeSheetEntries, ITimeSheetTab, TimeSheetDetails } from 'src/types/timesheet';

import { TimeSummaryHeader } from './template/timesheet-summary-details';
import { TimeSheetSignatureDialog } from './template/timesheet-signature';
import { TimeSheetDetailHeader } from './template/timesheet-detail-header';
import { TimeSheetUpdateSchema, TimeSheetUpdateType } from "./schema/timesheet-schema";

// ----------------------------------------------------------------------
type TimeSheetEditProps = {
   timesheet: TimeSheetDetails
   user?: UserType
   entries: ITimeSheetEntries[]
}

export function TimeSheetEditForm({ timesheet, user, entries }: TimeSheetEditProps ) {
   const router = useRouter();
   const componentTheme = useTheme();
   const searchParams = useSearchParams();
   const pathname = usePathname();
   const signatureDialog = useBoolean();
   const loadingSend = useBoolean();
   const [operatorSignature, setOperatorSignature] = useState<string | null>(null);
   const [clientSignature, setClientSignature] = useState<string | null>(null);
   const [signatureType, setSignatureType ] = useState<string>('');
   const [currentEntry, setCurrentEntry] = useState<ITimeSheetEntries>();
   const queryClient = useQueryClient();
   const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
   const TAB_PARAM = 'worker'

   const TAB_ITEMS = entries.map((entry) => (({
      value: entry.id,
      label: `${entry.worker_first_name} ${entry.worker_last_name}`,
      icon: <Icon width={24} icon="solar:user-id-bold" />,
      onclick: () => {
         setSignatureType('');
         setClientSignature(null);
         setOperatorSignature(null);
         setCurrentEntry(entries.find(en => en.id === entry.id));
      }
   })));
   // set the first value for current tab
   const selectedTab = searchParams.get(TAB_PARAM) ?? entries[0].id;
   if (!currentEntry && entries.length) {
      setCurrentEntry(entries.find(en => en.id === selectedTab))
   }

   const dateValidations = useSetState<{ 
      travel_start: IDatePickerControl, 
      travel_end: IDatePickerControl,
      timesheetDate: IDatePickerControl}>({
      travel_start: dayjs(currentEntry?.travel_start),
      travel_end: dayjs(currentEntry?.travel_end),
      timesheetDate: dayjs(timesheet.timesheet_date)
   });
   
   const { state: currentDateValues, setState: updateValidation } = dateValidations;
   const travelEndError = currentDateValues.travel_start?.isAfter(currentDateValues.travel_end);
   const travelStartError = fIsAfter(currentDateValues.timesheetDate, currentDateValues.travel_start);

   const initialFormValue: TimeSheetUpdateType = {
      travel_start: currentEntry?.travel_start,
      shift_start: currentEntry?.shift_start,
      break_start: currentEntry?.break_start,
      break_end: currentEntry?.break_end,
      shift_end: currentEntry?.shift_end,
      travel_end: currentEntry?.travel_end,
      travel_to_km: currentEntry?.travel_during_km,
      travel_during_km: currentEntry?.travel_during_km,
      travel_from_km: currentEntry?.travel_from_km,
      worker_notes: currentEntry?.worker_notes,
      admin_notes: currentEntry?.admin_notes
   }

   const methods = useForm<TimeSheetUpdateType>({
      mode: 'onSubmit',
      resolver: zodResolver(TimeSheetUpdateSchema),
      defaultValues: initialFormValue,
      values: currentEntry
   });

   const {
      handleSubmit,
      reset,
      setValue,
      formState: { isSubmitting },
   } = methods;

   const onSubmit = handleSubmit(async (data) => {
      const toastId = toast.loading('Updating timesheet...');
      loadingSend.onTrue();
      if (travelEndError || travelStartError) {
         toast.dismiss(toastId);
         toast.error(`Error selected date. Please resolved conflict.`);
         loadingSend.onFalse();
         return;
      }
         
      if (currentEntry?.id) {
         try {
            await fetcher([ `${endpoints.timesheet}/entries/${currentEntry.id}`,
               { method: 'PUT', data },
            ]);
            queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
            queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });
            toast.dismiss(toastId);
            toast.success('Update success!');
            loadingSend.onFalse();
         } catch (error) {
            toast.dismiss(toastId);
            toast.error(`Failed to submit timesheet of ${currentEntry.worker_first_name} ${currentEntry.worker_last_name}`);
            loadingSend.onFalse();
         }
      }
   });

   const renderOperatorSignatureDialog = () => (
      <TimeSheetSignatureDialog dialog={signatureDialog} type={signatureType} onSave={(signature, type) => { 
         if (type === 'operator')
            setOperatorSignature(signature)
         if (type === 'client')
            setClientSignature(signature)
      }}/>
   )

   // Tabs
   const createRedirectPath = (currentPath: string, query: string) => {
      const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
      return query ? `${currentPath}?${queryString}` : currentPath;
   };

   // Loading component for Suspense fallback
   const TabLoadingFallback = () => (
      <Box sx={{ p: 3 }}>
         <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
         <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
         <Skeleton variant="rectangular" height={100} />
      </Box>
   );

   const handleCancel = useCallback(() => {
      router.push(paths.schedule.timesheet.root)
   }, [router]);

   // Reset form when currentUser changes
   useEffect(() => {
      if (currentEntry) {
         const normalizedValues = normalizeFormValues(currentEntry);
         reset(normalizedValues);
      }
   }, [currentEntry, reset]);

   const handleTravelStartTime = useCallback((newValue: IDatePickerControl) => {
      if (newValue) {
         const value = newValue?.toISOString();
         setValue('travel_start', value);
         updateValidation({ travel_start: newValue });
      }
   },[updateValidation]);

   const handleTravelEndTime = useCallback((newValue: IDatePickerControl) => {
      const value = newValue?.toISOString();
      setValue('travel_end', value);
      updateValidation({ travel_end: newValue });
   }, [updateValidation]);

   return(
     <>
      <Form
         methods={methods} onSubmit={onSubmit}
      >
         <Tabs value={selectedTab}>
         {TAB_ITEMS.map((tab) => (
         <Tab
               component={RouterLink}
               key={tab.value}
               value={tab.value}
               icon={tab.icon}
               label={tab.label}
               href={createRedirectPath(pathname, tab.value)}
               onClick={tab.onclick}
            />
            ))}
         </Tabs>
         
         <Suspense fallback={<TabLoadingFallback />}>
            {selectedTab !== '' && currentEntry && (
            <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
               {/* Timesheet detail header section */}
               <TimeSheetDetailHeader 
                  job_number={Number(timesheet.job_number)}
                  company_name={timesheet.company_name}
                  full_address=''
                  client_name={timesheet.client_name}
                  worker_name={`${currentEntry?.worker_first_name} ${currentEntry?.worker_last_name}`}
                  approver_name={`${timesheet.manager_first_name} ${timesheet.manager_last_name}`}
               />

               {/* Time Summary Section */}
               
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
                        <TimeSummaryHeader 
                           hours={currentEntry?.total_work_minutes}
                           header="Travel Details"
                           details="Total Minutes Travel Duration"
                        />
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
                              label="Date Time"
                              slotProps={{ inputLabel: { shrink: true } }}
                              disabled
                              value={currentDateValues.timesheetDate?.format('DD/MM/YYYY HH:mm a')}
                           />

                           <Field.MobileDateTimePicker
                              name="travel_start"
                              label="Travel Start Date/Time"
                              onChange={handleTravelStartTime}
                              slotProps={{
                                 textField: {
                                    fullWidth: true,
                                    error: travelStartError,
                                    helperText: travelStartError ? 'Travel start time should later than current timesheet date' : null,
                                 },
                              }}
                           />

                           <Field.MobileDateTimePicker
                              name="travel_end"
                              label="Travel End Date/Time"
                              onChange={handleTravelEndTime}
                              slotProps={{
                                 textField: {
                                    fullWidth: true,
                                    error: travelEndError,
                                    helperText: travelEndError ? 'Travel end time should later than travel start time' : null,
                                 },
                              }}
                           />
                        </Box>
                        
                        <TimeSummaryHeader 
                           hours={currentEntry?.shift_total_minutes}
                           header="Shift Details"
                           details="Total Shift Duration (Excluded break hours)"
                        />
                        <Box
                           sx={{
                              p: 3,
                              gap: 2,
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                           }}
                        >
                           <Field.MobileDateTimePicker
                              name="shift_start"
                              label="Shift Start Date/Time"
                              value={currentEntry?.shift_start ? dayjs(currentEntry.shift_start) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="break_start"
                              label="Break Start Date/Time"
                              value={currentEntry?.break_start ? dayjs(currentEntry.break_start) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="break_end"
                              label="Break End Date/Time"
                              value={currentEntry?.break_end ? dayjs(currentEntry.break_end) : null}
                           />

                           <Field.MobileDateTimePicker
                              name="shift_end"
                              label="Shift End Date/Time"
                              onChange={(event) => {
                                 const value = event?.toISOString();
                                 setValue('shift_end', value);
                              }}
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
                              name="travel_to_km"
                              label="Travel To"
                              type="number"
                              placeholder="0.00 KM"
                              slotProps={{ inputLabel: { shrink: true } }}
                           />
                        <Field.Text
                           fullWidth
                           name="travel_from_km"
                           label="Travel From"
                           type="number"
                           slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <Field.Text
                           fullWidth
                           name="travel_during_km"
                           label="Travel During"
                           type="number"
                           slotProps={{ inputLabel: { shrink: true } }}
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
                                    (currentEntry.job_worker_status === TimeSheetStatus.DRAFT && 'secondary') ||
                                    (currentEntry.job_worker_status === TimeSheetStatus.SUBMITTED && 'info') ||
                                    (currentEntry.job_worker_status === TimeSheetStatus.APPROVED && 'success') ||
                                    (currentEntry.job_worker_status === TimeSheetStatus.REJECTED && 'error') ||
                                    'default'
                                 }
                                 >
                                 {currentEntry.job_worker_status?.toUpperCase()}
                              </Label>
                           </Typography>
                        </Box>
                        <Box 
                           // sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, width: 1 }}
                           sx={{
                              mb: 1,
                              gap: 2,
                              display: 'flex',
                              width: 1,
                              alignItems: 'center',
                              flexDirection: { xs: 'column', sm: 'row' },
                           }}
                        >
                           <Field.Text
                              fullWidth
                              name="date"
                              label="Submitted At"
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={fDate(timesheet.timesheet_date)}
                              disabled
                           />
                           <Field.Text
                              fullWidth
                              name="date"
                              label="Approved At"
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={fDate(timesheet.timesheet_date)}
                              disabled
                           />
                        </Box>
                        <Box 
                           sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, width: 1, flexDirection: { xs: 'column', md: 'row'} }}
                        >
                           {operatorSignature && (
                              <Box
                                 sx={{
                                    border: 1,
                                    borderStyle: 'dashed',
                                    borderRadius: 1,
                                    height: 130,
                                    width: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                  }}
                                  
                                 >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                       <Typography variant="caption" sx={{  color: componentTheme.palette.text.disabled }}>
                                       Operator Sign Off
                                       </Typography>
                                          <IconButton 
                                             color='error'
                                             onClick={() => {
                                                setOperatorSignature(null)
                                             }}
                                          >
                                          <Iconify icon="carbon:close" sx={{ width: 15, height: 15}}/>
                                       </IconButton>
                                    </Box>
                                    <Box
                                      component="img"
                                       src={operatorSignature}
                                       alt="Operator Signature"
                                       sx={{ display: 'flex', alignContent: 'center', maxHeight: 80, width: '100%', objectFit: 'contain'}}
                                    />
                              </Box>
                           )}
                           
                           {!operatorSignature && (
                              <Box
                                 sx={{
                                    border: 1,
                                    borderStyle: 'dashed',
                                    borderRadius: 1,
                                    height: 130,
                                    width: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                  }}
                                 >
                                    <Typography variant="caption" sx={{  color: componentTheme.palette.text.disabled }}>
                                       Operator Sign Off
                                    </Typography>
                                    <IconButton 
                                          color='primary'
                                          sx={{
                                             mr: 1
                                          }}
                                          onClick={() => {
                                             setSignatureType('operator');
                                             signatureDialog.onTrue()
                                          }}
                                       >
                                       <Iconify icon="solar:pen-bold" />
                                    </IconButton>
                              </Box>
                           )}

                           {clientSignature && (
                              <Box
                                 sx={{
                                    border: 1,
                                    borderStyle: 'dashed',
                                    borderRadius: 1,
                                    height: 130,
                                    width: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                  }}
                                  
                                 >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                       <Typography variant="caption" sx={{  color: componentTheme.palette.text.disabled }}>
                                       Operator Sign Off
                                       </Typography>
                                          <IconButton 
                                             color='error'
                                             onClick={() => {
                                                setClientSignature(null)
                                             }}
                                          >
                                          <Iconify icon="carbon:close" sx={{ width: 15, height: 15}}/>
                                       </IconButton>
                                    </Box>
                                    <Box
                                      component="img"
                                       src={clientSignature}
                                       alt="Operator Signature"
                                       sx={{ display: 'flex', alignContent: 'center', maxHeight: 80, width: '100%', objectFit: 'contain'}}
                                    />
                              </Box>
                           )}

                           {!clientSignature && (
                              <Box
                                 sx={{
                                    border: 1,
                                    borderStyle: 'dashed',
                                    borderRadius: 1,
                                    height: 130,
                                    width: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                  }}
                                 >
                                    <Typography variant="caption" sx={{  color: componentTheme.palette.text.disabled }}>
                                       Client Sign Off
                                    </Typography>
                                    <IconButton 
                                          color='primary'
                                          sx={{
                                             mr: 1
                                          }}
                                          onClick={() => {
                                             setSignatureType('client');
                                             signatureDialog.onTrue()
                                          }}
                                       >
                                       <Iconify icon="solar:pen-bold" />
                                    </IconButton>
                              </Box>
                           )}
                        </Box>
                     </Box>
                  </Stack>
               </Stack>
            </Card>
            )}
         </Suspense>
         <Box
            sx={{
               mt: 3,
               gap: 2,
               display: 'flex',
               justifyContent: 'flex-end',
            }}
         >
            <Button
               variant="outlined"
               onClick={handleCancel}
            >
               Cancel
            </Button>
            <Button
               variant="contained"
               type='submit'
               loading={loadingSend.value && isSubmitting}
               disabled={currentEntry?.job_worker_status === TimeSheetStatus.SUBMITTED}
            > 
               Submit
            </Button>
         </Box>
      </Form>
      {renderOperatorSignatureDialog()}
     </>
   );
}

