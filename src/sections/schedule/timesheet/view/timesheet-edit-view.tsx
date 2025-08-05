import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TimeSheetRecodingFormView } from '../timesheet-edit-form';

// ----------------------------------------------------------------------

export function TimeSheetEditView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Timesheet Details"
        links={[{ name: 'Schedule' }, { name: 'Timesheet' }, { name: 'Details' }]}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="error" component={RouterLink} href={paths.schedule.timesheet.root}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TimeSheetRecodingFormView />
    </DashboardContent>
  );
}
