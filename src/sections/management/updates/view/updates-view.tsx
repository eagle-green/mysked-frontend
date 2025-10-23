import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetUpdates } from 'src/actions/updates';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

export function UpdatesView() {
  const { user } = useAuthContext();
  const { data: updates = [], isLoading } = useGetUpdates();

  // Debug logging

  // Only show create button for kiwoon@eaglegreen.ca
  const canCreateUpdate = user?.email === 'kiwoon@eaglegreen.ca';

  return (
    <Container maxWidth="xl">
      <Stack spacing={5}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Version Updates
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Stay informed about the latest changes and improvements
            </Typography>
          </Box>

          {canCreateUpdate && (
            <Button
              component={RouterLink}
              href={paths.management.updates.create}
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
            >
              Create Update
            </Button>
          )}
        </Box>

        <Card sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Updates List ({updates.length})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Found {updates.length} updates in the system.
              </Typography>
              {updates.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {updates.map((update: any) => (
                    <Box key={update.id} sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {update.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {update.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        By {update.author.name} • {new Date(update.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
