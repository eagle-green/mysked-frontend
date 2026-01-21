import type { IInventoryItem } from 'src/types/inventory';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { emptyToNull, capitalizeWords } from 'src/utils/foramt-word';

import { fetcher, endpoints } from 'src/lib/axios';

import { useInventoryTypes } from 'src/hooks/use-inventory-types';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { AddInventoryTypeDialog } from 'src/components/inventory/add-inventory-type-dialog';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const INVENTORY_TYPE_FALLBACK_OPTIONS = [
  { value: 'sign', label: 'Sign' },
  { value: 'temporary_urban_barricade', label: 'Temporary Urban Barricade' },
  { value: 'barricade_light', label: 'Barricade Light' },
  { value: 'cone', label: 'Cone' },
  { value: 'delineator', label: 'Delineator' },
  { value: 'drum', label: 'Drum' },
  { value: 'ver_mac_message_board', label: 'Ver-Mac Message Board' },
  { value: 'other', label: 'Other' },
];

const REFLECTIVITY_OPTIONS = [
  { value: '9', label: '9 - Standard BC Reflectivity (Most Common)' },
  { value: '3', label: '3 - Medium Reflectivity' },
  { value: '1', label: '1 - Basic Reflectivity' },
];

const TYPICAL_APPLICATION_OPTIONS = [
  // Most commonly used (appear most frequently in CSV)
  { value: 'Local Road / Low Speed or Arterial', label: 'Local Road / Low Speed or Arterial' },
  { value: 'Expressway or Freeway', label: 'Expressway or Freeway' },
  { value: 'Local Road / Low Speed', label: 'Local Road / Low Speed' },
  { value: 'Arterial', label: 'Arterial' },
  { value: 'Arterial or Expressway', label: 'Arterial or Expressway' },
  { value: 'Expressway', label: 'Expressway' },
  { value: 'Special Application', label: 'Special Application' },
  { value: 'All Roads or Highways', label: 'All Roads or Highways' },
  { value: 'Freeway ONLY', label: 'Freeway ONLY' },
  { value: 'All Road Types', label: 'All Road Types' },
  { value: 'Slow Speed / Bicycle', label: 'Slow Speed / Bicycle' },
  { value: 'Local Road / Low Speed to Freeway', label: 'Local Road / Low Speed to Freeway' },
  { value: 'Freeway', label: 'Freeway' },
  { value: 'Local Road / Low Speed Arterial', label: 'Local Road / Low Speed Arterial' },
  { value: 'Arterial / Expressway', label: 'Arterial / Expressway' },
  { value: 'Freeway / Special Application', label: 'Freeway / Special Application' },
  { value: 'For use in Roundabouts only', label: 'For use in Roundabouts only' },
  { value: 'Local Road to Freeway', label: 'Local Road to Freeway' },
  { value: 'Arterial to Freeway', label: 'Arterial to Freeway' },
  { value: 'Construction Zone / Traffic Control', label: 'Construction Zone / Traffic Control' },
  { value: 'Static, within Rest Areas', label: 'Static, within Rest Areas' },
];

const MOT_APPROVAL_OPTIONS = [
  { value: 'STOE', label: 'STOE' },
];

export type NewInventorySchemaType = zod.infer<typeof NewInventorySchema>;

export const NewInventorySchema = zod.object({
  type: zod.string().min(1, { message: 'Type is required!' }),
  name: zod.string().min(1, { message: 'Name is required!' }),
  sku: zod.string().optional(),
  description: zod.string().optional(),
  quantity: zod.preprocess(
    (val) => (val === '' || val === null ? 0 : val),
    zod.number().min(0, { message: 'Quantity must be 0 or greater' })
  ),
  reorder_point: zod.preprocess(
    (val) => (val === '' || val === null ? 0 : val),
    zod.number().min(0, { message: 'Reorder point must be 0 or greater' })
  ),
  // Sign-specific fields (conditional)
  width_mm: zod.preprocess(
    (val) => (val === '' || val === null ? null : val),
    zod.number().nullable().optional()
  ),
  height_mm: zod.preprocess(
    (val) => (val === '' || val === null ? null : val),
    zod.number().nullable().optional()
  ),
  reflectivity_astm_type: zod.string().optional(),
  mot_approval: zod.string().optional(),
  typical_application: zod.string().optional(),
  lct: zod.boolean().default(false),
  hwy: zod.boolean().default(false),
  // LCT and HWY required quantities for auto-assignment to vehicles
  lct_required_qty: zod.preprocess(
    (val) => (val === '' || val === null ? 0 : val),
    zod.number().min(0, { message: 'LCT required quantity must be 0 or greater' })
  ),
  hwy_required_qty: zod.preprocess(
    (val) => (val === '' || val === null ? 0 : val),
    zod.number().min(0, { message: 'HWY required quantity must be 0 or greater' })
  ),
  billable: zod.boolean().default(false),
  // Image upload (handled separately, not in schema)
});

// ----------------------------------------------------------------------

type Props = {
  currentData?: IInventoryItem;
};

export function InventoryNewEditForm({ currentData }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useBoolean();
  const [isDeleting, setIsDeleting] = useState(false);
  const [addTypeDialogOpen, setAddTypeDialogOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
    currentData?.cover_url || currentData?.coverUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(currentData?.cover_url || currentData?.coverUrl || null);
  const { data: inventoryTypesData = [] } = useInventoryTypes();
  const inventoryTypes = Array.isArray(inventoryTypesData) ? inventoryTypesData : [];

  const defaultValues: NewInventorySchemaType = {
    type: '',
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    reorder_point: 0,
    width_mm: null,
    height_mm: null,
    reflectivity_astm_type: '',
    mot_approval: '',
    typical_application: '',
    lct: false,
    hwy: false,
    lct_required_qty: 0,
    hwy_required_qty: 0,
    billable: false,
  };

  const methods = useForm<NewInventorySchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewInventorySchema),
      values: currentData
      ? {
          type: currentData.type || currentData.category || '',
          name: currentData.name,
          sku: currentData.sku || '',
          description: (currentData as any).description || '',
          quantity: (currentData as any).quantity || 0,
          reorder_point: (currentData as any).reorder_point || 0,
          width_mm: (currentData as any).width_mm || null,
          height_mm: (currentData as any).height_mm || null,
          reflectivity_astm_type: (currentData as any).reflectivity_astm_type || '',
          mot_approval: (currentData as any).mot_approval || '',
          typical_application: (currentData as any).typical_application || '',
          lct: (currentData as any).lct || false,
          hwy: (currentData as any).hwy || false,
          lct_required_qty: (currentData as any).lct_required_qty || 0,
          hwy_required_qty: (currentData as any).hwy_required_qty || 0,
          billable: (currentData as any).billable || false,
        }
      : defaultValues,
  });

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const selectedType = watch('type');
  const isSignType = selectedType === 'sign';

  const handleInventoryTypeAdded = (newType: { id: string; value: string }) => {
    methods.setValue('type', newType.value);
  };

  const handleInventoryTypeCancel = () => {
    // no-op; keep current selection
  };

  const formatTypeLabel = (value: string) =>
    value
      .split('_')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');

  // Reset form when currentData changes
  useEffect(() => {
    if (currentData) {
      reset({
        type: currentData.type || currentData.category || '',
        name: currentData.name,
        sku: currentData.sku || '',
        description: (currentData as any).description || '',
        quantity: (currentData as any).quantity || 0,
        reorder_point: (currentData as any).reorder_point || 0,
        width_mm: (currentData as any).width_mm || null,
        height_mm: (currentData as any).height_mm || null,
        reflectivity_astm_type: (currentData as any).reflectivity_astm_type || '',
        mot_approval: (currentData as any).mot_approval || '',
        typical_application: (currentData as any).typical_application || '',
        lct: (currentData as any).lct || false,
        hwy: (currentData as any).hwy || false,
        lct_required_qty: (currentData as any).lct_required_qty || 0,
        hwy_required_qty: (currentData as any).hwy_required_qty || 0,
      });
      setUploadedImageUrl(currentData.cover_url || currentData.coverUrl || null);
      setImagePreview(currentData.cover_url || currentData.coverUrl || null);
    }
  }, [currentData, reset]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
  };

  const handleUploadImage = async (inventoryId: string): Promise<string | null> => {
    if (!imageFile) return uploadedImageUrl;

    // Don't show loading toast here - the main submit handler already shows a loading toast
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const public_id = `inventory/${inventoryId}/cover_${inventoryId}`;
      const folder = `inventory/${inventoryId}`;

      const query = new URLSearchParams({
        public_id,
        timestamp: timestamp.toString(),
        folder,
        action: 'upload',
      }).toString();

      const { signature, api_key, cloud_name } = await fetcher([
        `${endpoints.cloudinary.upload}/signature?${query}`,
        { method: 'GET' },
      ]);

      // Upload file with signed params
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('public_id', public_id);
      formData.append('overwrite', 'true');
      formData.append('folder', folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

      const uploadRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
      }

      // Don't show success toast here - will be shown after inventory creation/update
      return uploadData.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    const isEdit = Boolean(currentData?.id);
    const toastId = toast.loading(isEdit ? 'Updating...' : 'Creating...');

    try {
      // Prepare base data
      const formattedData: any = {
        type: data.type,
        name: capitalizeWords(data.name),
        sku: emptyToNull(data.sku),
        description: emptyToNull((data as any).description),
        category: data.type, // Using type as category for now
        status: 'active',
        quantity: data.quantity || 0,
        reorder_point: data.reorder_point || 0,
        lct_required_qty: data.lct_required_qty || 0,
        hwy_required_qty: data.hwy_required_qty || 0,
        billable: data.billable || false,
        // LCT and HWY flags are auto-set in backend based on required quantities
      };

      // Add sign-specific fields if type is sign
      if (isSignType) {
        formattedData.width_mm = data.width_mm;
        formattedData.height_mm = data.height_mm;
        formattedData.reflectivity_astm_type = emptyToNull(data.reflectivity_astm_type);
        formattedData.mot_approval = emptyToNull(data.mot_approval);
        formattedData.typical_application = emptyToNull(data.typical_application);
      }

      // Create or update inventory item
      const response = await fetcher([
        isEdit
          ? `${endpoints.management.inventory || '/api/inventory'}/${currentData?.id}`
          : endpoints.management.inventory || '/api/inventory',
        {
          method: isEdit ? 'PUT' : 'POST',
          data: formattedData,
        },
      ]);

      const inventoryId = isEdit ? currentData?.id : response.data?.id || response.data?.inventory?.id;

      // Upload image if there's a new one
      if (imageFile && inventoryId) {
        const imageUrl = await handleUploadImage(inventoryId);
        if (imageUrl) {
          // Update inventory with image URL
          await fetcher([
            `${endpoints.management.inventory || '/api/inventory'}/${inventoryId}`,
            {
              method: 'PUT',
              data: { cover_url: imageUrl },
            },
          ]);
        }
      }

      toast.dismiss(toastId);
      toast.success(isEdit ? 'Update success!' : 'Create success!');

      // Invalidate cache to refresh inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (isEdit && currentData?.id) {
        queryClient.invalidateQueries({ queryKey: ['inventory', currentData.id] });
      }

      router.push(paths.management.inventory.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} inventory item. Please try again.`);
    }
  });

  const onDelete = async () => {
    if (!currentData?.id) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting inventory item...');
    try {
      await fetcher([
        `${endpoints.management.inventory || '/api/inventory'}/${currentData.id}`,
        { method: 'DELETE' },
      ]);

      toast.dismiss(toastId);
      toast.success('Delete success!');

      // Invalidate cache after deletion
      queryClient.invalidateQueries({ queryKey: ['inventory', currentData.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      router.push(paths.management.inventory.list);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error('Failed to delete the inventory item.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderConfirmDialog = (
    <Dialog open={confirmDialog.value} onClose={confirmDialog.onFalse} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Inventory Item</DialogTitle>
      <DialogContent>
        Are you sure you want to delete <strong>{currentData?.name}</strong>?
      </DialogContent>
      <DialogActions>
        <Button onClick={confirmDialog.onFalse} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Product Image
            </Typography>
            <Box
              sx={{
                width: 1,
                aspectRatio: '1/1',
                borderRadius: 1.5,
                overflow: 'hidden',
                position: 'relative',
                border: (theme) => `dashed 1.5px ${theme.vars.palette.divider}`,
                ...(imagePreview && {
                  border: 'none',
                }),
              }}
            >
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: 1,
                    height: 1,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 1,
                    height: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Box
                      component="svg"
                      xmlns="http://www.w3.org/2000/svg"
                      width={32}
                      height={32}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      sx={{ color: 'text.disabled' }}
                    >
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Drop or select image
                  </Typography>
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="soft"
                component="label"
                startIcon={
                  <Box
                    component="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                  </Box>
                }
              >
                Upload
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </Button>
              {imagePreview && (
                <Button variant="soft" color="error" onClick={handleRemoveImage}>
                  Remove
                </Button>
              )}
            </Stack>

            <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
              Allowed *.jpeg, *.jpg, *.png, *.gif
              <br />
              Max size of 5MB
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            {/* Billable toggle - top right */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
              <Field.Switch 
                name="billable" 
                label="Billable Item" 
                sx={{ m: 0 }}
              />
              <Tooltip 
                title="Enable this to include this item in customer invoices. Customer-specific pricing can be set in the Customer Details page."
                arrow
                placement="left"
              >
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <Iconify icon="eva:info-outline" width={20} />
                </IconButton>
              </Tooltip>
            </Box>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Select
                name="type"
                label="Type*"
                slotProps={{
                  inputLabel: { shrink: true },
                  select: {
                    displayEmpty: true,
                    renderValue: (value: any) => {
                      if (!value || value === '__add_new__') {
                        return (
                          <span style={{ color: '#919EAB', fontStyle: 'normal' }}>
                            Select Type
                          </span>
                        );
                      }
                      return formatTypeLabel(String(value));
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select Type</em>
                </MenuItem>

                {(inventoryTypes.length > 0
                  ? inventoryTypes.map((t) => ({ value: t.value, label: formatTypeLabel(t.value) }))
                  : INVENTORY_TYPE_FALLBACK_OPTIONS
                ).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}

                <MenuItem
                  value="__add_new__"
                  onClick={() => setAddTypeDialogOpen(true)}
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <Iconify icon="mingcute:add-line" sx={{ mr: 1, fontSize: 16 }} />
                  Add Inventory Type
                </MenuItem>
              </Field.Select>

              <Field.Text name="name" label="Name*" />

              <Field.Text name="sku" label="SKU" />

              <Field.Text name="description" label="Description" />

              <Field.Text name="quantity" label="Current Quantity" type="number" />
              <Field.Text name="reorder_point" label="Reorder Point" type="number" />

              {/* LCT and HWY Required Quantities for auto-assignment to vehicles */}
              <Box sx={{ gridColumn: { sm: 'span 2' }, display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }, columnGap: 2, rowGap: 3 }}>
                <Field.Text 
                  name="lct_required_qty" 
                  label="LCT Required Qty (Auto-assign)" 
                  type="number"
                  helperText="Quantity to auto-assign when creating new LCT vehicles. LCT flag auto-sets when > 0"
                />
                <Field.Text 
                  name="hwy_required_qty" 
                  label="HWY Required Qty (Auto-assign)" 
                  type="number"
                  helperText="Quantity to auto-assign when creating new HWY vehicles. HWY flag auto-sets when > 0"
                />
              </Box>

              {/* Sign-specific fields - only show when type is 'sign' */}
              {isSignType && (
                <>
                  <Box sx={{ gridColumn: { sm: 'span 2' }, display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }, columnGap: 2, rowGap: 3 }}>
                    <Field.Text name="width_mm" label="Width (mm)" type="number" />
                    <Field.Text name="height_mm" label="Height (mm)" type="number" />
                  </Box>
                  <Field.Select
                    name="reflectivity_astm_type"
                    label="Reflectivity ASTM Type"
                    sx={{ gridColumn: { sm: 'span 2' } }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {REFLECTIVITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Select
                    name="mot_approval"
                    label="MoT Approval"
                    sx={{ gridColumn: { sm: 'span 2' } }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {MOT_APPROVAL_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Select
                    name="typical_application"
                    label="Typical Application"
                    sx={{ gridColumn: { sm: 'span 2' } }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {TYPICAL_APPLICATION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </>
              )}
            </Box>

            <Stack
              direction="row"
              justifyContent={!currentData ? 'flex-end' : 'space-between'}
              alignItems="center"
              sx={{ mt: 3 }}
            >
              {currentData && (
                <Button variant="soft" color="error" onClick={confirmDialog.onTrue}>
                  Delete
                </Button>
              )}
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentData ? 'Create' : 'Save changes'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {renderConfirmDialog}

      <AddInventoryTypeDialog
        open={addTypeDialogOpen}
        onClose={() => setAddTypeDialogOpen(false)}
        onInventoryTypeAdded={handleInventoryTypeAdded}
        onCancel={handleInventoryTypeCancel}
      />
    </Form>
  );
}

