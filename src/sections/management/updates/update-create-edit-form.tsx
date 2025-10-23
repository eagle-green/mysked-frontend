import type { IUpdateItem } from 'src/types/updates';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { getCategoryColor, getCategoryOptions } from 'src/utils/category-colors';

import { useCreateUpdate, useUpdateUpdate } from 'src/actions/updates';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

export type UpdateCreateSchemaType = z.infer<typeof UpdateCreateSchema>;

export const UpdateCreateSchema = z.object({
  title: z.string().min(1, { message: 'Title is required!' }),
  description: z.string().min(1, { message: 'Description is required!' }),
  content: schemaUtils.editor().min(50, { message: 'Content must be at least 50 characters' }),
  category: z.array(z.any()).min(1, { message: 'Please select at least one category' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentUpdate?: IUpdateItem;
  isEdit?: boolean;
};

export function UpdateCreateEditForm({ currentUpdate, isEdit = false }: Props) {
  const router = useRouter();


  const createUpdate = useCreateUpdate();
  const updateUpdate = useUpdateUpdate();

  const defaultValues: UpdateCreateSchemaType = {
    title: currentUpdate?.title || '',
    description: currentUpdate?.description || '',
    content: currentUpdate?.content || '',
    category: currentUpdate?.category 
      ? currentUpdate.category.split(', ').map(cat => {
          const trimmedCat = cat.trim();
          return {
            label: trimmedCat,
            value: trimmedCat,
            color: getCategoryColor(trimmedCat)
          };
        })
      : [],
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(UpdateCreateSchema),
    defaultValues,
  });

  const {
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  // Reset form when currentUpdate changes
  useEffect(() => {
    if (currentUpdate) {
      methods.reset({
        title: currentUpdate.title || '',
        description: currentUpdate.description || '',
        content: currentUpdate.content || '',
        category: currentUpdate.category 
          ? currentUpdate.category.split(', ').map(cat => {
              const trimmedCat = cat.trim();
              return {
                label: trimmedCat,
                value: trimmedCat,
                color: getCategoryColor(trimmedCat)
              };
            })
          : [],
      });
    }
  }, [currentUpdate, methods]);

  // Debug form values

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Extract category values properly
      const categoryValues = Array.isArray(data.category) 
        ? data.category.map(cat => typeof cat === 'object' ? cat.value : cat)
        : [];

      if (currentUpdate) {
        const updateData = {
          id: currentUpdate.id,
          data: {
            title: data.title,
            description: data.description,
            content: data.content,
            category: categoryValues,
            published: true,
          },
        };
        
        await updateUpdate.mutateAsync(updateData);
        toast.success('Update saved successfully!');
        // Redirect to list page after successful update
        router.push(paths.management.updates.list);
      } else {
        const createData = {
          title: data.title,
          description: data.description,
          content: data.content,
          category: categoryValues,
          published: true,
        };
        
        await createUpdate.mutateAsync(createData);
        toast.success('Update created successfully!');
        // Redirect to list page after successful creation
        reset();
        router.push(paths.management.updates.list);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save update. Please try again.');
    }
  });



  const renderDetails = () => (
    <Stack spacing={3}>
      <Field.Text name="title" label="Update title" />

      <Field.Text name="description" label="Description" multiline rows={3} />

      <Field.Autocomplete
        name="category"
        label="Categories"
        multiple
        options={getCategoryOptions()}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderOption={(props, option) => (
          <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <Label
              variant="soft"
              color={option.color}
              sx={{ fontSize: '0.75rem' }}
            >
              {option.label}
            </Label>
          </Box>
        )}
        renderTags={(value, getTagProps) =>
          (Array.isArray(value) ? value : []).map((option, index) => (
            <Label
              key={option.value}
              variant="soft"
              color={option.color}
              sx={{ 
                fontSize: '0.75rem', 
                mr: 1,
                mb: 0.5,
                cursor: 'pointer',
                '&:hover': { 
                  opacity: 0.8,
                  transform: 'scale(0.95)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={() => {
                const newValue = value.filter((_, i) => i !== index);
                setValue('category', newValue);
              }}
            >
              {option.label}
            </Label>
          ))
        }
      />

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Content</Typography>
        <Field.Editor name="content" sx={{ maxHeight: 480 }} />
      </Stack>
    </Stack>
  );


  const renderActions = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        pb: 3,
      }}
    >
      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={isSubmitting}
      >
        {!currentUpdate ? 'Create update' : 'Save changes'}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderActions()}
      </Stack>

    </Form>
  );
}
