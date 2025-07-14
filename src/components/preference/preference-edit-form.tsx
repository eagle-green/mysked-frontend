import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { PreferenceCardItem } from './preference-card-item';
import { PreferenceNewCardForm } from './preference-new-card-form';

// ----------------------------------------------------------------------

type BaseRestriction = {
  id: string;
  reason?: string;
  is_mandatory?: boolean;
  restricted_user: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
    display_name: string;
  };
};

type UserRestriction = BaseRestriction & {
  restricting_user: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
  };
};

type Restriction = BaseRestriction | UserRestriction;

type PreferenceContext = 'client' | 'user' | 'site';

type PreferenceEditFormProps = {
  context: PreferenceContext;
  currentData: any;
  currentId: string;
  sx?: any;
  [key: string]: any;
};

const CONTEXT_CONFIG = {
  client: {
    title: 'Client Work Restrictions',
    addButtonText: 'Add employee',
    emptyMessage: 'No restrictions added yet',
    emptyDescription: '',
    endpoint: endpoints.clientRestrictions,
    queryKey: 'client_restrictions',
    idParam: 'client_id',
  },
  user: {
    title: 'Team Work Restrictions',
    addButtonText: 'Add employee',
    emptyMessage: 'No restrictions added yet',
    emptyDescription: '',
    endpoint: endpoints.userRestrictions,
    queryKey: 'user_restrictions',
    idParam: 'user_id',
  },
  site: {
    title: 'Site Access Restrictions',
    addButtonText: 'Add employee',
    emptyMessage: 'No access restrictions added yet',
    emptyDescription: 'Add restrictions to control which employees can work at this site',
    endpoint: endpoints.siteRestrictions,
    queryKey: 'site_restrictions',
    idParam: 'site_id',
  },
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

export function PreferenceEditForm({
  context,
  currentData,
  currentId,
  sx,
  ...other
}: PreferenceEditFormProps) {
  const openForm = useBoolean();
  const [editingRestriction, setEditingRestriction] = useState<Restriction | null>(null);
  const queryClient = useQueryClient();

  const config = CONTEXT_CONFIG[context];

  // Fetch restrictions
  const { data: restrictionData = [], isLoading } = useQuery({
    queryKey: [config.queryKey, currentId],
    queryFn: async () => {
      if (!currentId) return [];
      const response = await fetcher(`${config.endpoint}?${config.idParam}=${currentId}`);
      return response.data?.[`${context}_restrictions`] || [];
    },
    enabled: !!currentId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetcher([`${config.endpoint}/${id}`, { method: 'DELETE' }]);
    },
    onSuccess: () => {
      toast.success('Restriction removed successfully!');
      queryClient.invalidateQueries({ queryKey: [config.queryKey, currentId] });
    },
    onError: () => {
      toast.error('Failed to remove restriction.');
    },
  });

  const handleEdit = (restriction: Restriction) => {
    setEditingRestriction(restriction);
    openForm.onTrue();
  };

  const handleCloseForm = () => {
    setEditingRestriction(null);
    openForm.onFalse();
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [config.queryKey, currentId] });
    handleCloseForm();
  };

  return (
    <>
      <Card sx={[{ my: 0 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
        <CardHeader
          title={config.title}
          action={
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={openForm.onTrue}
            >
              {config.addButtonText}
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
                {config.emptyMessage}
              </Box>
              {config.emptyDescription && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                  {config.emptyDescription}
                </Typography>
              )}
            </Box>
          ) : (
            // Show actual restriction cards
            restrictionData.map((restriction: any) => (
              <PreferenceCardItem
                key={restriction.id}
                context={context}
                restriction={restriction}
                onDelete={deleteMutation.mutate}
                onEdit={handleEdit}
              />
            ))
          )}
        </Box>
      </Card>

      <Dialog fullWidth maxWidth="xs" open={openForm.value} onClose={handleCloseForm}>
        <DialogTitle>
          {editingRestriction
            ? 'Edit Restriction'
            : `Add ${context === 'site' ? 'Site Restriction' : 'Employee'}`}
        </DialogTitle>

        <DialogContent sx={{ overflow: 'unset' }}>
          <PreferenceNewCardForm
            context={context}
            onSuccess={handleSuccess}
            currentId={currentId}
            onClose={handleCloseForm}
            existingRestrictions={restrictionData}
            isEditMode={!!editingRestriction}
            restrictionId={editingRestriction?.id}
            currentData={
              editingRestriction
                ? {
                    restricted_user_id: editingRestriction.restricted_user.id,
                    reason: editingRestriction.reason || '',
                    is_mandatory: editingRestriction.is_mandatory || false,
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
