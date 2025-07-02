import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'src/components/snackbar';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';

import { fetcher, endpoints } from 'src/lib/axios';
import { useBoolean } from 'minimal-shared/hooks';

import { Iconify } from 'src/components/iconify';

import { ClientPreferenceNewCardForm } from './client-preference-new-card-form';
import { ClientPreferenceCardItem } from './client-preference-card-item';

// ----------------------------------------------------------------------

type Props = {
  currentData: any;
  sx?: any;
  [key: string]: any;
};

type EditingRestriction = {
  id: string;
  reason?: string;
  restricted_user: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
    display_name: string;
  };
};

// Skeleton component for loading state
const RestrictionCardSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2.5, width: 1, position: 'relative' }}>
    <Box sx={{ mb: 1, gap: 1, display: 'flex', alignItems: 'center' }}>
      <Skeleton variant="text" width="60%" height={24} />
    </Box>
    <Skeleton variant="text" width="80%" height={20} />
    <Skeleton
      variant="circular"
      width={24}
      height={24}
      sx={{ top: 8, right: 8, position: 'absolute' }}
    />
  </Paper>
);

export function ClientPreferenceEditForm({ currentData, sx, ...other }: Props) {
  const openForm = useBoolean();
  const [editingRestriction, setEditingRestriction] = useState<EditingRestriction | null>(null);
  const queryClient = useQueryClient();

  const currentClientId = currentData?.id;

  // Fetch client restrictions
  const { data: restrictionData = [], isLoading } = useQuery({
    queryKey: ['client_restrictions', currentClientId],
    queryFn: async () => {
      if (!currentClientId) return [];
      const response = await fetcher(
        `${endpoints.clientRestrictions}?client_id=${currentClientId}`
      );
      return response.data?.client_restrictions || [];
    },
    enabled: !!currentClientId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetcher([`${endpoints.clientRestrictions}/${id}`, { method: 'DELETE' }]);
    },
    onSuccess: () => {
      toast.success('Restriction removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['client_restrictions', currentClientId] });
    },
    onError: () => {
      toast.error('Failed to remove restriction.');
    },
  });

  const handleEdit = (restriction: EditingRestriction) => {
    setEditingRestriction(restriction);
    openForm.onTrue();
  };

  const handleCloseForm = () => {
    openForm.onFalse();
    setEditingRestriction(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['client_restrictions', currentClientId] });
  };

  return (
    <>
      <Card sx={[{ my: 0 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
        <CardHeader
          title="Client Work Restrictions"
          action={
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={openForm.onTrue}
            >
              Add employee
            </Button>
          }
        />

        <Box
          sx={{
            p: 3,
            rowGap: 2.5,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
          }}
        >
          {isLoading ? (
            // Show skeleton loading state
            Array.from({ length: 4 }).map((_, index) => <RestrictionCardSkeleton key={index} />)
          ) : restrictionData.length === 0 ? (
            // Show empty state
            <Box
              sx={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <Iconify
                icon="solar:users-group-rounded-bold"
                width={48}
                height={48}
                sx={{ mb: 2, opacity: 0.5 }}
              />
              <Box component="p" sx={{ typography: 'body2' }}>
                No restrictions added yet
              </Box>
            </Box>
          ) : (
            // Show actual restriction cards
            restrictionData.map((restriction: any) => (
              <ClientPreferenceCardItem
                key={restriction.id}
                restriction={{
                  id: restriction.id,
                  reason: restriction.reason,
                  restricted_user: restriction.restricted_user,
                }}
                onDelete={deleteMutation.mutate}
                onEdit={handleEdit}
              />
            ))
          )}
        </Box>
      </Card>

      <Dialog fullWidth maxWidth="xs" open={openForm.value} onClose={handleCloseForm}>
        <DialogTitle> {editingRestriction ? 'Edit Restriction' : 'Add Employee'} </DialogTitle>

        <DialogContent sx={{ overflow: 'unset' }}>
          <ClientPreferenceNewCardForm
            onSuccess={handleSuccess}
            currentClientId={currentClientId}
            onClose={handleCloseForm}
            existingRestrictions={restrictionData}
            isEditMode={!!editingRestriction}
            restrictionId={editingRestriction?.id}
            currentData={
              editingRestriction
                ? {
                    restricted_user_id: editingRestriction.restricted_user.id,
                    reason: editingRestriction.reason || '',
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
