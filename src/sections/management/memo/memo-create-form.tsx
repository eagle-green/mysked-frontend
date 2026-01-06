import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { useCreateWideMemoRequest } from 'src/actions/memo';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { IWideMemo, MemoStatus } from 'src/types/memo';

//----------------------------------------------------------------------------------------------------------------

const MEMO_STATUS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
];

type Props = {
  userList: any;
};

export function CreateCompanyWideMemoForm({ userList }: Props) {
  const now = dayjs();
  const theme = useTheme();
  const router = useRouter();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const createMemo = useCreateWideMemoRequest();

  const adminLists =
    userList
      ?.filter((x: any) => x?.role?.toLowerCase() == 'admin')
      ?.map((admin: any) => ({
        value: admin.id,
        label: `${admin.first_name} ${admin.last_name}`,
        photo_url: admin.photo_url || '',
        first_name: admin.first_name,
        last_name: admin.last_name,
      })) || [];

  const defaultFormValue: IWideMemo = {
    id: '',
    memo_title: '',
    memo_content: '',
    pending_items: [{ memo_title: '', assignee_id: '', status: MemoStatus.pending }],
    published_date: now.format('YYYY-MM-DD'),
    due_date: '',
  };

  const CreateCompanyWideMemoSchema = z.object({
    id: z.string().optional(),
    memo_title: z.string().min(1, 'Required Memo title field. '),
    memo_content: z.string().min(1, 'Required Memo content field. '),
    due_date: z.string().min(1, 'Required Due Date field. '),
    published_date: z.string().optional().nullable(),
    pending_items: z
      .array(
        z.object({
          memo_title: z.string().min(1, 'Required memo title field .'),
          assignee_id: z.string().min(1, 'Required assignee field .'),
          status: z.string().min(1, 'Required status field .'),
        })
      )
      .min(1, { message: 'At least one pending memo!' }),
  });

  type MemoShcemaType = z.infer<typeof CreateCompanyWideMemoSchema>;

  const methods = useForm<MemoShcemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(CreateCompanyWideMemoSchema),
    defaultValues: defaultFormValue,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
    control,
  } = methods;

  const onSubmit = handleSubmit(async (formdata) => {
    try {
      await createMemo.mutateAsync(formdata as IWideMemo);
      toast.success('Memot created successfully!');
      router.push(`${paths.management.memo.list}?status=pending`);
    } catch (error: any) {
      console.error('Error submitting memo request:', error);
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Failed to create memo';
      toast.error(errorMessage);
    }
  });

  const {
    fields: pedingItemFields,
    append: appendPendingItemControlFields,
    remove: removePendingItemControlFields,
  } = useFieldArray({
    control: control,
    name: 'pending_items',
  });

  const pendingItemControlFields = (index: number): Record<string, string> => ({
    memo_title: `pending_items[${index}].memo_title`,
    assignee_id: `pending_items[${index}].assignee_id`,
    status: `pending_items[${index}].status`,
  });

  const defaultPendingItemValues: Omit<
    { memo_title: string; assignee_id: string; status: string },
    'id'
  > = {
    memo_title: '',
    assignee_id: '',
    status: MemoStatus.pending,
  };

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
              }}
            >
              <Typography variant="h6">Memo Detail</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: { xs: 'flex-start', md: 'space-between' },
                  alignItems: 'stretch',
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 2 }}>
                  <Field.Text
                    fullWidth
                    placeholder="Write your memo title here ..."
                    name="memo_title"
                    label="Memo Title"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <Field.DatePicker name="published_date" label="Memo Date" disabled />
                  <Field.DatePicker name="due_date" label="Due Date" />
                </Box>
              </Box>

              <Field.Text
                fullWidth
                multiline
                rows={4}
                placeholder="Write your memo description here ..."
                name="memo_content"
                label="Description"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Box>
          </Box>
        </Card>

        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Stack direction="column" spacing={1} alignItems="flex-start">
                {/* <Iconify icon="solar:case-minimalistic-bold" sx={{ color: 'primary' }} /> */}
                <Typography variant="h6">Pending Items</Typography>
                <Typography variant="caption" color="text.disabled">
                  List of items awaiting action for this memo
                </Typography>
              </Stack>

              <Stack>
                <Button
                  size="medium"
                  color="primary"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  sx={{ flexShrink: 0, alignItems: 'flex-start' }}
                  onClick={() => {
                    appendPendingItemControlFields({
                      ...defaultPendingItemValues,
                    });
                  }}
                >
                  Add Field
                </Button>
              </Stack>
            </Box>

            <Box>
              {pedingItemFields.map((fields, index) => (
                <Box
                  key={`pendingMemos-${fields.id}-${index}`}
                  sx={{
                    gap: 1.5,
                    display: 'flex',
                    alignItems: 'flex-end',
                    flexDirection: 'column',
                    mt: 2,
                    w: 1,
                  }}
                >
                  <Box
                    sx={{
                      gap: 2,
                      width: 1,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                    }}
                  >
                    <Box sx={{ flex: 3 }}>
                      <Field.Text
                        size="small"
                        name={pendingItemControlFields(index).memo_title}
                        label="Memo Title *"
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Field.AutocompleteWithAvatar
                        size="small"
                        name={pendingItemControlFields(index).assignee_id}
                        label="Select Assignee *"
                        placeholder="Select Assignee"
                        options={adminLists}
                        disabled={!adminLists?.length}
                      />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Field.Select
                        size="small"
                        name={pendingItemControlFields(index).status}
                        label="Status"
                        disabled
                      >
                        {MEMO_STATUS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </Box>

                    {!isXsSmMd && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          removePendingItemControlFields(index);
                        }}
                        sx={{
                          px: 1,
                          minWidth: 'auto',
                          width: '40px',
                          height: '40px',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          alignSelf: 'flex-start',
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </Box>
                  {isXsSmMd && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                      onClick={() => {
                        removePendingItemControlFields(index);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
        <Box sx={{ pt: 3, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push(paths.management.memo.list)}>
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Iconify icon="solar:check-circle-bold" />}
              color="success"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </Form>
    </>
  );
}
