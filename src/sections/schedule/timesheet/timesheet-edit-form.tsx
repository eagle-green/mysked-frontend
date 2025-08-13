
import type { UserType } from 'src/auth/types';
import type { IDatePickerControl } from 'src/types/common';
import type { TimeSheetDetails, ITimeSheetEntries, TimeEntryDateValidators, TimeEntryDateValidatorType } from 'src/types/timesheet';

import dayjs from 'dayjs';
import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useState, Suspense, useEffect, useCallback } from 'react';

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
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { fDate, fIsAfter } from 'src/utils/format-time';
import { normalizeFormValues } from 'src/utils/form-normalize';

import { fetcher, endpoints } from 'src/lib/axios';

import { Label } from "src/components/label";
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { TimeSheetStatus } from 'src/types/timecard';

import { TimeSheetUpdateSchema } from "./schema/timesheet-schema";
import { TimeSummaryHeader } from './template/timesheet-summary-details';
import { TimeSheetSignatureDialog } from './template/timesheet-signature';
import { TimeSheetDetailHeader } from './template/timesheet-detail-header';

import type { TimeSheetUpdateType } from "./schema/timesheet-schema";
// ----------------------------------------------------------------------
type TimeSheetEditProps = {
   timesheet: TimeSheetDetails
   user?: UserType
}

export function TimeSheetEditForm({ timesheet, user }: TimeSheetEditProps ) {
   // navigations
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   // Themes
   const componentTheme = useTheme();
   const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
   // qeury
   const queryClient = useQueryClient();
   // Booleans
   const loadingSend = useBoolean();
   const signatureDialog = useBoolean();
   // states
   const [operatorSignature, setOperatorSignature] = useState<string | null>(null);
   const [clientSignature, setClientSignature] = useState<string | null>(null);
   const [signatureType, setSignatureType ] = useState<string>('');
   const [currentEntry, setCurrentEntry] = useState<ITimeSheetEntries>();
   const [showNote, setShowNote] = useState(false);

   const TAB_PARAM = 'worker'
   const { entries } = timesheet;

   const resetSignatures = () => {
         setSignatureType('');
         setClientSignature(null);
         setOperatorSignature(null);
   }

   const createTabItems = () => entries.map((entry) => (({
      value: entry.id,
      label: `${entry.worker_first_name} ${entry.worker_last_name}`,
      icon: <Icon width={24} icon="solar:user-id-bold" />,
      onclick: () => {
         resetSignatures();
         setCurrentEntry(entries.find(en => en.id === entry.id));
      }
   })));

   const TAB_ITEMS = createTabItems();

   // set the first value for current tab
   const selectedTab = searchParams.get(TAB_PARAM) ?? entries[0].id;
   if (!currentEntry && entries.length) {
      setCurrentEntry(entries.find(en => en.id === selectedTab))
   }
   const toDayjs = (value?: string | Date | null) => dayjs(value);
   const dateValidations = useSetState<TimeEntryDateValidators>({
      travel_start: toDayjs(currentEntry?.travel_start),
      travel_end: toDayjs(currentEntry?.travel_end),
      timesheet_date: toDayjs(timesheet.timesheet_date),
      shift_start: toDayjs(currentEntry?.shift_start),
      shift_end: toDayjs(currentEntry?.shift_end),
      break_end: toDayjs(currentEntry?.break_end),
      break_start: toDayjs(currentEntry?.break_start),
   });
   const { state: currentDateValues, setState: updateValidation } = dateValidations;
   const { travel_end, travel_start, shift_end, shift_start, break_end, break_start, timesheet_date } = currentDateValues;
   const travelEndError = fIsAfter(travel_start, travel_end);
   const travelStartError = fIsAfter(timesheet_date, travel_start);
   const shiftStartError = fIsAfter(timesheet_date, shift_start);
   const shiftEndError = fIsAfter(shift_start, shift_end);
   const breakStartError = fIsAfter(shift_start, break_start) || fIsAfter(break_start, shift_end);
   const breakEndError = fIsAfter(break_start, break_end) || fIsAfter(break_end, shift_end);

   const methods = useForm<TimeSheetUpdateType>({
      mode: 'onSubmit',
      resolver: zodResolver(TimeSheetUpdateSchema),
      defaultValues: {
         travel_start: currentEntry?.travel_start ?? null,
         shift_start: currentEntry?.shift_start ?? null,
         break_start: currentEntry?.break_start ?? null,
         break_end: currentEntry?.break_end ?? null,
         shift_end: currentEntry?.shift_end ?? null,
         travel_end: currentEntry?.travel_end ?? null,
         travel_to_km: currentEntry?.travel_to_km ?? null,
         travel_during_km: currentEntry?.travel_during_km ?? null,
         travel_from_km: currentEntry?.travel_from_km,
         worker_notes: currentEntry?.worker_notes ?? null,
         admin_notes: currentEntry?.admin_notes?? null
      },
      values: currentEntry
   });

   const {
      handleSubmit,
      reset,
      setValue,
      formState: { isSubmitting },
   } = methods;

   const onSubmit = handleSubmit(async (data: TimeSheetUpdateType) => {
      if (travelEndError || travelStartError || shiftStartError || shiftEndError || breakEndError || breakStartError ) {
         toast.error('Error: Conflicting date fields. Please resolve before submitting.');
         return;
      }

      if (!currentEntry?.id) return;

      const toastId = toast.loading('Updating timesheet...');
      loadingSend.onTrue();

      try {
         const response = await fetcher([
         `${endpoints.timesheet.list}/entries/${currentEntry.id}`,
         { method: 'PUT', data },
         ]);

         // Invalidate related queries
         queryClient.invalidateQueries({ queryKey: ['timesheet-detail-query', timesheet.id] });
         queryClient.invalidateQueries({ queryKey: ['timesheet-list-query'] });

         toast.success(response?.message ?? 'Timesheet updated successfully.');
      } catch {
         const fullName = `${currentEntry.worker_first_name} ${currentEntry.worker_last_name}`.trim();
         toast.error(`Failed to update timesheet for ${fullName}`);
      } finally {
         toast.dismiss(toastId);
         loadingSend.onFalse();
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

   // Reset form when current enrty change
   useEffect(() => {
      if (currentEntry) {
         const normalizedValues = normalizeFormValues(currentEntry);
         updateValidation({
            travel_start: toDayjs(currentEntry?.travel_start),
            travel_end: toDayjs(currentEntry?.travel_start),
            timesheet_date: toDayjs(timesheet.timesheet_date),
            shift_start: toDayjs(currentEntry?.shift_start),
            shift_end: toDayjs(currentEntry?.shift_end),
            break_end: toDayjs(currentEntry?.break_end),
            break_start: toDayjs(currentEntry?.break_start),
         });
         setShowNote(Boolean(currentEntry?.worker_notes));
         reset(normalizedValues);
      }
   }, [currentEntry, reset, timesheet.timesheet_date, updateValidation]);
   
   useEffect(() => {
      if(timesheet) {
         setCurrentEntry(entries.find(en => en.id === selectedTab));
      }
   }, [timesheet, entries, selectedTab])

   // Dynamic Date Change Handler
   const createDateChangeHandler = (key: TimeEntryDateValidatorType) => (newValue: IDatePickerControl) => {
      if (newValue) {
         const value = newValue?.toISOString();
         setValue(key, value);
         updateValidation({ [key]: newValue });
      }
   };

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
                  full_address='Site location not available'
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
                           details="Total Work Duration in minutes"
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
                              value={currentDateValues.timesheet_date?.format('DD/MM/YYYY HH:mm a')}
                           />

                           <Field.MobileDateTimePicker
                              name="travel_start"
                              label="Travel Start Date/Time"
                              onChange={createDateChangeHandler('travel_start')}
                              value={currentDateValues?.travel_start ?? null}
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
                              onChange={createDateChangeHandler('travel_end')}
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
                           details="Total Shift Duration in minutes"
                           break_hours={currentEntry?.break_total_minutes ?? 0}
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
                              onChange={createDateChangeHandler('shift_start')}
                              slotProps={{
                                 textField: {
                                    fullWidth: true,
                                    error: shiftStartError,
                                    helperText: shiftStartError ? 'Shift Start time should later than timesheet date' : null,
                                 },
                              }}
                           />

                           <Field.MobileDateTimePicker
                              name="break_start"
                              label="Break Start Date/Time"
                              onChange={createDateChangeHandler('break_start')}
                              slotProps={{
                                 textField: {
                                    fullWidth: true,
                                    error: breakStartError,
                                    helperText: breakStartError ? 'Break start time should later than shift start' : null,
                                 },
                              }}
                           />

                           <Field.MobileDateTimePicker
                              name="break_end"
                              label="Break End Date/Time"
                              onChange={createDateChangeHandler('break_end')}
                              slotProps={{
                                 textField: {
                                    fullWidth: true,
                                    error: breakEndError,
                                    helperText: breakEndError ? 'Break End time should later than Break start time' : null,
                                 },
                              }}
                           />

                           <Field.MobileDateTimePicker
                              name="shift_end"
                              label="Shift End Date/Time"
                              onChange={createDateChangeHandler('shift_end')}
                              slotProps={{
                                 textField: {
                                    fullWidth: true,
                                    error: shiftEndError,
                                    helperText: shiftEndError ? 'Shift End time should later than shift start date' : null,
                                 },
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
                              Submissions & Approvals
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
               <Divider sx={{ borderStyle: 'dashed' }} />
               <Box sx={{
                  px: 3,
                  py: 2
               }}>
                  {!showNote ? (
                     <Button
                        size="small"
                        color="primary"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={() => setShowNote(true)}
                        sx={{ mt: 2, flexShrink: 0 }}
                     >
                        Add Worker Notes
                     </Button>
                     ) : (
                     <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Field.Text name="worker_notes" label="Worker Notes" multiline rows={4} fullWidth />
                        <Button
                           size="small"
                           color="error"
                           onClick={() => {
                           setValue('worker_notes', ''); // Clear the note content
                           setShowNote(false);
                           }}
                           sx={{ mt: 1 }}
                        >
                           Remove
                        </Button>
                     </Box>
                  )}
               </Box>
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

