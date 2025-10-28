import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UpdateCreateEditForm } from '../update-create-edit-form';

// ----------------------------------------------------------------------

export function UpdateCreateView() {
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Create Update"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Updates', href: paths.management.updates.list },
          { name: 'Create' }
        ]}
        sx={{ mb: 3 }}
      />

      <UpdateCreateEditForm />
    </Container>
  );
}
