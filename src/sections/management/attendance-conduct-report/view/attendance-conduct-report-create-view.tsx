import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { fDate } from 'src/utils/format-time';
import { fetcher, endpoints } from 'src/lib/axios';

// Match Employee List table row: Avatar 32x32, photo_url, first_name initial
function EmployeeAvatar({ user }: { user: any }) {
  const initial = user?.first_name?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <Avatar
      src={user?.photo_url ?? undefined}
      alt={user?.first_name}
      sx={{ width: 32, height: 32 }}
    >
      {initial}
    </Avatar>
  );
}

// ----------------------------------------------------------------------

/** Categories for the create form: same as conduct report tabs + Called in Sick. */
const CREATE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'noShowUnpaid', label: 'No Show (Unpaid)' },
  { value: 'calledInSick', label: 'Called in Sick' },
  { value: 'sentHomeNoPpe', label: 'Sent home from site (No PPE)' },
  { value: 'leftEarlyNoNotice', label: 'Left Early No Notice' },
  { value: 'lateOnSite', label: 'Late on Site' },
  { value: 'vacationDayUnpaid', label: 'Vacation Day (Unpaid)' },
  { value: 'sickLeaveUnpaid', label: 'Sick Leave (Unpaid)' },
  { value: 'personalDayOffUnpaid', label: 'Personal Day Off (Unpaid)' },
  { value: 'vacationDay10', label: 'Vacation Day (10)' },
  { value: 'sickLeave5', label: 'Sick Leave (5)' },
  { value: 'refusalOfShifts', label: 'Refusal of shift' },
  { value: 'unapprovedDaysOffShortNotice', label: 'Unapproved Days Off / Short Notice' },
  { value: 'unauthorizedDriving', label: 'Unauthorized Driving' },
  { value: 'drivingInfractions', label: 'Driving Infractions' },
  { value: 'unapprovePayoutWithoutDayOff', label: 'Unapprove Payout without day Off' },
  { value: 'verbalWarningsWriteUp', label: 'Verbal Warnings / Write Up' },
];

const JOB_SEARCH_CATEGORIES = ['noShowUnpaid', 'calledInSick', 'lateOnSite'];

// ----------------------------------------------------------------------

export function AttendanceConductReportCreateView() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ value: string; label: string } | null>(null);
  const [searchAllJobs, setSearchAllJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [memoReason, setMemoReason] = useState('');
  const [arrivedAtSiteTime, setArrivedAtSiteTime] = useState<Dayjs | null>(null);
  const [arrivedTimePickerOpen, setArrivedTimePickerOpen] = useState(false);

  const categoryValue = selectedCategory?.value ?? '';
  const showJobSearch = JOB_SEARCH_CATEGORIES.includes(categoryValue);
  const isLateOnSite = categoryValue === 'lateOnSite';

  // Debounce employee search
  const [employeeQueryDebounced, setEmployeeQueryDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setEmployeeQueryDebounced(employeeSearchQuery), 300);
    return () => clearTimeout(t);
  }, [employeeSearchQuery]);

  // Debounce job search input
  useEffect(() => {
    const t = setTimeout(() => setJobSearchQuery(autocompleteInputValue), 300);
    return () => clearTimeout(t);
  }, [autocompleteInputValue]);

  // Fetch employees for autocomplete (same API as Employee List; support both response shapes)
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['users-search', employeeQueryDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '100',
        orderBy: 'first_name',
        order: 'asc',
        status: 'active',
        ...(employeeQueryDebounced.trim() && { search: employeeQueryDebounced.trim() }),
      });
      const response = await fetcher(`${endpoints.management.user}?${params.toString()}`);
      const data = response?.data ?? response;
      const users = data?.users ?? data?.data?.users ?? (Array.isArray(data) ? data : []);
      return Array.isArray(users) ? users : [];
    },
    enabled: true,
  });

  const employeeOptions = Array.isArray(employeesData) ? employeesData : [];

  // Assigned jobs for selected employee (when "Search all jobs" is OFF – same as Add Worker Incident)
  const employeeId = selectedEmployee?.id ?? null;
  const { data: assignedJobsData, isLoading: isLoadingAssignedJobs } = useQuery({
    queryKey: ['worker-assigned-jobs-for-conduct-report', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const [acceptedResponse, completedResponse, pendingResponse] = await Promise.all([
        fetcher(`${endpoints.work.job}/worker/${employeeId}/history?status=accepted&limit=1000`),
        fetcher(`${endpoints.work.job}/worker/${employeeId}/history?status=completed&limit=1000`),
        fetcher(`${endpoints.work.job}/worker/${employeeId}/history?status=pending&limit=1000`),
      ]);
      const acceptedJobs = acceptedResponse?.data?.jobs ?? acceptedResponse?.jobs ?? [];
      const completedJobs = completedResponse?.data?.jobs ?? completedResponse?.jobs ?? [];
      const pendingJobs = pendingResponse?.data?.jobs ?? pendingResponse?.jobs ?? [];
      const jobsMap = new Map();
      [...acceptedJobs, ...completedJobs, ...pendingJobs].forEach((job: any) => {
        const id = job?.job_id ?? job?.id;
        if (id && !jobsMap.has(id)) jobsMap.set(id, job);
      });
      return Array.from(jobsMap.values());
    },
    enabled: showJobSearch && !!employeeId && !searchAllJobs,
  });

  const assignedJobs = Array.isArray(assignedJobsData) ? assignedJobsData : [];

  // Search all jobs by job number (when "Search all jobs" is ON – same as Add Worker Incident)
  const { data: searchedJobsData = [], isLoading: isSearchingJobs } = useQuery({
    queryKey: ['search-jobs-by-number', jobSearchQuery],
    queryFn: async () => {
      const term = jobSearchQuery.replace(/^#/, '').trim();
      if (!term) return [];
      const response = await fetcher(
        `${endpoints.work.job}?search=${encodeURIComponent(term)}&limit=50&rowsPerPage=50`
      );
      return response?.jobs ?? response?.data?.jobs ?? [];
    },
    enabled: showJobSearch && searchAllJobs && jobSearchQuery.trim().length >= 2,
  });

  const searchedJobs = Array.isArray(searchedJobsData) ? searchedJobsData : [];
  const options = searchAllJobs ? searchedJobs : assignedJobs;
  const selectedOption =
    selectedJob && options.some((j: any) => (j.id || j.job_id) === (selectedJob.id || selectedJob.job_id))
      ? selectedJob
      : options.find(
          (j: any) =>
            String(j.id || j.job_id) === String(selectedJob?.id || selectedJob?.job_id)
        ) ?? selectedJob;

  const handleEmployeeChange = (_: any, newValue: any) => {
    setSelectedEmployee(newValue);
    setSelectedCategory(null);
    setSelectedJob(null);
    setAutocompleteInputValue('');
    setJobSearchQuery('');
    setMemoReason('');
  };

  const handleCategoryChange = (_: any, newValue: { value: string; label: string } | null) => {
    setSelectedCategory(newValue);
    if (!newValue || !JOB_SEARCH_CATEGORIES.includes(newValue.value)) {
      setSelectedJob(null);
      setAutocompleteInputValue('');
      setJobSearchQuery('');
      setMemoReason('');
    }
    if (newValue?.value !== 'lateOnSite') {
      setArrivedAtSiteTime(null);
      setArrivedTimePickerOpen(false);
    }
  };

  const handleJobChange = (_: any, newValue: any) => {
    if (newValue && (newValue.id || newValue.job_id)) {
      setSelectedJob(newValue);
      setAutocompleteInputValue(`#${newValue.job_number} - ${fDate(newValue.start_time)}`);
    } else {
      setSelectedJob(null);
      setAutocompleteInputValue('');
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Step 1
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select employee
            </Typography>
            <Autocomplete
          value={selectedEmployee}
          onChange={handleEmployeeChange}
          inputValue={employeeSearchQuery}
          onInputChange={(_, newValue) => setEmployeeSearchQuery(newValue)}
          options={employeeOptions}
          getOptionLabel={(option: any) =>
            [option?.first_name, option?.last_name].filter(Boolean).join(' ').trim() ||
            option?.email ||
            option?.id ||
            ''
          }
          isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
          loading={isLoadingEmployees}
          filterOptions={(opts, state) => {
            const q = (state.inputValue ?? '').trim().toLowerCase();
            if (!q) return opts;
            return opts.filter(
              (o: any) =>
                [o?.first_name, o?.last_name, o?.email].filter(Boolean).join(' ').toLowerCase().includes(q)
            );
          }}
          renderOption={(props, option: any) => {
            const { key, ...rest } = props as any;
            const name = [option?.first_name, option?.last_name].filter(Boolean).join(' ').trim() || option?.email || '';
            return (
              <Box component="li" key={option.id} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmployeeAvatar user={option} />
                <Typography variant="body2">{name}</Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Employee"
              placeholder="Search by name or email..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    {selectedEmployee ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                        <EmployeeAvatar user={selectedEmployee} />
                      </Box>
                    ) : null}
                    {params.InputProps?.startAdornment}
                  </>
                ),
              }}
            />
          )}
            />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Step 2
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select category
            </Typography>
            <Autocomplete
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={CREATE_CATEGORIES}
              getOptionLabel={(option) => (typeof option === 'object' && option?.label) || ''}
              isOptionEqualToValue={(option, value) => option?.value === value?.value}
              disabled={!selectedEmployee}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  placeholder="Select category..."
                  helperText={!selectedEmployee ? 'Select an employee first' : undefined}
                />
              )}
            />
          </Card>
        </Grid>
      </Grid>

      {showJobSearch && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Job & details
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={searchAllJobs}
                  onChange={(e) => {
                    setSearchAllJobs(e.target.checked);
                    setJobSearchQuery('');
                    setSelectedJob(null);
                    setAutocompleteInputValue('');
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Search all jobs
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Enable to search jobs even if worker was removed
                  </Typography>
                </Box>
              }
            />

            <Autocomplete
              value={selectedOption || null}
              options={
                selectedJob && !options.some((j: any) => (j.id || j.job_id) === (selectedJob?.id || selectedJob?.job_id))
                  ? [selectedJob, ...options]
                  : options
              }
              getOptionLabel={(option: any) =>
                option?.job_number ? `#${option.job_number} - ${fDate(option.start_time)}` : ''
              }
              isOptionEqualToValue={(option: any, value: any) =>
                String(option?.id || option?.job_id) === String(value?.id || value?.job_id)
              }
              inputValue={autocompleteInputValue}
              onInputChange={(_, newInputValue) => setAutocompleteInputValue(newInputValue)}
              onChange={handleJobChange}
              loading={searchAllJobs ? isSearchingJobs : isLoadingAssignedJobs}
              filterOptions={(opts, state) => {
                if (searchAllJobs) return opts;
                const q = (state.inputValue ?? '').trim().toLowerCase();
                if (!q) return opts;
                return opts.filter((option: any) => {
                  const label = option?.job_number
                    ? `#${option.job_number} - ${fDate(option.start_time)}`
                    : '';
                  return label.toLowerCase().includes(q);
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Job Number"
                  placeholder={
                    searchAllJobs
                      ? 'Type job number to search... (min 2 characters)'
                      : 'Search job...'
                  }
                  helperText={
                    searchAllJobs
                      ? 'Type at least 2 characters to search all jobs'
                      : 'Select from jobs where this worker is assigned (accepted, completed, or pending)'
                  }
                />
              )}
            />

            {isLateOnSite && (
              <TimePicker
                label="Arrived at site"
                value={arrivedAtSiteTime}
                onChange={(newValue) => setArrivedAtSiteTime(newValue)}
                open={arrivedTimePickerOpen}
                onOpen={() => setArrivedTimePickerOpen(true)}
                onClose={() => setArrivedTimePickerOpen(false)}
                format="h:mm a"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: 'Set what time the employee arrived at the site',
                    placeholder: 'Select time',
                    onClick: () => setArrivedTimePickerOpen(true),
                    InputProps: {
                      readOnly: true,
                    },
                  },
                  actionBar: {
                    actions: ['accept', 'cancel', 'clear'],
                  },
                }}
              />
            )}

            <TextField
              label="Memo / Reason"
              value={memoReason}
              onChange={(e) => setMemoReason(e.target.value)}
              multiline
              rows={4}
              placeholder="Enter memo or reason..."
              helperText="Add any notes or details"
              fullWidth
            />
          </Stack>
        </Card>
      )}

      {selectedCategory && !showJobSearch && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Step 3
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For &quot;{selectedCategory.label}&quot;, additional fields can be added here later.
          </Typography>
        </Card>
      )}
    </Stack>
  );
}
