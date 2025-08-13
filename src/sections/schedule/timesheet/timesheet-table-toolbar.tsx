import type { ITimeSheetFilter } from 'src/types/timecard';
import type { IDatePickerControl } from 'src/types/common';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { endpoints, fetcher } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

import { IJobTableFilters } from 'src/types/job';

// ----------------------------------------------------------------------

type Props = {
  dateError: boolean;
  onResetPage: () => void;
  filters: UseSetStateReturn<IJobTableFilters>;
};

export function TimeSheetToolBar({ filters, dateError, onResetPage }: Props) {

   // Fetch sites from API
   const { data: sitesData } = useQuery({
      queryKey: ['sites'],
      queryFn: async () => {
         const response = await fetcher(endpoints.management.site);
         return response.data.sites;
      },
   });

   // Fetch clients from API
   const { data: clientsData } = useQuery({
      queryKey: ['clients'],
      queryFn: async () => {
         const response = await fetcher(endpoints.management.client);
         return response.data.clients;
      },
   });

   // Fetch companies from API
   const { data: companiesData } = useQuery({
      queryKey: ['companies'],
      queryFn: async () => {
         const response = await fetcher(endpoints.management.company);
         return response.data.companies;
      },
   });

   const clientOptions = clientsData?.map((client: any) => client.name) || [];
   const companyOptions = companiesData?.map((company: any) => company.name) || [];
   const siteOptions = sitesData?.map((site: any) => site.name) || [];

   const { state: currentFilters, setState: updateFilters } = filters;

   const handleFilterName = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onResetPage();
         updateFilters({ query: event.target.value });
         },
      [onResetPage, updateFilters]
   );

   const handleFilterStartDate = useCallback(
      (newValue: IDatePickerControl) => {
         onResetPage();
         updateFilters({ startDate: newValue });
         },
      [onResetPage, updateFilters]
   );

   const handleFilterEndDate = useCallback(
      (newValue: IDatePickerControl) => {
         onResetPage();
         updateFilters({ endDate: newValue });
         },
      [onResetPage, updateFilters]
   );

   return (
      <>
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: 'flex',
          pr: { xs: 2.5, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
         <Autocomplete
            multiple
            options={companyOptions}
            value={currentFilters.company || []}
            onChange={(event, newValue) => {
               onResetPage();
               updateFilters({ company: newValue });
            }}
            renderInput={(params) => (
               <TextField {...params} label="Company" placeholder="Search company..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => {
               const { key, ...otherProps } = props;
               return (
               <Box component="li" key={key} {...otherProps}>
                  <Checkbox disableRipple size="small" checked={selected} />
                  {option}
               </Box>
               );
            }}
            filterOptions={(options, { inputValue }) => {
               const filtered = options.filter((option) =>
               option.toLowerCase().includes(inputValue.toLowerCase())
               );
               // Remove duplicates while preserving order
               return Array.from(new Set(filtered));
            }}
            sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}
         />

         <Autocomplete
            multiple
            options={siteOptions}
            value={currentFilters.site || []}
            onChange={(event, newValue) => {
               onResetPage();
               updateFilters({ site: newValue });
            }}
            renderInput={(params) => (
               <TextField {...params} label="Site" placeholder="Search site..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => {
               const { key, ...otherProps } = props;
               return (
               <Box component="li" key={key} {...otherProps}>
                  <Checkbox disableRipple size="small" checked={selected} />
                  {option}
               </Box>
               );
            }}
            filterOptions={(options, { inputValue }) => {
               const filtered = options.filter((option) =>
               option.toLowerCase().includes(inputValue.toLowerCase())
               );
               // Remove duplicates while preserving order
               return Array.from(new Set(filtered));
            }}
            sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}
         />

         <Autocomplete
            multiple
            options={clientOptions}
            value={currentFilters.client || []}
            onChange={(event, newValue) => {
               onResetPage();
               updateFilters({ client: newValue });
            }}
            renderInput={(params) => (
               <TextField {...params} label="Client" placeholder="Search client..." />
            )}
            renderTags={() => []}
            renderOption={(props, option, { selected }) => {
               const { key, ...otherProps } = props;
               return (
               <Box component="li" key={key} {...otherProps}>
                  <Checkbox disableRipple size="small" checked={selected} />
                  {option}
               </Box>
               );
            }}
            filterOptions={(options, { inputValue }) => {
               const filtered = options.filter((option) =>
               option.toLowerCase().includes(inputValue.toLowerCase())
               );
               // Remove duplicates while preserving order
               return Array.from(new Set(filtered));
            }}
            sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}
         />

         <DatePicker
            label="Start Date"
            value={currentFilters.startDate}
            onChange={handleFilterStartDate}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{ maxWidth: { md: 180 } }}
         />

         <DatePicker
            label="End Date"
            value={currentFilters.endDate}
            onChange={handleFilterEndDate}
            minDate={currentFilters.startDate || undefined}
            slotProps={{
               textField: {
               fullWidth: true,
               error: dateError,
               helperText: dateError ? 'End date must be later than start date' : null,
               },
            }}
            sx={{
               maxWidth: { md: 180 },
               [`& .${formHelperTextClasses.root}`]: {
               bottom: { md: -40 },
               position: { md: 'absolute' },
               },
            }}
         />

         <Box
            sx={{
               gap: 2,
               width: 1,
               flexGrow: 1,
               display: 'flex',
               alignItems: 'center',
            }}
         >
            <TextField
               fullWidth
               value={currentFilters.query}
               onChange={handleFilterName}
               placeholder="Search timesheet..."
               slotProps={{
               input: {
                  startAdornment: (
                     <InputAdornment position="start">
                     <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                     </InputAdornment>
                  ),
               },
               }}
            />
         </Box>
      </Box>
      </>
   );
}