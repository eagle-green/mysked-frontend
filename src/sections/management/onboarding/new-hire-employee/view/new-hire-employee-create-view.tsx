import Container from '@mui/material/Container';

import { NewHireEmployeeInformationForm } from '../new-hire-employee-form';

export function NewHireEmployeeCreateView() {
  return (
    // <DashboardContent>
    //   <CustomBreadcrumbs
    //     heading="New Hire Employee Onboarding"
    //     links={[{ name: 'Management', href: paths.management.root }, { name: 'New Hire Employee' }]}
    //     sx={{ mb: { xs: 3, md: 5 } }}
    //   />

    //   <NewHireEmployeeInformationForm />
    // </DashboardContent>
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <NewHireEmployeeInformationForm />
    </Container>
  );
}
