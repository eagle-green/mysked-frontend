import type { IAnnouncementItem } from 'src/types/announcements';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAnnouncementCategories } from 'src/hooks/use-announcement-categories';

import { getCategoryColor } from 'src/utils/category-colors';
import { replaceDataUrlsInContentWithCloudinary } from 'src/utils/cloudinary-content-upload';

import { useCreateAnnouncement, useUpdateAnnouncement } from 'src/actions/announcements';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { AnnouncementRecipientDialog } from './announcement-recipient-dialog';

export const AnnouncementCreateSchema = z.object({
  title: z.string().min(1, { message: 'Title is required!' }),
  description: z.string().optional(),
  content: schemaUtils.editor().min(50, { message: 'Content must be at least 50 characters' }),
  category: z.array(z.any()).optional(),
  requiresSignature: z.boolean().optional(),
});

export type AnnouncementCreateSchemaType = z.infer<typeof AnnouncementCreateSchema>;

export type CategoryOption = { id?: string; label: string; value: string; color: string };

function buildCategoryOptionsFromString(
  categoryStr: string | undefined,
  categoryColors?: Record<string, string> | null
): CategoryOption[] {
  if (!categoryStr?.trim()) return [];
  return categoryStr.split(',').map((cat) => {
    const trimmed = cat.trim();
    const hex = categoryColors?.[trimmed];
    return {
      label: trimmed,
      value: trimmed,
      color: hex && hex.startsWith('#') ? hex : getCategoryColor(trimmed),
    };
  });
}

function buildCategoryColorsFromOptions(category: CategoryOption[] | undefined): Record<string, string> | undefined {
  if (!Array.isArray(category)) return undefined;
  const map: Record<string, string> = {};
  category.forEach((cat) => {
    if (cat?.value && cat?.color?.startsWith('#')) {
      map[cat.value] = cat.color;
    }
  });
  return Object.keys(map).length > 0 ? map : undefined;
}

type AddCategoryDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (option: CategoryOption) => void;
  createCategory: (params: { name: string; color?: string }) => Promise<{ id: string; name: string; color: string | null }>;
  isCreating: boolean;
};

function AddCategoryDialog({ open, onClose, onAdd, createCategory, isCreating }: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#00B8D9');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError('');
    try {
      const created = await createCategory({ name: trimmed, color });
      onAdd({
        id: created.id,
        label: created.name,
        value: created.name,
        color: created.color || '#00B8D9',
      });
      setName('');
      setColor('#00B8D9');
      onClose();
      toast.success('Category added successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add category');
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#00B8D9');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Category</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Safety, Policy"
          />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Color
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: 'divider',
                  bgcolor: color,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover': { borderColor: 'grey.400' },
                }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    margin: 0,
                    padding: 0,
                    border: 'none',
                  }}
                />
              </Box>
              <TextField
                size="small"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#00B8D9"
                sx={{ width: 120 }}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAdd} disabled={!name.trim() || isCreating}>
          {isCreating ? 'Adding...' : 'Add Category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type EditCategoryDialogProps = {
  open: boolean;
  onClose: () => void;
  category: CategoryOption | null;
  onUpdated: (option: CategoryOption) => void;
  onDeleted: (option: CategoryOption) => void;
  updateCategory: (params: { id: string; name: string; color?: string | null }) => Promise<{ id: string; name: string; color: string | null }>;
  deleteCategory: (id: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
};

function EditCategoryDialog({
  open,
  onClose,
  category,
  onUpdated,
  onDeleted,
  updateCategory,
  deleteCategory,
  isUpdating,
  isDeleting,
}: EditCategoryDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#00B8D9');
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.label);
      setColor(category.color?.startsWith('#') ? category.color : '#00B8D9');
      setError('');
    }
  }, [category]);

  const handleSave = async () => {
    if (!category?.id) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required');
      return;
    }
    setError('');
    try {
      const updated = await updateCategory({ id: category.id, name: trimmed, color });
      onUpdated({
        id: updated.id,
        label: updated.name,
        value: updated.name,
        color: updated.color || '#00B8D9',
      });
      toast.success('Category updated successfully.');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!category?.id) return;
    try {
      await deleteCategory(category.id);
      onDeleted(category);
      toast.success('Category deleted successfully.');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category');
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#00B8D9');
    setError('');
    onClose();
  };

  if (!category) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Category</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isUpdating || isDeleting}
            placeholder="e.g. Safety, Policy"
          />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: 'divider',
                  bgcolor: color,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover': { borderColor: 'grey.400' },
                }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    margin: 0,
                    padding: 0,
                    border: 'none',
                  }}
                />
              </Box>
              <TextField
                size="small"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#00B8D9"
                sx={{ width: 120 }}
                disabled={isUpdating || isDeleting}
              />
            </Box>
          </Box>
          <Box sx={{ pt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isUpdating || isDeleting}
              fullWidth
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Category'}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUpdating || isDeleting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || isUpdating || isDeleting}>
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type Props = {
  currentAnnouncement?: IAnnouncementItem;
  isEdit?: boolean;
};

export function AnnouncementCreateEditForm({ currentAnnouncement, isEdit = false }: Props) {
  const router = useRouter();
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryOption | null>(null);
  const {
    categories: apiCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAnnouncementCategories();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();

  const categoryOptions = useMemo(() => {
    const apiOpts: CategoryOption[] = apiCategories.map((c) => ({
      id: c.id,
      label: c.name,
      value: c.name,
      color: c.color && c.color.startsWith('#') ? c.color : getCategoryColor(c.name),
    }));
    const fromAnnouncement = buildCategoryOptionsFromString(
      currentAnnouncement?.category,
      currentAnnouncement?.categoryColors
    );
    const extra = fromAnnouncement.filter((f) => !apiOpts.some((a) => a.value === f.value));
    return [...apiOpts, ...extra];
  }, [apiCategories, currentAnnouncement?.category, currentAnnouncement?.categoryColors]);
  const draftFolderId = useMemo(() => crypto.randomUUID(), []);
  const imageUploadFolder = currentAnnouncement
    ? `announcements/${currentAnnouncement.id}`
    : `announcements/${draftFolderId}`;

  const defaultValues: AnnouncementCreateSchemaType = {
    title: currentAnnouncement?.title || '',
    description: currentAnnouncement?.description ?? '',
    content: currentAnnouncement?.content || '',
    category: buildCategoryOptionsFromString(
        currentAnnouncement?.category,
        currentAnnouncement?.categoryColors
      ),
    requiresSignature: currentAnnouncement?.requiresSignature ?? false,
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(AnnouncementCreateSchema),
    defaultValues,
  });

  const { reset, setValue, handleSubmit, getValues, watch, formState: { isSubmitting } } = methods;
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewTitle = watch('title');
  const previewDescription = watch('description');
  const previewCategory = watch('category');
  const previewRequiresSignature = watch('requiresSignature');
  const previewContent = watch('content');

  useEffect(() => {
    if (currentAnnouncement) {
      const opts = buildCategoryOptionsFromString(
        currentAnnouncement.category,
        currentAnnouncement.categoryColors
      );
      methods.reset({
        title: currentAnnouncement.title || '',
        description: currentAnnouncement.description ?? '',
        content: currentAnnouncement.content || '',
        category: opts,
        requiresSignature: currentAnnouncement.requiresSignature ?? false,
      });
    }
  }, [currentAnnouncement, methods]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const categoryValues = Array.isArray(data.category)
        ? data.category.map((cat) => (typeof cat === 'object' ? cat.value : cat))
        : [];
      const categoryColorsPayload = buildCategoryColorsFromOptions(data.category as CategoryOption[] | undefined);

      if (currentAnnouncement) {
        await updateAnnouncement.mutateAsync({
          id: currentAnnouncement.id,
          data: {
            title: data.title,
            description: data.description,
            content: data.content,
            category: categoryValues,
            categoryColors: categoryColorsPayload,
            requiresSignature: data.requiresSignature ?? false,
            published: true,
          },
        });
        toast.success('Announcement saved successfully!');
        router.push(paths.management.announcements.list);
      } else {
        setRecipientDialogOpen(true);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save announcement. Please try again.');
    }
  });

  const handleRecipientConfirm = async (recipientUserIds: string[]) => {
    try {
      const data = getValues();
      const categoryValues = Array.isArray(data.category)
        ? data.category.map((cat) => (typeof cat === 'object' ? cat.value : cat))
        : [];
      const categoryColorsPayload = buildCategoryColorsFromOptions(data.category as CategoryOption[] | undefined);
      const announcement = await createAnnouncement.mutateAsync({
        title: data.title,
        description: data.description,
        content: data.content,
        category: categoryValues,
        categoryColors: categoryColorsPayload,
        requiresSignature: data.requiresSignature ?? false,
        published: true,
        recipientUserIds,
      });
      const content = data.content ?? '';
      if (content.includes('data:image') && announcement?.id) {
        const folder = `announcements/${announcement.id}`;
        const newContent = await replaceDataUrlsInContentWithCloudinary(content, folder);
        await updateAnnouncement.mutateAsync({
          id: announcement.id,
          data: { content: newContent },
        });
      }
      toast.success('Announcement created and sent to selected employees.');
      setRecipientDialogOpen(false);
      reset();
      router.push(paths.management.announcements.list);
    } catch (error) {
      console.error('Create announcement error:', error);
      toast.error('Failed to create announcement. Please try again.');
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5}>
        <Stack spacing={3}>
          <Field.Text name="title" label="Announcement title" />
          <Field.Text name="description" label="Sub title (optional)" />
          <Field.Autocomplete
            name="category"
            label="Categories (optional)"
            multiple
            options={[
              ...categoryOptions,
              { label: '+ Add Category', value: '__add__', color: 'default' as const },
            ]}
            getOptionLabel={(option) => (option?.label ?? '') as string}
            isOptionEqualToValue={(option, value) => option?.value === value?.value}
            onChange={(_, newValue) => {
              const addOption = (newValue as CategoryOption[]).find((o) => o?.value === '__add__');
              if (addOption) {
                setAddCategoryDialogOpen(true);
                setValue(
                  'category',
                  (newValue as CategoryOption[]).filter((o) => o?.value !== '__add__')
                );
              } else {
                setValue('category', newValue as CategoryOption[]);
              }
            }}
            renderOption={(props, option) => {
              if (option?.value === '__add__') {
                return (
                  <Box
                    component="li"
                    {...props}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      color: 'primary.main',
                      fontWeight: 500,
                    }}
                  >
                    + Add Category
                  </Box>
                );
              }
              const isHex = option?.color?.startsWith('#');
              return (
                <Box
                  component="li"
                  {...props}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 0.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    {isHex ? (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          bgcolor: option.color,
                          color: (t) => t.palette.getContrastText(option.color),
                        }}
                      >
                        {option.label}
                      </Box>
                    ) : (
                      <Label variant="soft" color={option?.color as any} sx={{ fontSize: '0.75rem' }}>
                        {option?.label}
                      </Label>
                    )}
                  </Box>
                  {option?.id && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryToEdit(option);
                      }}
                      aria-label="Edit category"
                      sx={{ flexShrink: 0 }}
                    >
                      <Iconify icon="solar:pen-bold" width={18} />
                    </IconButton>
                  )}
                </Box>
              );
            }}
            renderTags={(value) =>
              (Array.isArray(value) ? value : []).map((option, index) => {
                const isHex = option?.color?.startsWith('#');
                return (
                  <Box
                    key={option?.value ?? index}
                    component="span"
                    onClick={() => setValue('category', value.filter((_, i) => i !== index))}
                    sx={{
                      fontSize: '0.75rem',
                      mr: 1,
                      mb: 0.5,
                      cursor: 'pointer',
                      ...(isHex
                        ? {
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: option.color,
                            color: (t) => t.palette.getContrastText(option.color),
                          }
                        : {}),
                    }}
                  >
                    {isHex ? (
                      option?.label
                    ) : (
                      <Label
                        variant="soft"
                        color={option?.color as any}
                        sx={{ fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        {option?.label}
                      </Label>
                    )}
                  </Box>
                );
              })
            }
          />
          <AddCategoryDialog
            open={addCategoryDialogOpen}
            onClose={() => setAddCategoryDialogOpen(false)}
            onAdd={(newOption) => {
              const current = (getValues('category') as CategoryOption[]) || [];
              if (current.some((c) => c.value === newOption.value)) return;
              setValue('category', [...current, newOption]);
            }}
            createCategory={createCategory}
            isCreating={isCreating}
          />
          <EditCategoryDialog
            open={Boolean(categoryToEdit)}
            onClose={() => setCategoryToEdit(null)}
            category={categoryToEdit}
            onUpdated={(newOption) => {
              const current = (getValues('category') as CategoryOption[]) || [];
              setValue(
                'category',
                current.map((c) => (c.id === newOption.id ? newOption : c))
              );
            }}
            onDeleted={(deleted) => {
              const current = (getValues('category') as CategoryOption[]) || [];
              setValue(
                'category',
                current.filter((c) => c.value !== deleted.value && c.id !== deleted.id)
              );
            }}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
          <Field.Switch name="requiresSignature" label="Require employee signature" />
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Content</Typography>
            <Field.Editor
              name="content"
              sx={{ maxHeight: 480 }}
              imageUploadFolder={imageUploadFolder}
              deferImageUpload={!currentAnnouncement}
            />
          </Stack>
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pb: 3 }}>
          {!currentAnnouncement && (
            <Button
              type="button"
              variant="outlined"
              size="medium"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
          )}
          <Button type="submit" variant="contained" size="medium" loading={isSubmitting}>
            {!currentAnnouncement ? 'Create Announcement' : 'Save changes'}
          </Button>
        </Box>
      </Stack>
      {!currentAnnouncement && (
        <>
          <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Preview</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 0.5 }}>
                <Typography variant="h5">{previewTitle || 'Announcement title'}</Typography>
                {previewDescription && (
                  <Typography variant="body1" color="text.secondary">{previewDescription}</Typography>
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(Array.isArray(previewCategory) ? previewCategory : [])
                    .filter((c): c is CategoryOption => c && typeof c === 'object' && 'value' in c)
                    .map((cat, index) => {
                      const hex = cat?.color?.startsWith('#') ? cat.color : undefined;
                      if (hex && /^#[0-9A-Fa-f]{3,8}$/.test(hex)) {
                        let textColor = '#000';
                        try {
                          textColor = theme.palette.getContrastText(hex);
                        } catch {
                          textColor = parseInt(hex.slice(1), 16) > 0xffffff / 2 ? '#000' : '#fff';
                        }
                        return (
                          <Box
                            key={index}
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: hex,
                              color: textColor,
                            }}
                          >
                            {cat?.label ?? cat?.value}
                          </Box>
                        );
                      }
                      return (
                        <Label key={index} variant="soft" color={getCategoryColor(cat?.value ?? '')} sx={{ fontSize: '0.75rem' }}>
                          {cat?.label ?? cat?.value}
                        </Label>
                      );
                    })}
                </Stack>
                {previewRequiresSignature && (
                  <Label color="warning">Requires signature</Label>
                )}
                <Box
                  className="announcement-preview-content"
                  sx={{
                    typography: 'body1',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                    '& > * + *': { mt: 1.5, mb: 0 },
                    '& p': { mb: 1.25 },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: 2,
                      my: 1.5,
                    },
                    '& ul, & ol': { pl: 2.5, '& li': { mb: 0.5 } },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const raw = String(previewContent || '').trim();
                      if (!raw) return '';
                      const stripped = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
                      return stripped;
                    })(),
                  }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
          <AnnouncementRecipientDialog
            open={recipientDialogOpen}
            onClose={() => setRecipientDialogOpen(false)}
            onConfirm={handleRecipientConfirm}
          />
        </>
      )}
    </Form>
  );
}
