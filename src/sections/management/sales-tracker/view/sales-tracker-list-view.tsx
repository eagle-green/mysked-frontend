import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function SalesTrackerListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Sales Tracker"
        links={[
          { name: 'Management'  },
          { name: 'Sales Tracker' },
          { name: 'List' },
        ]}
        sx={{ mb: 3 }}
      />
      <Typography variant="body1" color="text.secondary">
        Sales Tracker content will be available here. Access is the same as Invoice (User Access management).
      </Typography>
    </DashboardContent>
  );
}
