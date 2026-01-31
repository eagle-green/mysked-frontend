import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CreateIncidentReportForm } from 'src/sections/schedule/incident-report/incident-report-create-form';

/**
 * Worker Add Incident Report: same structure as admin create page.
 * Breadcrumb: My Schedule > Incident Report > Add Incident Report.
 * Job list = jobs the current user is assigned to (from /api/works/jobs/user).
 */
export function WorkerAddIncidentReportView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobSearchInput, setJobSearchInput] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobOption, setJobOption] = useState<'select' | 'none'>('select');
  const [proceedWithNoJob, setProceedWithNoJob] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setJobSearchQuery(jobSearchInput);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [jobSearchInput]);

  // Fetch jobs assigned to the current user (worker)
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs-assigned-for-incident-report', jobSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        rowsPerPage: '100',
        orderBy: 'start_time',
        order: 'desc',
        ...(jobSearchQuery && jobSearchQuery.trim() && { search: jobSearchQuery.trim() }),
      });
      const response = await fetcher(`${endpoints.work.job}/user?${params.toString()}`);
      return response.data?.jobs || [];
    },
    staleTime: 60 * 1000,
  });

  const jobs = Array.isArray(jobsData) ? jobsData : [];

  const handleJobSelect = async (job: any) => {
    try {
      const response = await fetcher(`${endpoints.work.job}/${job.id}`);
      setSelectedJob(response.data?.job || job);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setSelectedJob(job);
    }
  };

  const handleBack = () => {
    router.push(paths.schedule.incident_report.list);
  };

  const canContinue =
    (jobOption === 'select' && selectedJob) || jobOption === 'none';

  const handleContinue = () => {
    if (jobOption === 'none') setProceedWithNoJob(true);
  };

  if (selectedJob || (jobOption === 'none' && proceedWithNoJob)) {
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
            { name: 'My Schedule' },
            { name: 'Incident Report' },
            { name: 'Add Incident Report' },
            ...(selectedJob ? [{ name: `Job #${selectedJob.job_number}` }] : []),
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => {
                setSelectedJob(null);
                setJobOption('select');
                setProceedWithNoJob(false);
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
          redirectPath={paths.schedule.incident_report.list}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Add Incident Report"
        links={[
          { name: 'My Schedule' },
          { name: 'Incident Report' },
          { name: 'Add Incident Report' },
        ]}
        action={
          <Button
            variant="contained"
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
            Select a job you are assigned to for this incident report, or create one without a job.
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
              options={jobs}
              loading={isLoadingJobs}
              getOptionLabel={(option) => `Job #${option.job_number}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_, newValue) => setJobSearchInput(newValue)}
              onChange={(_, newValue) => {
                if (newValue) handleJobSelect(newValue);
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
                jobs.length === 0 && !isLoadingJobs
                  ? 'No assigned jobs found'
                  : 'Type to search your assigned jobs'
              }
            />
          )}

          {jobOption !== 'select' && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              You can proceed to create an incident report without associating it with any job.
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              size={isMobile ? 'large' : 'medium'}
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size={isMobile ? 'large' : 'medium'}
              disabled={!canContinue}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </Box>
        </Stack>
      </Card>
    </DashboardContent>
  );
}
