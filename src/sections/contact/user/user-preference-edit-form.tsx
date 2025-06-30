import type { IUser } from 'src/types/user';
import type { CardProps } from '@mui/material/Card';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { useQuery, useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { UserPreferenceCardItem } from 'src/components/user/user-preference-card-item';
import { UserPreferenceNewCardForm } from 'src/components/user/user-preference-new-card-form';

// ----------------------------------------------------------------------

type Props = CardProps & {
  currentData: IUser;
};

type EditingRestriction = {
  id: string;
  restricted_user_id: string;
  restricted_user_name: string;
  reason?: string;
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

export function UserPreferenceEditForm({ currentData, sx, ...other }: Props) {
  const openForm = useBoolean();
  const currentUserId = currentData.id;
  const [editingRestriction, setEditingRestriction] = useState<EditingRestriction | null>(null);

  // Fetch restrictions
  const {
    data: userRestrictionListData,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['user_restrictions', currentUserId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.userRestrictions}?user_id=${currentUserId}`);
      return response.data.user_restrictions;
    },
  });
  const restrictionData = userRestrictionListData ?? [];

  // Delete handler
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetcher([`${endpoints.userRestrictions}/${id}`, { method: 'DELETE' }]);
    },
    onSuccess: () => {
      toast.success('Removed!');
      refetch();
    },
    onError: () => {
      toast.error('Failed to remove. Please try again.');
    },
  });

  const handleEdit = (restriction: EditingRestriction) => {
    setEditingRestriction(restriction);
    openForm.onTrue();
  };

  const handleCloseForm = () => {
    setEditingRestriction(null);
    openForm.onFalse();
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  return (
    <>
      <Card sx={[{ my: 0 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
        <CardHeader
          title="Do Not Work With"
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
              <UserPreferenceCardItem
                key={restriction.id}
                restriction={{
                  id: restriction.id,
                  restricted_user_id: restriction.restricted_user_id,
                  restricted_user_name: restriction.restricted_user_name || '',
                  reason: restriction.reason,
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
          <UserPreferenceNewCardForm
            onSuccess={handleSuccess}
            currentUserId={currentUserId}
            onClose={handleCloseForm}
            existingRestrictions={restrictionData}
            isEditMode={!!editingRestriction}
            restrictionId={editingRestriction?.id}
            currentData={
              editingRestriction
                ? {
                    restricted_user_id: editingRestriction.restricted_user_id,
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
