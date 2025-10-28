import type { IUser } from 'src/types/user';

import dayjs from 'dayjs';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import { useForm } from 'react-hook-form';
import timezone from 'dayjs/plugin/timezone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import MenuList from '@mui/material/MenuList';
import { DatePicker } from '@mui/x-date-pickers';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { Dialog, MenuItem, IconButton, DialogTitle, DialogContent, DialogActions, FormHelperText } from '@mui/material';

import { fData } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { uploadUserAsset, deleteUserAsset } from 'src/utils/cloudinary-upload';
import { uploadPdfViaBackend, deleteFileViaBackend } from 'src/utils/backend-storage';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';
import { UploadIllustration } from 'src/assets/illustrations';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type OrientationRecord = {
  id: string;
  user_id: string;
  orientation_type_id: string;
  orientation_type_name: string;
  expiry_date?: string | null;
  document_url?: string | null;
  file_size?: number | null;
  file_name?: string | null;
  created_at: string;
  updated_at: string;
};

type OrientationType = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  currentUser: IUser;
  refetchUser?: () => void;
};

type FormValues = {
  orientation_type_id: string;
  expiry_date: dayjs.Dayjs | null;
  document?: File | null;
};

// FileListItem Component for Orientation Records
type OrientationListItemProps = {
  orientation: OrientationRecord;
  userName?: string;
  onDelete: (orientationId: string, orientationName: string) => void;
  isDeleting: boolean;
};

function OrientationListItem({ orientation, userName, onDelete, isDeleting }: OrientationListItemProps) {
  const menuActions = usePopover();
  // Check for PDF in URL (handle both regular URLs and signed URLs with query params)
  const isPdfFile = orientation.document_url?.toLowerCase().includes('.pdf') || false;
  const hasDocument = !!orientation.document_url;

  const handleBoxClick = (e: React.MouseEvent) => {
    if (!hasDocument) return;
    // Prevent opening if clicking anywhere on the menu button or popover
    const target = e.target as HTMLElement;
    if (target.closest('.menu-button') || target.closest('[role="menu"]') || menuActions.open) {
      return;
    }
    window.open(orientation.document_url!, '_blank');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: 'background.paper',
        cursor: hasDocument ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': hasDocument ? {
          backgroundColor: 'action.hover',
          borderColor: 'primary.main',
        } : {},
      }}
      onClick={handleBoxClick}
    >
      {hasDocument ? (
        isPdfFile ? (
          <Box
            component="img"
            src={`${CONFIG.assetsDir}/assets/icons/files/ic-pdf.svg`}
            sx={{ width: 48, height: 48, flexShrink: 0 }}
          />
        ) : (
          <Box
            component="img"
            src={`${CONFIG.assetsDir}/assets/icons/files/ic-img.svg`}
            sx={{ width: 48, height: 48, flexShrink: 0 }}
          />
        )
      ) : (
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Iconify icon="solar:file-text-bold" width={24} color="text.secondary" />
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {orientation.orientation_type_name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {orientation.file_size && (
            <>
              <Typography variant="caption" color="text.secondary">
                {fData(orientation.file_size)}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                •
              </Typography>
            </>
          )}
          <Typography variant="caption" color="text.secondary">
            {fDateTime(orientation.created_at)}
          </Typography>
        </Stack>
        {orientation.expiry_date && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Expires: {dayjs(orientation.expiry_date).tz('America/Los_Angeles').format('MMM D, YYYY')}
          </Typography>
        )}
      </Box>
      <IconButton
        className="menu-button"
        size="small"
        color={menuActions.open ? 'inherit' : 'default'}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          menuActions.onOpen(e);
        }}
        sx={{ flexShrink: 0 }}
      >
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>

      {/* 3-dot Menu Popover */}
      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {hasDocument && (
            <MenuItem
              onClick={() => {
                menuActions.onClose();
                // Download with custom name
                const downloadName = userName
                  ? `${userName} - ${orientation.orientation_type_name}`
                  : orientation.orientation_type_name;

                fetch(orientation.document_url!)
                  .then((response) => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.blob();
                  })
                  .then((blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${downloadName}.${isPdfFile ? 'pdf' : 'jpg'}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  })
                  .catch((error) => {
                    console.error('Download failed:', error);
                    const link = document.createElement('a');
                    link.href = orientation.document_url!;
                    link.download = `${downloadName}.${isPdfFile ? 'pdf' : 'jpg'}`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  });
              }}
            >
              <Iconify icon="solar:download-bold" />
              Download
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              menuActions.onClose();
              onDelete(orientation.id, orientation.orientation_type_name);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </Box>
  );
}

export function UserOrientationEditForm({ currentUser, refetchUser }: Props) {
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isManagingTypes, setIsManagingTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    orientationId: string | null;
    orientationName: string;
  }>({
    open: false,
    orientationId: null,
    orientationName: '',
  });

  const methods = useForm<FormValues>({
    defaultValues: {
      orientation_type_id: '',
      expiry_date: null,
      document: null,
    },
  });

  const { handleSubmit, reset, watch, setValue } = methods;
  const selectedDate = watch('expiry_date');
  const selectedDocument = watch('document');

  // Fetch orientation types
  const {
    data: orientationTypes,
    isLoading: isLoadingTypes,
  } = useQuery({
    queryKey: ['orientation-types'],
    queryFn: async () => {
      try {
        const response = await axios.get(endpoints.management.orientationTypes);
        return response.data.orientationTypes || [];
      } catch (error) {
        console.error('Error fetching orientation types:', error);
        return [];
      }
    },
  });

  // Fetch orientations for the current user
  const {
    data: orientations,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['user-orientations', currentUser.id],
    queryFn: async () => {
      if (!currentUser.id) return [];
      try {
        const response = await axios.get(`${endpoints.management.orientations}/${currentUser.id}`);
        return response.data.orientations || [];
      } catch (error) {
        console.error('Error fetching orientations:', error);
        return [];
      }
    },
    enabled: !!currentUser.id,
  });

  // Create orientation mutation
  const createOrientation = useMutation({
    mutationFn: async (data: FormValues) => {
      let documentUrl = null;
      let documentPath = null;
      let fileSize = null;
      let fileName = null;

      // Upload document if present
      if (data.document) {
        const file = data.document;
        const isPdf = file.type === 'application/pdf';
        const toastId = toast.loading(`Uploading ${isPdf ? 'PDF' : 'image'}...`);

        // Store file metadata
        fileSize = file.size;
        fileName = file.name;

        try {
          if (isPdf) {
            // Upload PDF to Supabase
            const result = await uploadPdfViaBackend({
              file,
              userId: currentUser.id,
              assetType: 'other_documents',
            });
            documentUrl = result.url; // Signed URL (expires)
            documentPath = result.path; // Path (for refreshing URL)
          } else {
            // Upload image to Cloudinary
            const fileId = `orientation_${Date.now()}`;
            documentUrl = await uploadUserAsset({
              file,
              userId: currentUser.id,
              assetType: 'other_documents',
              customFileName: `orientation_${currentUser.id}_${fileId}`,
            });
            // Cloudinary URLs don't expire, no path needed
          }
          toast.dismiss(toastId);
          toast.success('Document uploaded successfully');
        } catch {
          toast.dismiss(toastId);
          throw new Error('Failed to upload document');
        }
      }

      // Create orientation record with uploaded document URL and path
      const response = await axios.post(endpoints.management.orientations, {
        user_id: currentUser.id,
        orientation_type_id: data.orientation_type_id,
        expiry_date: data.expiry_date ? dayjs(data.expiry_date).format('YYYY-MM-DD') : null,
        document_url: documentUrl,
        document_path: documentPath, // Store path for Supabase files
        file_size: fileSize,
        file_name: fileName,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Orientation added successfully');
      queryClient.invalidateQueries({ queryKey: ['user-orientations', currentUser.id] });
      reset();
      setIsAddingNew(false);
      if (refetchUser) {
        refetchUser();
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add orientation');
    },
  });

  // Delete orientation mutation
  const deleteOrientation = useMutation({
    mutationFn: async (orientationId: string) => {
      // Find the orientation to get its document_url
      const orientation = orientations?.find((o: OrientationRecord) => o.id === orientationId);
      
      // Delete the database record first
      const response = await axios.delete(`${endpoints.management.orientations}/${orientationId}`);
      
      // Then cleanup the document if it exists
      if (orientation?.document_url) {
        try {
          const isCloudinary = orientation.document_url.includes('cloudinary');
          const isSupabase = orientation.document_url.includes('supabase');
          
          if (isCloudinary) {
            // Extract public_id from Cloudinary URL and delete
            const urlParts = orientation.document_url.split('/');
            const fileNameWithExt = urlParts[urlParts.length - 1];
            const fileName = fileNameWithExt.split('.')[0];
            // Call deleteUserAsset with correct parameters: (userId, assetType, customFileName)
            await deleteUserAsset(currentUser.id, 'other_documents', fileName);
          } else if (isSupabase && orientation.document_path) {
            // For Supabase, use the stored document_path
            await deleteFileViaBackend(orientation.document_path, 'user-documents');
          } else if (isSupabase) {
            // Fallback: extract path from URL if document_path is not available
            const urlObj = new URL(orientation.document_url);
            const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+)\?/);
            if (pathMatch) {
              await deleteFileViaBackend(pathMatch[1], 'user-documents');
            }
          }
        } catch (error) {
          console.error('Failed to delete document file:', error);
          // Don't throw - record is already deleted
        }
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Orientation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['user-orientations', currentUser.id] });
      if (refetchUser) {
        refetchUser();
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete orientation');
    },
  });

  // Create orientation type mutation
  const createOrientationType = useMutation({
    mutationFn: async (name: string) => {
      const response = await axios.post(endpoints.management.orientationTypes, { name });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Orientation type added successfully');
      queryClient.invalidateQueries({ queryKey: ['orientation-types'] });
      setNewTypeName('');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add orientation type');
    },
  });

  // Delete orientation type mutation
  const deleteOrientationType = useMutation({
    mutationFn: async (typeId: string) => {
      await axios.delete(`${endpoints.management.orientationTypes}/${typeId}`);
    },
    onSuccess: () => {
      toast.success('Orientation type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['orientation-types'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete orientation type');
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!data.orientation_type_id) {
      toast.error('Please select an orientation type');
      return;
    }
    createOrientation.mutate(data);
  });

  const handleAddOrientationType = () => {
    if (!newTypeName.trim()) {
      toast.error('Please enter an orientation type name');
      return;
    }
    createOrientationType.mutate(newTypeName.trim());
  };

  const handleDelete = (orientationId: string, orientationName: string) => {
    setDeleteConfirmDialog({
      open: true,
      orientationId,
      orientationName,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmDialog.orientationId) {
      deleteOrientation.mutate(deleteConfirmDialog.orientationId);
      setDeleteConfirmDialog({ open: false, orientationId: null, orientationName: '' });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDialog({ open: false, orientationId: null, orientationName: '' });
  };

  const handleDeleteType = async (typeId: string) => {
    if (window.confirm('Are you sure you want to delete this orientation type?')) {
      deleteOrientationType.mutate(typeId);
    }
  };

  const handleCancel = () => {
    reset();
    setIsAddingNew(false);
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Orientation & Training
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage employee orientation and training records. Only administrators can add and
                manage these records.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Supported formats: JPEG, JPG, PNG, or PDF for orientation
                documents. Maximum file size: 5MB. File upload is optional.
              </Typography>
            </Alert>

            {fetchError && (
              <Alert severity="error">
                <Typography variant="body2">
                  Error loading orientations:{' '}
                  {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
                </Typography>
              </Alert>
            )}

            {/* Existing Orientations List */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Orientation Records ({orientations?.length || 0})
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => setIsAddingNew(true)}
                >
                  Add Orientation
                </Button>
              </Stack>

              {isLoading ? (
                <Stack spacing={1}>
                  <Skeleton variant="rectangular" height={76} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={76} sx={{ borderRadius: 1 }} />
                </Stack>
              ) : orientations && orientations.length > 0 ? (
                <Stack spacing={1}>
                  {orientations.map((orientation: OrientationRecord) => (
                    <OrientationListItem
                      key={orientation.id}
                      orientation={orientation}
                      userName={`${currentUser.first_name} ${currentUser.last_name}`}
                      onDelete={handleDelete}
                      isDeleting={deleteOrientation.isPending}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No orientation records found. Click &quot;Add Orientation&quot; to add one.
                </Typography>
              )}
            </Box>
          </Stack>
        </Card>
      </Grid>

      {/* Add Orientation Dialog */}
      <Dialog
        open={isAddingNew}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Orientation</Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<Iconify icon="solar:settings-bold" />}
              onClick={() => {
                setIsAddingNew(false);
                setIsManagingTypes(true);
              }}
            >
              Manage Types
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Field.Select
                name="orientation_type_id"
                label="Orientation Type"
                required
                helperText="Select the type of orientation completed"
                disabled={isLoadingTypes}
              >
                <MenuItem value="">Select orientation type</MenuItem>
                {orientationTypes?.map((type: OrientationType) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <DatePicker
                label="Expiry Date (Optional)"
                value={selectedDate}
                onChange={(newValue) => setValue('expiry_date', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave blank if orientation does not expire',
                  },
                }}
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Upload Document (Optional)
                </Typography>
                <Box sx={{ width: 1, position: 'relative' }}>
                  <input
                    type="file"
                    id="orientation-doc-upload-input"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setValue('document', file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  
                  {/* Show preview if file uploaded, otherwise show drag-and-drop */}
                  {selectedDocument ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        border: '1px dashed',
                        borderColor: 'divider',
                        width: '100%',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {selectedDocument.type.startsWith('image/') ? (
                            <Box
                              component="img"
                              src={URL.createObjectURL(selectedDocument)}
                              alt={selectedDocument.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Box
                              component="img"
                              src={`${CONFIG.assetsDir}/assets/icons/files/ic-pdf.svg`}
                              sx={{ width: 48, height: 48 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {selectedDocument.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fData(selectedDocument.size)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => setValue('document', null)}
                          sx={{ flexShrink: 0 }}
                        >
                          <Iconify icon="mingcute:close-line" />
                        </IconButton>
                      </Stack>
                    </Box>
                  ) : (
                    <Box
                      onClick={() => document.getElementById('orientation-doc-upload-input')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files && files[0]) {
                          setValue('document', files[0]);
                        }
                      }}
                      sx={(theme) => ({
                        p: 5,
                        outline: 'none',
                        borderRadius: 1,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        bgcolor: `rgba(145, 158, 171, 0.08)`,
                        border: `1px dashed rgba(145, 158, 171, 0.2)`,
                        transition: theme.transitions.create(['opacity', 'padding']),
                        '&:hover': { opacity: 0.72 },
                      })}
                    >
                      <UploadIllustration hideBackground sx={{ width: 200 }} />
                      <Box sx={{ display: 'flex', textAlign: 'center', gap: 1, flexDirection: 'column' }}>
                        <Typography variant="h6">Drop or select file</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Drop files here or click to
                          <Box
                            component="span"
                            sx={{
                              mx: 0.5,
                              color: 'primary.main',
                              textDecoration: 'underline',
                            }}
                          >
                            browse
                          </Box>
                          through your machine.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <FormHelperText sx={{ mx: 1.75 }}>
                    Upload orientation certificate or completion document (optional)
                  </FormHelperText>
                </Box>
              </Box>
            </Stack>
          </Form>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={createOrientation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={onSubmit}
            loading={createOrientation.isPending}
          >
            Add Orientation
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Manage Orientation Types Dialog */}
      <Dialog 
        open={isManagingTypes} 
        onClose={() => setIsManagingTypes(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Orientation Types</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {/* Add New Type */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Add New Orientation Type
              </Typography>
              <Stack direction="row" spacing={1}>
                <Box sx={{ flex: 1 }}>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter orientation type name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOrientationType();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleAddOrientationType}
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  Add
                </Button>
              </Stack>
            </Box>

            {/* Existing Types List */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Current Orientation Types ({orientationTypes?.length || 0})
              </Typography>
              {isLoadingTypes ? (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              ) : orientationTypes && orientationTypes.length > 0 ? (
                <Stack spacing={1}>
                  {orientationTypes.map((type: OrientationType) => (
                    <Box
                      key={type.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.neutral',
                      }}
                    >
                      <Typography variant="body2">{type.name}</Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteType(type.id)}
                        disabled={deleteOrientationType.isPending}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No orientation types found. Add one above.
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsManagingTypes(false);
              setIsAddingNew(true);
            }}
          >
            Back to Add Orientation
          </Button>
          <Button variant="contained" onClick={() => setIsManagingTypes(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Orientation?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirmDialog.orientationName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The orientation record and any uploaded documents will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleCancelDelete}
            disabled={deleteOrientation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            loading={deleteOrientation.isPending}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

