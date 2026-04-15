import Container from '@mui/material/Container';

import { NewHireEmployeeInformationForm } from '../new-hire-employee-form';

export function NewHireEmployeeCreateView() {
  return (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <NewHireEmployeeInformationForm />
    </Container>
  );
}
