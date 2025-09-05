import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FieldLevelRiskAssessment } from '../flra-form';

export function FieldLevelRiskAssessmentFormView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment"
        links={[
          { name: 'My Schedule', href: paths.schedule.root },
          { name: 'Field Level Risk Assessment' },
          { name: 'Form' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <FieldLevelRiskAssessment />
    </DashboardContent>
  );
}
