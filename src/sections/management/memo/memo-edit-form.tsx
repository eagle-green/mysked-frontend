import dayjs from 'dayjs';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { Label } from 'src/components/label/label';
import { Field, Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

//-----------------------------------------------------------------------------------------

const SAMPLE_FEED = [
  {
    name: 'Jerwin Fortillano',
    client_logo_url: null,
    feed_posted:
      'Desing & Implement create page completed. But need for some enahance for the layout and still working on it',
  },
  {
    name: 'Kiwoon Jung',
    client_logo_url: null,
    feed_posted:
      'Desing & Implement create page completed. But need for some enahance for the layout and still working on it',
  },
];

const SAMPLE_PENDING_MEMO = [
  {
    status: 'pending',
    isDone: false,
    pendingMemo: 'Implement table view for company wide memo',
  },
  {
    status: 'done',
    isDone: true,
    pendingMemo: 'Create company wide memo creation page',
  },
  {
    status: 'in_progress',
    isDone: false,
    pendingMemo: 'Create company wide memo edit page',
  },
];

const STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#FF9800' },
  { value: 'in_progress', label: 'In Progress', color: '#2196F3' },
  { value: 'done', label: 'done', color: '#4CAF50' },
];

type Props = {
  data: {
    id: string;
    memo_title: string;
    memo_content: string;
    published_date: Date;
    published_by: {
      first_name: string;
      client_logo_url: string | null;
      client_name: string | null;
    };
    assigned_by: {
      first_name: string;
      client_logo_url: string | null;
      client_name: string | null;
    };
    status: string;
    pendingItemDone: number;
    pendingItemCounts: number;
    client: {
      name: string;
      client_logo_url: string | null;
      client_name: string | null;
    };
    pendingMemos: { pendingMemo: string; status: string }[];
  };
};

export function EditCompanyWideMemoForm({ data }: Props) {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [shouldExtractExpiry, setShouldExtractExpiry] = useState<boolean>(false);
  const router = useRouter();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="h4">{data.memo_title}</Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Button variant="contained" onClick={() => router.push(paths.management.memo.list)}>
              Cancel
            </Button>

            {isEdit ? (
              <Button variant="contained" color="primary" onClick={() => setIsEdit(false)}>
                Edit
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => setIsEdit(true)}
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
                  color="success"
                >
                  Update Memo
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            gap: 2,
          }}
        >
          <Card sx={{ mt: 3, flex: 2 }}>
            <Box sx={{ px: 3, pt: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" color="text.disabled">
                      Published By
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      src={data?.published_by?.client_logo_url || undefined}
                      alt={data?.published_by?.client_name as string}
                      sx={{ width: 32, height: 32 }}
                    >
                      {data?.published_by?.first_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
                      {data.published_by.first_name}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:calendar-date-bold" sx={{ color: 'text.disabled' }} />
                    <Typography variant="subtitle1" color="text.disabled">
                      Published Date
                    </Typography>
                  </Stack>

                  <Typography variant="subtitle1">{`${dayjs(data.published_date).format('YYYY-MM-DD')}`}</Typography>
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', pt: 2 }} />
            </Box>

            <Box sx={{ px: 3, py: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" color="text.disabled">
                      Client
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      src={data?.client?.client_logo_url || undefined}
                      alt={data?.client?.client_name as string}
                      sx={{ width: 32, height: 32 }}
                    >
                      {data?.client?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
                      {data.client.name}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" color="text.disabled">
                      Assigned To
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,

                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Avatar
                        src={data?.assigned_by?.client_logo_url || undefined}
                        alt={data?.assigned_by?.client_name as string}
                        sx={{ width: 32, height: 32 }}
                      >
                        {data?.assigned_by?.first_name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
                        {data.assigned_by.first_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <IconButton color="primary">
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', pt: 2 }} />
            </Box>
          </Card>

          <Card sx={{ mt: 3, flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                p: 3,
              }}
            >
              <Typography variant="subtitle1">Overall Progress</Typography>
              <Box
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <CircularProgressWithLabel value={65} />
                <Typography variant="subtitle1" color="text.disabled">
                  Pending memo items are on track. The estimated completion is based on the
                  percentage of the task that has been completed.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: 3,
            width: '100%',
          }}
        >
          <Card sx={{ mt: 3, flex: 2 }}>
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
              <Box>
                <Typography variant="subtitle1" color="text.disabled">
                  Memo Content
                </Typography>
              </Box>
              <Divider sx={{ borderStyle: 'dashed', pt: 1 }} />

              <Box sx={{ pt: 2, pb: 2 }}>
                <Typography variant="body1">{data.memo_content}</Typography>
              </Box>
            </Box>
          </Card>

          <Card sx={{ mt: 3, flex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                p: 3,
              }}
            >
              <Typography variant="subtitle1">Post an Update</Typography>
              <Box
                sx={{
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  width: '100%',
                }}
              >
                <Field.Text
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add your progress update or comment ..."
                  name="memoDescription"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <Button
                    variant="contained"
                    onClick={() => {}}
                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                    color="success"
                  >
                    Post Update
                  </Button>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: 3,
            width: '100%',
          }}
        >
          <Card sx={{ mt: 3, flex: 2 }}>
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1">Pending Items</Typography>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    onClick={() => {}}
                    startIcon={<Iconify icon="solar:pen-bold" />}
                    color="primary"
                    size="small"
                  >
                    Update Pending Memo
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ borderStyle: 'dashed', pt: 1 }} />

              <Box sx={{ pt: 2, pb: 2 }}>
                {SAMPLE_PENDING_MEMO.map((task, index) => (
                  <Box
                    sx={{
                      backgroundColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      p: 2,
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <FormControlLabel
                          key={`${task.status}-index${index}`}
                          control={<Checkbox checked={task.isDone} />}
                          label=""
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-start',
                          width: '100%',
                        }}
                      >
                        <Typography variant="subtitle1">{task.pendingMemo}</Typography>
                      </Box>

                      <Box>
                        <Label variant="soft" color={getStatusColor(task.status)}>
                          {STATUSES.find((s) => s.value === task.status)?.label || task.status}
                        </Label>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          <Card sx={{ mt: 3, flex: 1, backgroundColor: 'transparent' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                p: 3,
                width: '100%',
                gap: 2,
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1">Activity Feed</Typography>
                <Divider sx={{ borderStyle: 'dashed', py: 1 }} />
              </Box>

              <Box
                sx={{
                  pt: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 2,
                  width: '100%',
                }}
              >
                {SAMPLE_FEED.map((assignee, index) => (
                  <Box
                    key={`${assignee.name}-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 1,
                      width: '100%',
                    }}
                  >
                    <Box sx={{ width: 50 }}>
                      <Avatar
                        src={assignee?.client_logo_url || undefined}
                        alt={assignee?.name as string}
                        sx={{ width: 32, height: 32 }}
                      >
                        {assignee.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </Box>

                    <Card sx={{ borderRadius: 1, flex: 1 }}>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Box sx={{ py: 1 }}>
                          <Typography variant="caption">{assignee.name}</Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2">{assignee.feed_posted}</Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Box>
      </Form>
    </>
  );
}

export function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" color="success" size={75} {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}
