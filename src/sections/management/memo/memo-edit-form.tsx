import { z } from 'zod';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { fDateTime } from 'src/utils/format-time';

import { endpoints, fetcher } from 'src/lib/axios';

import { Label } from 'src/components/label/label';
import { Field, Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { MemoStatus } from 'src/types/memo';

//-----------------------------------------------------------------------------------------

const STATUSES: { value: string; label: string; color: string }[] = [
  { value: MemoStatus.pending, label: 'Pending', color: 'warning' },
  { value: MemoStatus.done, label: 'done', color: 'success' },
  { value: MemoStatus.in_progress, label: 'In Progress', color: 'info' },
];

type Props = {
  data: any;
};

const EditWideMemoSchema = z.object({
  id: z.string().optional(),
  assignee_id: z.string().min(1, 'Please select assignee.'),
  memo_title: z.string().min(1, 'title is required'),
  memo_content: z.string().min(1, 'Memon content is required'),
  memo_visibility: z.boolean(),
  pending_items: z
    .array(
      z.object({
        memo_title: z.string().min(1, 'Required title field .'),
        assignee_id: z.string().min(1, 'Required title field .'),
        status: z.string().min(1, 'Required status field .'),
      })
    )
    .min(1, { message: 'At least one pending memo!' }),
});
type MemoShcemaType = z.infer<typeof EditWideMemoSchema>;

export function EditCompanyWideMemoForm({ data }: Props) {
  const { user } = useAuthContext();
  const pendingItemDialog = useBoolean();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const methods = useForm<MemoShcemaType>({
    mode: 'all',
    defaultValues: data,
  });

  const CommentSchema = z.object({
    comment: z.string().min(1, { message: 'Comment is required!' }),
  });

  type commentSchemaType = z.infer<typeof CommentSchema>;

  // Post update form
  const commentMethod = useForm<commentSchemaType>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      comment: '',
    },
  });

  const replyMethods = useForm<commentSchemaType>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      comment: '',
    },
  });

  const {
    reset: resetReply,
    handleSubmit: handleReplySubmit,
    formState: { isSubmitting: isSubmittingReply },
  } = replyMethods;

  const {
    reset: resetUpdateForm,
    handleSubmit: handlePostSubmit,
    formState: { isSubmitting: isSubmittingComment },
  } = commentMethod;

  const onSubmitComment = handlePostSubmit(async (postData) => {
    console.log(postData);
  });

  const onSubmitReply = handleReplySubmit(async (replyData) => {
    console.log(replyData);
  });

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    resetReply();
  };

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

  const doneCount = data?.pending_items?.reduce((count: any, memo: any) => {
    if (memo?.status === 'done') {
      count += 1;
    }
    return count;
  }, 0);

  const calculateProgress = () => {
    const currentMemos = data?.pending_items || [];
    if (doneCount <= 0 && !currentMemos.length) return 100;
    return (doneCount / currentMemos.length) * 100;
  };

  const RenderReply = ({ reply, depth = 1 }: { reply: any; depth?: number }) => {
    const isReplyingToThis = replyingTo === reply.id;
    const paddingLeft = 8 + (depth - 1) * 8; // Increase padding for each level

    return (
      <Box>
        <Box
          sx={{
            pt: 3,
            gap: 2,
            display: 'flex',
            position: 'relative',
            pl: paddingLeft,
          }}
        >
          <Avatar
            alt={reply?.user.name as string}
            src={reply?.user.photo_logo_url || undefined}
            sx={{ width: 48, height: 48 }}
          >
            {reply.user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Box
            sx={(theme) => ({
              pb: 3,
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
              borderBottom: `solid 1px ${theme.vars.palette.divider}`,
            })}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {reply.user?.name}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {fDateTime(reply.posted_date)}
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              {reply.tag_user && (
                <Box component="strong" sx={{ mr: 0.5 }}>
                  @{reply.tag_user}
                </Box>
              )}
              {reply.description}
            </Typography>

            {isReplyingToThis && (
              <Box sx={{ mt: 2 }}>
                <Form methods={replyMethods} onSubmit={onSubmitReply}>
                  <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                    <Field.Text name="comment" placeholder="Write comment..." fullWidth autoFocus />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={handleCancelReply}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        loading={isSubmittingReply}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                </Form>
              </Box>
            )}
          </Box>

          {!isReplyingToThis && user?.id !== reply.user?.id && (
            <Button
              size="small"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" width={16} />}
              onClick={() => handleReplyClick(reply.id)}
              sx={{ right: 0, position: 'absolute' }}
            >
              Reply
            </Button>
          )}
        </Box>

        {/* Recursively render nested replies */}
        {(reply.replies || []).map((nestedReply: any, nestedIndex: number) => (
          <RenderReply
            key={`${nestedReply.id}-${nestedIndex}`}
            reply={nestedReply}
            depth={depth + 1}
          />
        ))}
      </Box>
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!data?.id) return;
  };

  const renderPendingItemFormDialog = () => (
    <PendingItemFormDialog
      open={pendingItemDialog.value}
      onClose={pendingItemDialog.onFalse}
      onUpdateSuccess={pendingItemDialog.onFalse}
    />
  );

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
                    <Typography variant="caption" color="text.disabled">
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
                      src={data?.published_by?.logo_url || undefined}
                      alt={data?.published_by?.name as string}
                      sx={{ width: 32, height: 32 }}
                    >
                      {data?.published_by?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
                      {data.published_by?.name}
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
                    <Typography variant="caption" color="text.disabled">
                      Published Date
                    </Typography>
                  </Stack>

                  <Typography variant="subtitle2">{`${dayjs(data.published_date).format('MMM DD, YYYY')}`}</Typography>
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
                    <Typography variant="caption" color="text.disabled">
                      Due Date
                    </Typography>
                  </Stack>

                  <Typography variant="body1">{`${dayjs(data.due_date).format('MMM DD, YYYY')}`}</Typography>
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', pt: 2 }} />

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
                <CircularProgressWithLabel value={calculateProgress()} />
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
          <Card sx={{ mt: 3, flex: 1 }}>
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1">Pending Items</Typography>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    onClick={pendingItemDialog.onTrue}
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                    color="primary"
                    size="small"
                  >
                    Add Pending Item
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ borderStyle: 'dashed', pt: 1 }} />

              <Box sx={{ pt: 2, pb: 2 }}>
                {data.pending_items.map((task: any, index: number) => {
                  const currentStatus = task.status || MemoStatus.pending;
                  return (
                    <Box
                      key={`${index}`}
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
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 2,
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
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
                              src={task?.user?.photo_logo_url || undefined}
                              alt={task?.user?.name as string}
                              sx={{ width: 32, height: 32 }}
                            >
                              {task?.user?.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
                              {task?.user?.name}
                            </Typography>
                          </Box>

                          <Box>
                            <Select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              size="small"
                              sx={{
                                minWidth: 150,
                                '& .MuiSelect-select': {
                                  py: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                },
                              }}
                              renderValue={(selected) => {
                                const option = STATUSES.find((opt) => opt.value === selected);
                                return option ? (
                                  <Label variant="soft" color={getStatusColor(selected)}>
                                    {option.label}
                                  </Label>
                                ) : (
                                  selected
                                );
                              }}
                            >
                              {STATUSES.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            width: '100%',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body1">{task.memo_title}</Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.disabled">
                            Created At: {dayjs(task?.createdAt).format('MM-DD-YYYY hh:mm A')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
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
                <Typography variant="subtitle1">Comments</Typography>
                <Divider sx={{ borderStyle: 'dashed', py: 1 }} />
              </Box>
              <Box sx={{ px: 3, pb: 3, width: '100%' }}>
                <Box
                  sx={{
                    pt: 3,
                    pb: 3,
                    borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
                  }}
                >
                  <Form methods={commentMethod} onSubmit={onSubmitComment}>
                    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
                      <Field.Text
                        name="comment"
                        placeholder="Write some of your comments..."
                        multiline
                        rows={4}
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="contained" loading={isSubmittingComment}>
                          Add comment
                        </Button>
                      </Box>
                    </Box>
                  </Form>
                </Box>
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
                {data.activity_feed?.map((post: any, index: number) => {
                  const isReplying = replyingTo === post.id;
                  return (
                    <Box key={`${post.id}-${index}`} sx={{ width: '100%', px: 2 }}>
                      <Box
                        sx={{
                          pt: 3,
                          gap: 2,
                          display: 'flex',
                          position: 'relative',
                          px: 2,
                        }}
                      >
                        <Avatar
                          alt={post?.user.name as string}
                          src={post?.user.photo_logo_url || undefined}
                          sx={{ width: 48, height: 48 }}
                        >
                          {post.user?.name?.charAt(0)?.toUpperCase()}
                        </Avatar>

                        <Box
                          sx={(theme) => ({
                            pb: 3,
                            display: 'flex',
                            flex: '1 1 auto',
                            flexDirection: 'column',
                            borderBottom: `solid 1px ${theme.vars.palette.divider}`,
                          })}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {post?.user?.name}
                          </Typography>

                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {fDateTime(post.posted_date)}
                          </Typography>

                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {post.description}
                          </Typography>

                          {isReplying && (
                            <Box sx={{ mt: 2 }}>
                              <Form methods={replyMethods} onSubmit={onSubmitReply}>
                                <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                                  <Field.Text
                                    name="comment"
                                    placeholder="Write comment..."
                                    fullWidth
                                    autoFocus
                                  />
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button size="small" onClick={handleCancelReply}>
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      variant="contained"
                                      size="small"
                                      loading={isSubmittingReply}
                                    >
                                      Reply
                                    </Button>
                                  </Box>
                                </Box>
                              </Form>
                            </Box>
                          )}
                        </Box>

                        {!isReplying && user?.id !== post.user?.id && (
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<Iconify icon="solar:pen-bold" width={16} />}
                            onClick={() => handleReplyClick(post.id)}
                            sx={{ right: 0, position: 'absolute' }}
                          >
                            Reply
                          </Button>
                        )}
                      </Box>

                      {/* Render replies recursively */}
                      {(post.replies || []).map((reply: any, replyIndex: number) => (
                        <RenderReply key={`${reply.id}-${replyIndex}`} reply={reply} depth={1} />
                      ))}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Card>
        </Box>
      </Form>
      {renderPendingItemFormDialog()}
    </>
  );
}

type PendingItemFormType = {
  open: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
};
export function PendingItemFormDialog({ open, onClose, onUpdateSuccess }: PendingItemFormType) {
  const theme = useTheme();
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));
  const pendingItemSchema = z.object({
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

  type pendingItemSchemaType = z.infer<typeof pendingItemSchema>;

  const methods = useForm<pendingItemSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(pendingItemSchema),
    defaultValues: {
      pending_items: [{ memo_title: '', assignee_id: '', status: MemoStatus.pending }],
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
    control,
  } = methods;

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

  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  const { data: userListData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'create-memo'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}`);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const adminLists =
    userListData
      ?.filter((x: any) => x?.role?.toLowerCase() == 'admin')
      ?.map((admin: any) => ({
        value: admin.id,
        label: `${admin.first_name} ${admin.last_name}`,
        photo_url: admin.photo_url || '',
        first_name: admin.first_name,
        last_name: admin.last_name,
      })) || [];

  return (
    <>
      <Dialog
        fullWidth
        maxWidth={false}
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: { maxWidth: 1190 },
          },
        }}
      >
        <DialogTitle>
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
        </DialogTitle>

        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Box sx={{ p: 2 }}>
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
                        {STATUSES.map((option) => (
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
          </DialogContent>

          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" variant="contained" loading={isSubmitting}>
              Save
            </Button>
          </DialogActions>
        </Form>
      </Dialog>
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
