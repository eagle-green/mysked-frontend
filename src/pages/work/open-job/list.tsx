import Container from '@mui/material/Container';

import { DashboardContent } from 'src/layouts/dashboard';

import { OpenJobListView } from 'src/sections/work/open-job/view';

// ----------------------------------------------------------------------

export default function OpenJobListPage() {
  return (
    <DashboardContent>
      <Container maxWidth={false}>
        <OpenJobListView />
      </Container>
    </DashboardContent>
  );
}
