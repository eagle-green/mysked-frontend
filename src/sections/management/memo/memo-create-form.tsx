import { z } from 'zod';
import { useCallback, useState } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks';

//----------------------------------------------------------------------------------------------------------------

const MEMO_STATUS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
];

const MEMO_VISIBILITY = [
  { label: 'All Employees', value: 'all' },
  { label: 'Assignees Only', value: 'assignee' },
  { label: 'Department Only', value: 'department' },
];

const CreateCompanyWideMemoSchema = z.object({
  memo_title: z.string().min(1, 'title is required'),
  memo_content: z.string().min(1, 'Memon content is required'),
});

export function CreateCompanyWideMemoForm() {
  const { user } = useAuthContext();
  const theme = useTheme();
  const router = useRouter();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const [assignee, setAssignee] = useState<{ label: string; value: string }[]>([
    { label: 'Jerwin Fortillano', value: 'Jerwin Fortillano' },
    { label: 'Kesia', value: 'Kesia' },
    { label: 'Jenny', value: 'Jenny' },
  ]);
  const methods = useForm<any>({
    mode: 'all',
    defaultValues: {
      pendingMemos: [{ pendingMemo: '', status: 'pending' }],
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
  } = methods;

  const onSubmit = handleSubmit(async (values) => values);

  const handleRemove = useCallback(
    (assign: string) => {
      const users = assignee.filter((t: { label: string; value: string }) => t.value !== assign);
      setAssignee(users);
    },
    [assignee]
  );

  const {
    fields: pedingItemFields,
    append: appendPendingItemControlFields,
    remove: removePendingItemControlFields,
  } = useFieldArray({
    control: methods.control,
    name: 'pendingMemos',
  });

  const pendingItemControlFields = (index: number): Record<string, string> => ({
    pendingMemo: `pendingMemos[${index}].pendingMemo`,
    status: `pendingMemos[${index}].status`,
  });

  const defaultPendingItemValues: Omit<{ pendingMemo: string; status: string }, 'id'> = {
    pendingMemo: '',
    status: 'pending',
  };

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Publish Wide Memo
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <Field.Text
                fullWidth
                placeholder="Write your meme title here ..."
                name="memoTitle"
                label="Title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />

              <Field.Text
                fullWidth
                multiline
                rows={4}
                placeholder="Write your memo content here ..."
                name="memoDescription"
                label="Description"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:case-minimalistic-bold" sx={{ color: 'primary' }} />
                  <Typography variant="h6">Pending Items</Typography>
                </Stack>

                <Stack>
                  <Button
                    size="medium"
                    color="primary"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    sx={{ flexShrink: 0, alignItems: 'flex-start' }}
                    onClick={() => {
                      appendPendingItemControlFields({
                        defaultPendingItemValues,
                      });
                    }}
                  >
                    Add Memo
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
                          name={pendingItemControlFields(index).pendingMemo}
                          label="Pending Memo*"
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

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.disabled">
                  List of items awaiting action for this memo
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Memo Settings
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'flex-start',
                gap: 2,
                width: '100%',
              }}
            >
              <Box sx={{ flex: 1, width: { xs: '100%' } }}>
                <Field.Select size="small" name="" label="Assignee">
                  {assignee.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
              <Box sx={{ flex: 1, width: { xs: '100%' } }}>
                <Field.Select size="small" name="" label="Visibility">
                  {MEMO_VISIBILITY.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
              <Box sx={{ flex: 1, width: { xs: '100%' } }}>
                <Field.DatePicker
                  name="deadline"
                  label="Deadline"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: false,
                      size: 'small',
                    },
                  }}
                />
              </Box>
              <Box>
                <Field.Text
                  size="small"
                  fullWidth
                  name="publishedBy"
                  label="Published By"
                  value={user?.displayName}
                  disabled
                />
              </Box>
            </Box>
          </Box>
        </Card>
      </Form>

      <Box sx={{ pt: 3, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Button variant="outlined" onClick={() => router.push(paths.management.memo.list)}>
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => {}}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            color="success"
          >
            Publish Memo
          </Button>
        </Box>
      </Box>
    </>
  );
}
