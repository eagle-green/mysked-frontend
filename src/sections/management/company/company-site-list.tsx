import type { ISiteItem } from 'src/types/site';
import type { CardProps } from '@mui/material/Card';

import { useState, useCallback } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { SiteNewEditForm } from './site/site-new-edit-form';

// ----------------------------------------------------------------------

type Props = CardProps & {
  companyId: string;
};

// ----------------------------------------------------------------------

export function CompanySiteList({ companyId, sx, ...other }: Props) {
  const menuActions = usePopover();
  const siteDialog = useBoolean();
  const editDialog = useBoolean();
  const confirmDialog = useBoolean();
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedSite, setSelectedSite] = useState<ISiteItem | null>(null);
  const [editingSite, setEditingSite] = useState<ISiteItem | null>(null);

  // Fetch sites for this company
  const {
    data: sites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sites', 'company', companyId],
    queryFn: async () => {
      const response = await fetcher(endpoints.management.site);
      const allSites = response.data.sites || [];
      const filteredSites = allSites.filter((site: ISiteItem) => site.company_id === companyId);
      return filteredSites;
    },
    enabled: !!companyId,
  });

  // Fetch company data for the dialog form
  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.company}/${companyId}`);
      return response.data.company;
    },
    enabled: !!companyId,
  });

  const handleSelectedId = useCallback(
    (event: React.MouseEvent<HTMLElement>, site: ISiteItem) => {
      menuActions.onOpen(event);
      setSelectedSiteId(site.id);
      setSelectedSite(site);
    },
    [menuActions]
  );

  const handleClose = useCallback(() => {
    menuActions.onClose();
    // Don't reset selected site immediately - let the actions handle it
  }, [menuActions]);

  const handleResetSelection = useCallback(() => {
    setSelectedSiteId('');
    setSelectedSite(null);
  }, []);

  const handleEditSite = useCallback(() => {
    if (selectedSite) {
      setEditingSite(selectedSite);
      editDialog.onTrue();
    }
    handleClose();
    // Reset selection after action is completed
    setTimeout(handleResetSelection, 100);
  }, [selectedSite, editDialog, handleClose, handleResetSelection]);

  // Delete mutation
  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const response = await fetcher([`${endpoints.management.site}/${siteId}`, { method: 'DELETE' }]);
      return response;
    },
    onSuccess: () => {
      toast.success('Site deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['sites', 'company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      confirmDialog.onFalse();
      handleResetSelection();
    },
    onError: (deleteError: any) => {
      console.error('Delete site error:', deleteError);
      
      // Extract error message from backend response
      let errorMessage = 'Failed to delete site';
      
      // The axios interceptor transforms the error, so error is already the response data
      if (deleteError?.error) {
        errorMessage = deleteError.error;
      } else if (deleteError?.message) {
        errorMessage = deleteError.message;
      } else if (typeof deleteError === 'string') {
        errorMessage = deleteError;
      }
      
      toast.error(errorMessage);
    },
  });

  const handleDeleteSite = useCallback(() => {
    handleClose();
    confirmDialog.onTrue();
    // Don't reset selection yet - wait for delete confirmation
  }, [handleClose, confirmDialog]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedSiteId) {
      deleteSiteMutation.mutate(selectedSiteId);
    }
  }, [selectedSiteId, deleteSiteMutation]);

  const handleDialogSuccess = useCallback(() => {
    siteDialog.onFalse();
    editDialog.onFalse();
    setEditingSite(null);
    handleResetSelection();
    // The form will invalidate the cache, so the list will refresh automatically
  }, [siteDialog, editDialog, handleResetSelection]);

  const handleEditDialogClose = useCallback(() => {
    editDialog.onFalse();
    setEditingSite(null);
    handleResetSelection();
  }, [editDialog, handleResetSelection]);

  const renderMenuActions = () => (
    <CustomPopover open={menuActions.open} anchorEl={menuActions.anchorEl} onClose={handleClose}>
      <MenuList>
        <MenuItem onClick={handleEditSite}>
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem onClick={handleDeleteSite} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderSiteItem = (site: ISiteItem) => {
    const address = [
      site.unit_number,
      site.street_number,
      site.street_name,
      site.city,
      site.province,
      site.postal_code,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Card
        key={site.id}
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 1,
          position: 'relative',
          boxShadow: 'none',
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ flex: 1, pr: 1 }}>
              <Typography variant="subtitle2" component="div">
                {site.name}
              </Typography>
            </Box>
            <IconButton
              onClick={(event: React.MouseEvent<HTMLElement>) => {
                handleSelectedId(event, site);
              }}
              sx={{ mt: -0.5 }}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>

          {(site.display_address || address) && (
            <Typography variant="body2" color="text.secondary">
              {site.display_address || address}
            </Typography>
          )}
        </Stack>
      </Card>
    );
  };

  const renderAddSiteDialog = () => (
    <Dialog fullWidth maxWidth="md" open={siteDialog.value} onClose={siteDialog.onFalse}>
      <DialogTitle>Add New Site</DialogTitle>
      <DialogContent sx={{ overflow: 'unset' }}>
        {companyData && (
          <SiteNewEditForm
            currentSite={null}
            preSelectedCompany={companyData}
            onSuccess={handleDialogSuccess}
            onCancel={siteDialog.onFalse}
          />
        )}
      </DialogContent>
    </Dialog>
  );

  const renderEditSiteDialog = () => (
    <Dialog fullWidth maxWidth="md" open={editDialog.value} onClose={handleEditDialogClose}>
      <DialogTitle>Edit Site</DialogTitle>
      <DialogContent sx={{ overflow: 'unset' }}>
        {editingSite && companyData && (
          <SiteNewEditForm
            currentSite={editingSite}
            preSelectedCompany={companyData}
            onSuccess={handleDialogSuccess}
            onCancel={handleEditDialogClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <Card sx={sx} {...other}>
        <CardHeader title="Sites" />
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={sx} {...other}>
        <CardHeader title="Sites" />
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">Failed to load sites</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card sx={sx} {...other}>
        <CardHeader
          title="Sites"
          action={
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={siteDialog.onTrue}
            >
              Add site
            </Button>
          }
        />

        {sites.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No sites found for this company
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: 3,
              rowGap: 2.5,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            }}
          >
            {sites.map(renderSiteItem)}
          </Box>
        )}
      </Card>

      {renderMenuActions()}
      {renderAddSiteDialog()}
      {renderEditSiteDialog()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the site{' '}
            <strong>{selectedSite?.name || 'Unknown Site'}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              confirmDialog.onFalse();
              handleResetSelection();
            }}
            color="inherit"
            disabled={deleteSiteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteSiteMutation.isPending}
            startIcon={
              deleteSiteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {deleteSiteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
