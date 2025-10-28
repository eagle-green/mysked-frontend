import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { InvoicePreviewView } from '../invoice-preview';

//----------------------------------------------------------------------------------------

export function InvoiceEditView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Generate Invoice"
        links={[{ name: 'Management' }, { name: 'Invoice' }, { name: 'Generate' }]}
        // action={
        //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
        //       <IconButton
        //           color='error'
        //           component={RouterLink}
        //           href={paths.schedule.timesheet.root}
        //       >
        //           <Iconify icon="mingcute:close-line" />
        //       </IconButton>
        //     </Box>
        //  }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <InvoicePreviewView />
    </DashboardContent>
  );
}
