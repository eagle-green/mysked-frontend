
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetTimeOffRequest } from 'src/actions/timeOff';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { WorkerTimeOffNewEditForm } from '../worker-time-off-new-edit-form';

// ----------------------------------------------------------------------

export function WorkerTimeOffEditView() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { timeOffRequest, timeOffRequestLoading, timeOffRequestError } = useGetTimeOffRequest(
    id || ''
  );

  const handleCancel = () => {
    router.push(paths.schedule.timeOff.list);
  };

  // Show loading state
  if (timeOffRequestLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  // Show error state
  if (timeOffRequestError || !timeOffRequest) {
    return (
      <DashboardContent>
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="error">
            Time-off request not found or you don&apos;t have permission to edit it.
          </Typography>
          <Button variant="contained" onClick={handleCancel} sx={{ mt: 2 }}>
            Back to List
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  // Show message if request is not pending
  if (timeOffRequest.status !== 'pending') {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Time Off Request"
          links={[
            { name: 'My Schedule', href: paths.schedule.root },
            { name: 'Time Off Request', href: paths.schedule.timeOff.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Cannot Edit{' '}
            {timeOffRequest.status.charAt(0).toUpperCase() + timeOffRequest.status.slice(1)} Request
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Only pending requests can be edited. This request has already been{' '}
            {timeOffRequest.status}.
          </Typography>
          <Button variant="contained" onClick={handleCancel}>
            Back to List
          </Button>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Time Off Request"
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'Time Off Request', href: paths.schedule.timeOff.list },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <WorkerTimeOffNewEditForm currentTimeOff={timeOffRequest} isEdit />
    </DashboardContent>
  );
}
