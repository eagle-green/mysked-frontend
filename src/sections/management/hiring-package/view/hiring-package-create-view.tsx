import { PDFViewer, Document } from '@react-pdf/renderer';

import Card from '@mui/material/Card';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { HiringPackageForm } from '../hiring-package-form';
import HiringPackagePdfTemplate from '../template/hiring-package-template';

//--------------------------------------------------------------------------------------------

export function HiringPackageCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Hiring Package"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Hiring Package List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* <PDFViewer width="100%" height="1000" showToolbar>
        <HiringPackagePdfTemplate />
      </PDFViewer> */}

      <HiringPackageForm />
    </DashboardContent>
  );
}
