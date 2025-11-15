import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { getCategoryColor } from 'src/utils/category-colors';

import { CONFIG } from 'src/global-config';
import { useDeleteUpdate, useGetUpdateById } from 'src/actions/updates';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

const metadata = { title: `Update Details | ${CONFIG.appName}` };

export default function UpdateDetailsPage() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const { data: update, isLoading, error: updateError } = useGetUpdateById(id!);
  const deleteUpdate = useDeleteUpdate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Only show edit/delete buttons for kiwoon@eaglegreen.ca
  const canEditUpdate = user?.email === 'kiwoon@eaglegreen.ca';

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await deleteUpdate.mutateAsync(id);
      toast.success('Update deleted successfully!');
      // Redirect to updates list
      window.location.href = paths.management.updates.list;
    } catch (error) {
      console.error('Error deleting update:', error);
      toast.error('Failed to delete update. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (updateError || !update) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Update Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The update you&apos;re looking for doesn&apos;t exist or has been removed.
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
        heading="Update Details"
        links={[
          { name: 'Management', href: paths.management.root },
          { name: 'Updates', href: paths.management.updates.list },
          { name: 'Details' }
        ]}
        sx={{ mb: 3 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              href={paths.management.updates.list}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              Back to Updates
            </Button>
            {canEditUpdate && (
              <>
                <Button
                  component={RouterLink}
                  href={paths.management.updates.edit(id!)}
                  variant="contained"
                  startIcon={<Iconify icon="solar:pen-bold" />}
                >
                  Edit
                </Button>
                <Button
                  onClick={handleDeleteClick}
                  variant="contained"
                  color="error"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  disabled={deleteUpdate.isPending}
                >
                  {deleteUpdate.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </Stack>
        }
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {update.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {fDate(update.createdAt)}
              </Typography>
            </Stack>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {update.description}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              {update.category?.split(', ').map((category: string, index: number) => (
                <Label 
                  key={index}
                  variant="soft" 
                  color={getCategoryColor(category.trim())}
                >
                  {category.trim()}
                </Label>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Content
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.neutral',
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                overflow: 'hidden', // Prevent horizontal scrolling
                wordBreak: 'break-word', // Break long words
                overflowWrap: 'break-word', // Break words at arbitrary points if needed
                '& *': {
                  maxWidth: '100%', // Ensure all child elements respect container width
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                },
                '& pre, & code': {
                  whiteSpace: 'pre-wrap', // Allow code blocks to wrap
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                },
                '& table': {
                  display: 'block',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <Markdown>{update.content}</Markdown>
            </Box>
          </Box>

        </Stack>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Update</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this update? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteUpdate.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteUpdate.isPending}
          >
            {deleteUpdate.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

UpdateDetailsPage.metadata = metadata;
