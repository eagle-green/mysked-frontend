
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetUpdateById } from 'src/actions/updates';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { UpdateCreateEditForm } from '../update-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function UpdateEditView({ id }: Props) {
  const { user } = useAuthContext();
  const { data: update, isLoading, error } = useGetUpdateById(id);

  // Only allow editing for kiwoon@eaglegreen.ca
  const canEditUpdate = user?.email === 'kiwoon@eaglegreen.ca';

  if (!canEditUpdate) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don&apos;t have permission to edit updates.
          </Typography>
          <Button
            component={RouterLink}
            href={paths.management.updates.list}
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Back to Updates
          </Button>
        </Box>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !update) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Update Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The update you&apos;re trying to edit doesn&apos;t exist or has been removed.
          </Typography>
          <Button
            component={RouterLink}
            href={paths.management.updates.list}
            variant="contained"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Back to Updates
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <CustomBreadcrumbs
        heading="Edit Update"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Updates', href: paths.management.updates.list },
          { name: update.title, href: paths.management.updates.details(id) },
          { name: 'Edit' }
        ]}
        sx={{ mb: 3 }}
        action={
          <Button
            component={RouterLink}
            href={paths.management.updates.details(id)}
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Cancel
          </Button>
        }
      />

      <UpdateCreateEditForm
        currentUpdate={update}
        isEdit
      />
    </Container>
  );
}