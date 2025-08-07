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

type PreferenceContext = 'client' | 'user' | 'company' | 'site';

type PreferenceEditFormProps = {
  context: PreferenceContext;
  currentData: any;
  currentId: string;
  preferenceType?: 'preferred' | 'not_preferred';
  sx?: any;
  [key: string]: any;
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
  preferenceType,
  sx,
  ...other
}: PreferenceEditFormProps) {
  const openForm = useBoolean();
  const [editingPreference, setEditingPreference] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get the endpoint key for preferences
  const getPreferenceEndpoint = () => {
    switch (context) {
      case 'company':
        return endpoints.management.companyPreferences;
      case 'client':
        return endpoints.management.clientPreferences;
      case 'user':
        return endpoints.management.userPreferences;
      case 'site':
        return endpoints.management.sitePreference;
      default:
        throw new Error(`Unknown context: ${context}`);
    }
  };

  // Fetch preferences from the separate preference table
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: [`${context}-preferences`, currentId, preferenceType],
    queryFn: async () => {
      if (!currentId) return [];
      const endpoint = getPreferenceEndpoint();
      const params = new URLSearchParams({
        [`${context}_id`]: currentId,
      });
      if (preferenceType) {
        params.append('preference_type', preferenceType);
      }
      const response = await fetcher(`${endpoint}?${params}`);
      return response.data.preferences || [];
    },
    enabled: !!currentId,
  });

  // Fetch ALL preferences (not filtered by type) for the form to check duplicates
  const { data: allPreferences = [] } = useQuery({
    queryKey: [`${context}-all-preferences`, currentId],
    queryFn: async () => {
      if (!currentId) return [];
      const endpoint = getPreferenceEndpoint();
      const params = new URLSearchParams({
        [`${context}_id`]: currentId,
      });
      // Don't filter by preference_type to get all preferences
      const response = await fetcher(`${endpoint}?${params}`);
      return response.data.preferences || [];
    },
    enabled: !!currentId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (preferenceId: string) => {
      const endpoint = getPreferenceEndpoint();
      if (context === 'site') {
        await fetcher([`${endpoint}/${preferenceId}`, { 
          method: 'DELETE',
          data: { preference_type: preferenceType }
        }]);
      } else {
        await fetcher([`${endpoint}/${preferenceId}`, { method: 'DELETE' }]);
      }
    },
    onSuccess: () => {
      toast.success('Preference removed successfully!');
      queryClient.invalidateQueries({ queryKey: [`${context}-preferences`, currentId] });
    },
    onError: () => {
      toast.error('Failed to remove preference.');
    },
  });

  const handleEdit = (preference: any) => {
    setEditingPreference(preference);
    openForm.onTrue();
  };

  const handleDelete = (preferenceId: string) => {
    deleteMutation.mutate(preferenceId);
  };

  const handleCloseForm = () => {
    setEditingPreference(null);
    openForm.onFalse();
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`${context}-preferences`, currentId] });
    handleCloseForm();
  };

  return (
    <>
      <Card sx={[{ my: 0 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
        <CardHeader
          title={`${context.charAt(0).toUpperCase() + context.slice(1)} Preferences`}
          action={
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={openForm.onTrue}
            >
              Add Preference
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
            Array.from({ length: 2 }).map((_, index) => <RestrictionCardSkeleton key={index} />)
          ) : preferences.length === 0 ? (
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
                No preferences set yet
              </Box>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                Add preferences to manage this {context}
              </Typography>
            </Box>
          ) : (
            // Show actual preference cards
            preferences.map((preference: any) => (
              <PreferenceCardItem
                key={preference.id}
                context={context}
                restriction={preference}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </Box>
      </Card>

      <Dialog fullWidth maxWidth="xs" open={openForm.value} onClose={handleCloseForm}>
        <DialogTitle>
          {editingPreference
            ? 'Edit Preference'
            : `Add ${context.charAt(0).toUpperCase() + context.slice(1)} Preference`}
        </DialogTitle>

        <DialogContent sx={{ overflow: 'unset' }}>
          <PreferenceNewCardForm
            context={context}
            onSuccess={handleSuccess}
            currentId={currentId}
            onClose={handleCloseForm}
            existingPreferences={allPreferences}
            isEditMode={!!editingPreference}
            preferenceId={editingPreference?.id}
            currentData={editingPreference}
            entityData={currentData}
            preferenceType={preferenceType}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
