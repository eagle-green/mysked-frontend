import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CreateIncidentReportForm } from 'src/sections/schedule/incident-report/incident-report-create-form';

export function AdminCreateIncidentReportView() {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobSearchInput, setJobSearchInput] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobOption, setJobOption] = useState<'select' | 'none'>('select');

  // Debounce search query updates (300ms delay like table search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setJobSearchQuery(jobSearchInput);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [jobSearchInput]);

  // Fetch jobs for autocomplete
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs-for-incident-report', jobSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '50',
        orderBy: 'start_time',
        order: 'desc',
        ...(jobSearchQuery && { search: jobSearchQuery }),
      });
      const response = await fetcher(`${endpoints.work.job}?${params.toString()}`);
      // Response structure: { data: { jobs: [...], pagination: {...} } }
      return response.data?.jobs || [];
    },
    enabled: jobSearchQuery.trim().length >= 2,
  });

  const jobs = Array.isArray(jobsData) ? jobsData : [];

  const handleJobSelect = async (job: any) => {
    // Fetch full job details including workers
    try {
      const response = await fetcher(`${endpoints.work.job}/${job.id}`);
      setSelectedJob(response.data?.job || job);
    } catch (error) {
      console.error('Error fetching job details:', error);
      // Fallback to the job from autocomplete if fetch fails
      setSelectedJob(job);
    }
  };

  const handleBack = () => {
    router.push(paths.work.job.incident_report.list);
  };

  const handleContinue = () => {
    if (jobOption === 'select' && selectedJob) {
      // Job selected, proceed to form
      return;
    } else if (jobOption === 'none') {
      // No job, proceed to form
      return;
    }
  };

  const canContinue = 
    (jobOption === 'select' && selectedJob) ||
    jobOption === 'none';

  if (selectedJob || jobOption === 'none') {
    // Create a mock job object for the form if no job is selected
    const formJob = selectedJob || {
      id: null,
      job_number: null,
      workers: [],
    };

    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Add Incident Report"
          links={[
            { name: 'Work Management' },
            { name: 'Incident Report' },
            { name: 'Add Incident Report' },
            ...(selectedJob ? [{ name: `Job #${selectedJob.job_number}` }] : []),
          ]}
          action={
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => {
                setSelectedJob(null);
                setJobOption('select');
              }}
            >
              Back
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <CreateIncidentReportForm 
          job={formJob} 
          workers={selectedJob?.workers || []}
          manualJobNumber={null}
          redirectPath={`${paths.work.job.incident_report.list}?status=pending`}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
        <CustomBreadcrumbs
          heading="Add Incident Report"
          links={[
            { name: 'Work Management' },
            { name: 'Incident Report' },
            { name: 'Add Incident Report' },
          ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={handleBack}
          >
            Back
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Job Information</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select how you want to associate this incident report with a job, or create one without a job.
          </Typography>

          <FormControl>
            <FormLabel>Job Association</FormLabel>
            <RadioGroup
              value={jobOption}
              onChange={(e) => {
                setJobOption(e.target.value as 'select' | 'none');
                setSelectedJob(null);
              }}
            >
              <FormControlLabel 
                value="select" 
                control={<Radio />} 
                label="Select job from system" 
              />
              <FormControlLabel 
                value="none" 
                control={<Radio />} 
                label="No job (incident not related to any job)" 
              />
            </RadioGroup>
          </FormControl>

          {jobOption === 'select' && (
          <Autocomplete
            options={Array.isArray(jobs) ? jobs : []}
            loading={isLoadingJobs}
            getOptionLabel={(option) => `Job #${option.job_number}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onInputChange={(_, newValue) => {
              setJobSearchInput(newValue);
            }}
            onChange={(_, newValue) => {
              if (newValue) {
                handleJobSelect(newValue);
              }
            }}
            inputValue={jobSearchInput}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Job"
                placeholder="Search by job number..."
              />
            )}
            noOptionsText={
              jobSearchInput.trim().length < 2
                ? 'Search by job number...'
                : 'No jobs found'
            }
          />
          )}

          {jobOption !== 'select' && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              You can proceed to create an incident report without associating it with any job.
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleBack}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Continue
            </Button>
          </Box>
        </Stack>
      </Card>
    </DashboardContent>
  );
}
