import type { ReactNode } from 'react';
import type { IJob } from 'src/types/job';
import type { IIncidentReport } from 'src/types/incident-report';

import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';

import { getPositionColor } from 'src/utils/format-role';
import { fTime, fDateTime } from 'src/utils/format-time';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';
import {
  useUpdateIncidentReportRequest,
  useCreateIncidentReportComment,
} from 'src/actions/incident-report';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label/label';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

//----------------------------------------------------------------------------------------------------

type Props = {
  data: {
    incident_report: IIncidentReport;
    job: IJob;
    workers: any[];
    comments: any[];
  };
};

const INCIDENT_SEVERITY = [
  { label: 'Minor', caption: '(No injuries, no major disruptions)', value: 'minor' },
  {
    label: 'Moderate',
    caption: '(Injuries reported, traffic flow disrupted temporarily)',
    value: 'moderate',
  },
  {
    label: 'Severe',
    caption: '(Serious injuries or fatalities, major traffic disruption)',
    value: 'severe',
  },
];

const INCIDENT_REPORT_TYPE = [
  { label: 'Traffic Accident', value: 'traffic accident' },
  { label: 'Equipment Malfunction', value: 'equipment malfunction' },
  { label: 'Safety Violation', value: 'safety violation' },
  { label: 'Unauthorized Access', value: 'unauthorized access' },
  { label: 'Construction Site Disruption', value: 'construction site disruption' },
  { label: 'Weather/Environmental Incident', value: 'wetaher incident' },
  { label: 'Personnel Injury/Accident', value: 'personnel accident' },
  { label: 'Traffic Signal Failure', value: 'traffic signal failure' },
  { label: 'Road Blockage/Obstruction', value: 'road obstruction' },
  { label: 'Work Zone Inadequacy', value: 'work zone inadequacy' },
  { label: 'Public Interaction or Dispute', value: 'public interaction' },
  { label: 'Other', value: 'others' },
];

const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option ? option.label : type;
};

const formatMinutesToHours = (minutes: number | null | undefined): string => {
  if (!minutes && minutes !== 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const CommentSchema = z.object({
  comment: z.string().min(1, { message: 'Comment is required!' }),
});

type CommentSchemaType = z.infer<typeof CommentSchema>;

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
];

export function AdminIncidentReportDetail({ data }: Props) {
  const { incident_report, job, comments = [], workers = [] } = data || {};
  const { user } = useAuthContext();
  // Workers are nested in job.workers, use that if available, otherwise fall back to workers prop
  const jobWorkers = job?.workers || workers || [];
  const mdUp = useMediaQuery((theme: any) => theme.breakpoints.up('md'));
  const imageDialog = useBoolean();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const createComment = useCreateIncidentReportComment();

  // Main comment form
  const commentMethods = useForm<CommentSchemaType>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      comment: '',
    },
  });

  const {
    reset: resetComment,
    handleSubmit: handleCommentSubmit,
    formState: { isSubmitting: isSubmittingComment },
  } = commentMethods;

  const onSubmitComment = handleCommentSubmit(async (commentData) => {
    if (!incident_report?.id) return;

    try {
      await createComment.mutateAsync({
        id: incident_report.id,
        description: commentData.comment,
      });
      toast.success('Comment posted successfully!');
      resetComment();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    }
  });

  // Reply form
  const replyMethods = useForm<CommentSchemaType>({
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

  const onSubmitReply = handleReplySubmit(async (replyData) => {
    if (!incident_report?.id || !replyingTo) return;

    try {
      await createComment.mutateAsync({
        id: incident_report.id,
        description: replyData.comment,
        parent_id: replyingTo,
      });
      toast.success('Reply posted successfully!');
      resetReply();
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply. Please try again.');
    }
  });

  const queryClient = useQueryClient();
  
  // Comment edit/delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentInput, setEditCommentInput] = useState('');
  const deleteCommentDialog = useBoolean();
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, description }: { commentId: string; description: string }) => {
      if (!incident_report?.id) throw new Error('Incident report ID is required');
      const response = await fetcher([
        `${endpoints.incidentReport.detail(incident_report.id)}/comments/${commentId}`,
        {
          method: 'PUT',
          data: { description },
        },
      ]);
      return { response, commentId };
    },
    onSuccess: ({ response, commentId }) => {
      // Optimistically update the cache with the updated comment
        const updateCommentInArray = (commentsList: any[]): any[] => commentsList.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              description: response.data.comment.description,
              updated_at: response.data.comment.updated_at,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentInArray(comment.replies),
            };
          }
          return comment;
        });

      // Update cache for the query key used in the view
      queryClient.setQueryData(['incident-report', incident_report?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          comments: updateCommentInArray(oldData.comments || []),
        };
      });
      
      // Also invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['incident-report', incident_report?.id] });
      setEditingCommentId(null);
      setEditCommentInput('');
      toast.success('Comment updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!incident_report?.id) throw new Error('Incident report ID is required');
      const response = await fetcher([
        `${endpoints.incidentReport.detail(incident_report.id)}/comments/${commentId}`,
        {
          method: 'DELETE',
        },
      ]);
      return { commentId, hasReplies: response.data?.hasReplies || false };
    },
    onSuccess: ({ commentId, hasReplies }) => {
      // Optimistically update the cache
      queryClient.setQueryData(['incident-report', incident_report?.id], (oldData: any) => {
        if (!oldData) return oldData;
        
        const allComments = oldData.comments || [];
        
        // Check if comment has replies by looking for comments with parent_id === commentId
        // Check both flat structure (parent_id) and nested structure (replies array)
        const commentHasRepliesFlat = allComments.some((c: any) => c.parent_id === commentId);
        const foundComment = allComments.find((c: any) => c.id === commentId);
        const commentHasRepliesNested = foundComment?.replies && foundComment.replies.length > 0;
        const actualHasReplies = hasReplies || commentHasRepliesFlat || commentHasRepliesNested;
        
        // Update comments array - handle both flat and nested structures
        const updateCommentInArray = (commentsList: any[]): any[] => commentsList
            .map((comment: any) => {
              if (comment.id === commentId) {
                // If comment has replies, mark as deleted, otherwise remove it
                if (actualHasReplies) {
                  return {
                    ...comment,
                    description: '[deleted]',
                  };
                }
                // Return null to filter out comments without replies
                return null;
              }
              // Check nested replies
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentInArray(comment.replies),
                };
              }
              return comment;
            })
            .filter((comment: any) => comment !== null);
        
        const updatedComments = updateCommentInArray(allComments);
        
        return {
          ...oldData,
          comments: updatedComments,
        };
      });

      // Also invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['incident-report', incident_report?.id] });
      setCommentToDelete(null);
      deleteCommentDialog.onFalse();
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });

  const handleCommentEdit = useCallback((commentId: string) => {
    const comment = comments?.find((c: any) => c.id === commentId) || 
                    comments?.flatMap((c: any) => c.replies || []).find((r: any) => r.id === commentId);
    if (comment) {
      setEditCommentInput(comment.description);
      setEditingCommentId(comment.id);
    }
  }, [comments]);

  const handleCommentEditSave = useCallback(() => {
    if (!editingCommentId || !editCommentInput.trim()) return;
    updateCommentMutation.mutate({
      commentId: editingCommentId,
      description: editCommentInput.trim(),
    });
  }, [editingCommentId, editCommentInput, updateCommentMutation]);

  const handleCommentEditCancel = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentInput('');
  }, []);



  const handleCommentDelete = useCallback((commentId: string) => {
    setCommentToDelete(commentId);
    deleteCommentDialog.onTrue();
  }, [deleteCommentDialog]);

  const handleConfirmDeleteComment = useCallback(() => {
    if (commentToDelete) deleteCommentMutation.mutate(commentToDelete);
  }, [commentToDelete, deleteCommentMutation]);

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    resetReply();
  };

  // Recursive component to render nested replies
  const RenderReply = ({ 
    reply, 
    depth = 1,
    replyingTo: replyingToId,
    user: replyUser,
    replyMethods: replyFormMethods,
    onSubmitReply: onReplySubmit,
    handleCancelReply: onCancelReply,
    handleReplyClick: onReplyClick,
    isSubmittingReply: isSubmitting,
  }: { 
    reply: any; 
    depth?: number;
    replyingTo: string | null;
    user: any;
    replyMethods: any;
    onSubmitReply: any;
    handleCancelReply: () => void;
    handleReplyClick: (id: string) => void;
    isSubmittingReply: boolean;
  }) => {
    const paddingLeft = 8 + (depth - 1) * 8; // Increase padding for each level
    const isReplyingToThis = replyingToId === reply.id;
    const isDeleted = reply.description === '[deleted]';
    
    // Local state for editing this specific reply
    const [isEditing, setIsEditing] = React.useState(false);
    const [editInput, setEditInput] = React.useState('');

    const handleEdit = () => {
      setIsEditing(true);
      setEditInput(reply.description);
    };

    const handleCancel = () => {
      setIsEditing(false);
      setEditInput('');
    };

    const handleSave = () => {
      if (!editInput.trim()) return;
      updateCommentMutation.mutate({
        commentId: reply.id,
        description: editInput.trim(),
      });
      setIsEditing(false);
      setEditInput('');
    };

    const handleDelete = () => {
      handleCommentDelete(reply.id);
    };

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

            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                {fDateTime(reply.posted_date)}
              </Typography>
              {reply.updated_at && reply.updated_at !== reply.posted_date && (
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                  Edited {fDateTime(reply.updated_at)}
                </Typography>
              )}
            </Box>
            {isEditing ? (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <TextField
                  multiline
                  minRows={2}
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  autoFocus
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    size="small"
                    variant="contained"
                    loading={updateCommentMutation.isPending}
                    disabled={!editInput.trim()}
                    onClick={handleSave}
                  >
                    Save
                  </LoadingButton>
                </Stack>
              </Stack>
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              ...(isDeleted && {
                color: 'text.disabled',
                fontStyle: 'italic',
              }),
            }}
          >
            {!isDeleted && reply.tag_user && (
              <Box component="strong" sx={{ mr: 0.5 }}>
                @{reply.tag_user}
              </Box>
            )}
            {reply.description}
          </Typography>
        )}

            {isReplyingToThis && (
              <Box sx={{ mt: 2 }}>
                <Form methods={replyFormMethods} onSubmit={onReplySubmit}>
                  <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                    <Field.Text name="comment" placeholder="Write comment..." fullWidth autoFocus />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={onCancelReply}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        loading={isSubmitting}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                </Form>
              </Box>
            )}
          </Box>

          {!isDeleted && (
            <Box sx={{ display: 'flex', gap: 0.5, right: 0, position: 'absolute', alignItems: 'center' }}>
              {!isReplyingToThis && replyUser?.id !== reply.user?.id && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => onReplyClick(reply.id)}
                >
                  Reply
                </Button>
              )}
              {!isReplyingToThis && replyUser?.id === reply.user?.id && !isEditing && (
                <>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleEdit}
                    aria-label="Edit comment"
                  >
                    <Iconify icon="solar:pen-bold" width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleDelete}
                    aria-label="Delete comment"
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Recursively render nested replies */}
        {(reply.replies || []).map((nestedReply: any, nestedIndex: number) => (
          <RenderReply
            key={`${nestedReply.id}-${nestedIndex}`}
            reply={nestedReply}
            depth={depth + 1}
            replyingTo={replyingTo}
            user={user}
            replyMethods={replyMethods}
            onSubmitReply={onSubmitReply}
            handleCancelReply={handleCancelReply}
            handleReplyClick={handleReplyClick}
            isSubmittingReply={isSubmittingReply}
          />
        ))}
      </Box>
    );
  };

  const updateIncidentReport = useUpdateIncidentReportRequest();

  // Use incident_report.status directly, or derive from STATUS_OPTIONS
  const currentStatus = incident_report?.status || 'pending';

  // Parse evidence images from incident report
  const evidenceImages = useMemo(() => {
    if (!incident_report?.evidence) return [];
    try {
      if (typeof incident_report.evidence === 'string') {
        return JSON.parse(incident_report.evidence);
      }
      return Array.isArray(incident_report.evidence) ? incident_report.evidence : [];
    } catch {
      return [];
    }
  }, [incident_report?.evidence]);

  // Fetch timesheet data for the job (use admin endpoint for admin users)
  const { data: timesheetData } = useQuery({
    queryKey: ['timesheet-admin', job?.id],
    queryFn: async () => {
      if (!job?.id) return null;
      try {
        // Use admin endpoint to get timesheets without user filtering
        const response = await fetcher(`${endpoints.timesheet.admin}?job_id=${job.id}&limit=1`);
        // The admin API returns { success: true, data: { timesheets: [...], pagination: {...} } }
        const timesheets = response.data?.data?.timesheets || response.data?.timesheets || [];

        if (timesheets.length === 0) {
          return { timesheets: [], timesheetStatus: null };
        }

        // Get the first timesheet (usually there's one per job)
        const timesheet = timesheets[0];

        // Fetch entries for the timesheet
        try {
          const entryResponse = await fetcher(`/api/timesheets/${timesheet.id}`);
          // The detail endpoint returns { success: true, data: { ...timesheet, entries: [...] } }
          const entries = entryResponse.data?.data?.entries || entryResponse.data?.entries || [];

          return {
            timesheets: [
              {
                ...timesheet,
                entries,
              },
            ],
            timesheetStatus: timesheet.status,
          };
        } catch (error) {
          console.error(`Error fetching entries for timesheet ${timesheet.id}:`, error);
          return {
            timesheets: [timesheet],
            timesheetStatus: timesheet.status,
          };
        }
      } catch (error) {
        console.error('Error fetching timesheet:', error);
        return { timesheets: [], timesheetStatus: null };
      }
    },
    enabled: !!job?.id,
  });

  // Create worker timesheet map
  const workerTimesheetMap = useMemo(() => {
    const map = new Map();
    if (timesheetData?.timesheets && Array.isArray(timesheetData.timesheets)) {
      timesheetData.timesheets.forEach((timesheet: any) => {
        if (timesheet.entries && Array.isArray(timesheet.entries)) {
          timesheet.entries.forEach((entry: any) => {
            const workerId = entry.worker_id;
            if (workerId) {
              map.set(workerId, {
                ...entry,
                timesheetStatus: timesheet.status || timesheetData.timesheetStatus,
                timesheetId: timesheet.id,
              });
            }
          });
        }
      });
    }
    return map;
  }, [timesheetData]);

  // Get overall timesheet status (same as edit form)
  const timesheetStatus = useMemo(() => {
    if (timesheetData?.timesheetStatus) {
      return timesheetData.timesheetStatus;
    }
    if (
      timesheetData?.timesheets &&
      Array.isArray(timesheetData.timesheets) &&
      timesheetData.timesheets.length > 0
    ) {
      return timesheetData.timesheets[0]?.status || null;
    }
    return null;
  }, [timesheetData]);

  const isTimesheetSubmitted =
    timesheetStatus === 'submitted' ||
    timesheetStatus === 'confirmed' ||
    timesheetStatus === 'approved';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_review':
        return 'error';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (statusValue: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusValue);
    return option ? option.label : statusValue;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!incident_report?.id) return;

    try {
      await updateIncidentReport.mutateAsync({
        id: incident_report.id,
        data: {
          ...incident_report,
          status: newStatus,
        },
      });
      toast.success(`Status updated to ${getStatusLabel(newStatus)}!`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'info';
      case 'moderate':
        return 'warning';
      case 'high':
      case 'severe':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Stack sx={{ p: 2, gap: 3 }}>
        {/* First Row: Job #, Customer, Site, Client */}
        <Stack
          divider={
            <Divider
              flexItem
              orientation={mdUp ? 'vertical' : 'horizontal'}
              sx={{ borderStyle: 'dashed' }}
            />
          }
          sx={{ gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
        >
          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer title="JOB #" content={job?.job_number || ''} icon={null} />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="CUSTOMER"
              content={job?.company?.name || ''}
              icon={
                job?.company?.logo_url ? (
                  <Avatar
                    src={job.company.logo_url}
                    alt={job.company.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.company?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                ) : null
              }
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer title="SITE" content={job?.site?.display_address || ''} icon={null} />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="CLIENT"
              content={job?.client?.name || ''}
              icon={
                job?.client?.name ? (
                  <Avatar
                    src={job.client.logo_url || undefined}
                    alt={job.client.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job?.client?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                ) : null
              }
            />
          </Stack>
        </Stack>

        {/* Second Row: Job Date, PO | NW, Approver, Timesheet Manager */}
        <Stack
          divider={
            <Divider
              flexItem
              orientation={mdUp ? 'vertical' : 'horizontal'}
              sx={{ borderStyle: 'dashed' }}
            />
          }
          sx={{ gap: { xs: 3, md: 5 }, flexDirection: { xs: 'column', md: 'row' } }}
        >
          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="JOB DATE"
              content={job?.start_time ? dayjs(job.start_time).format('MMM DD, YYYY') : ''}
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="PO | NW"
              content={
                [job?.po_number, (job as any)?.network_number].filter(Boolean).join(' | ') || ''
              }
              icon={null}
            />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer title="APPROVER" content={(job as any)?.approver || ''} icon={null} />
          </Stack>

          <Stack sx={{ flex: 1 }}>
            <TextBoxContainer
              title="TIMESHEET MANAGER"
              content={
                job?.timesheet_manager
                  ? `${job.timesheet_manager.first_name || ''} ${job.timesheet_manager.last_name || ''}`.trim()
                  : ''
              }
              icon={
                job?.timesheet_manager ? (
                  <Avatar
                    src={job.timesheet_manager.photo_url || undefined}
                    alt={`${job.timesheet_manager.first_name} ${job.timesheet_manager.last_name}`}
                    sx={{ width: 32, height: 32 }}
                  >
                    {job.timesheet_manager.first_name?.charAt(0)?.toUpperCase() || ''}
                  </Avatar>
                ) : null
              }
            />
          </Stack>
        </Stack>
      </Stack>

      <Card sx={{ mt: 3 }}>
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              pt: 3,
            }}
          >
            <Typography variant="h6">
              Workers
              <Typography typography="caption" color="text.disabled" display="block">
                List all personnel present or involved in this incident
              </Typography>
            </Typography>
            {timesheetStatus && (
              <Label
                variant="soft"
                color={
                  isTimesheetSubmitted
                    ? 'success'
                    : timesheetStatus === 'draft'
                      ? 'warning'
                      : 'default'
                }
              >
                Timesheet: {timesheetStatus.charAt(0).toUpperCase() + timesheetStatus.slice(1)}
              </Label>
            )}
          </Box>

          {jobWorkers.length > 0 ? (
            <Box sx={{ p: 3 }}>
              <Stack spacing={1}>
                {(() => {
                  // Track if we've already shown the timesheet manager to prevent duplicates
                  let timesheetManagerShown = false;

                  return [...jobWorkers]
                    .sort((a, b) => {
                      const aIsTM =
                        a.id === job?.timesheet_manager_id ||
                        a.user_id === job?.timesheet_manager_id;
                      const bIsTM =
                        b.id === job?.timesheet_manager_id ||
                        b.user_id === job?.timesheet_manager_id;
                      if (aIsTM && !bIsTM) return -1;
                      if (!aIsTM && bIsTM) return 1;
                      return 0;
                    })
                    .map((worker, index) => {
                      const positionLabel =
                        JOB_POSITION_OPTIONS.find((option) => option.value === worker.position)
                          ?.label ||
                        worker.position ||
                        'Unknown Position';

                      // Check if this worker is the timesheet manager (check both id and user_id)
                      const isTimesheetManagerMatch =
                        worker.id === job?.timesheet_manager_id ||
                        worker.user_id === job?.timesheet_manager_id;
                      // Only show the chip if this worker matches AND we haven't shown it yet
                      const isTimesheetManager = isTimesheetManagerMatch && !timesheetManagerShown;
                      if (isTimesheetManager) {
                        timesheetManagerShown = true;
                      }
                      const workerId = worker.id || worker.user_id;
                      const timesheetEntry = workerTimesheetMap.get(workerId);

                      return (
                        <Box
                          key={`${worker.id || worker.user_id}-${index}`}
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 1,
                            p: { xs: 1.5, md: 1 },
                            border: { xs: '1px solid', md: 'none' },
                            borderColor: { xs: 'divider', md: 'transparent' },
                            borderRadius: 1,
                            bgcolor: { xs: 'background.neutral', md: 'transparent' },
                            alignItems: { xs: 'flex-start', md: 'center' },
                          }}
                        >
                          {/* Position Label and Worker Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                              minWidth: 0,
                              flex: { md: 1 },
                            }}
                          >
                            {/* Position Label */}
                            <Chip
                              label={positionLabel}
                              size="small"
                              variant="soft"
                              color={getPositionColor(worker.position)}
                              sx={{
                                minWidth: 60,
                                flexShrink: 0,
                                alignSelf: 'flex-start',
                              }}
                            />

                            {/* Avatar, Worker Name, and Timesheet Manager Label */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                minWidth: 0,
                              }}
                            >
                              <Avatar
                                src={worker?.photo_url ?? undefined}
                                alt={worker?.first_name}
                                sx={{
                                  width: { xs: 28, md: 32 },
                                  height: { xs: 28, md: 32 },
                                  flexShrink: 0,
                                }}
                              >
                                {worker?.first_name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  minWidth: 0,
                                }}
                              >
                                {worker.first_name} {worker.last_name}
                              </Typography>
                              {/* Timesheet Manager Label */}
                              {isTimesheetManager && (
                                <Chip
                                  label="Timesheet Manager"
                                  size="small"
                                  color="info"
                                  variant="soft"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.625rem',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Time Info */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            {(() => {
                              // Show timesheet details if submitted, otherwise show job times
                              if (isTimesheetSubmitted && timesheetEntry) {
                                // Calculate total travel time
                                let totalTravelMinutes = 0;

                                if (
                                  timesheetEntry.total_travel_minutes !== null &&
                                  timesheetEntry.total_travel_minutes !== undefined &&
                                  timesheetEntry.total_travel_minutes > 0
                                ) {
                                  totalTravelMinutes = timesheetEntry.total_travel_minutes;
                                } else if (
                                  timesheetEntry.travel_start &&
                                  timesheetEntry.travel_end
                                ) {
                                  const travelStart = dayjs(timesheetEntry.travel_start);
                                  const travelEnd = dayjs(timesheetEntry.travel_end);
                                  if (travelStart.isValid() && travelEnd.isValid()) {
                                    let diff = travelEnd.diff(travelStart, 'minute');
                                    if (diff < 0 && travelEnd.hour() < 6) {
                                      diff = travelEnd.add(1, 'day').diff(travelStart, 'minute');
                                    }
                                    totalTravelMinutes = Math.abs(diff);
                                  }
                                }
                                if (totalTravelMinutes === 0) {
                                  const travelTo = Number(timesheetEntry.travel_to_minutes) || 0;
                                  const travelDuring =
                                    Number(timesheetEntry.travel_during_minutes) || 0;
                                  const travelFrom =
                                    Number(timesheetEntry.travel_from_minutes) || 0;
                                  totalTravelMinutes = travelTo + travelDuring + travelFrom;
                                }

                                return (
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      {timesheetEntry.shift_start
                                        ? fTime(timesheetEntry.shift_start)
                                        : 'N/A'}{' '}
                                      -{' '}
                                      {timesheetEntry.shift_end
                                        ? fTime(timesheetEntry.shift_end)
                                        : 'N/A'}
                                    </Typography>
                                    {timesheetEntry.break_total_minutes !== null &&
                                      timesheetEntry.break_total_minutes !== undefined && (
                                        <Typography variant="body2" color="text.secondary">
                                          Break:{' '}
                                          {formatMinutesToHours(timesheetEntry.break_total_minutes)}
                                        </Typography>
                                      )}
                                    {timesheetEntry.shift_total_minutes !== null &&
                                      timesheetEntry.shift_total_minutes !== undefined && (
                                        <Typography variant="body2" color="text.secondary">
                                          Work:{' '}
                                          {formatMinutesToHours(timesheetEntry.shift_total_minutes)}
                                        </Typography>
                                      )}
                                    {totalTravelMinutes > 0 && (
                                      <Typography variant="body2" color="text.secondary">
                                        Travel: {formatMinutesToHours(totalTravelMinutes)}
                                      </Typography>
                                    )}
                                  </>
                                );
                              } else {
                                // If timesheet is draft or not submitted, show job times
                                const startTime = job?.start_time ? fTime(job.start_time) : '';
                                const endTime = job?.end_time ? fTime(job.end_time) : '';
                                return (
                                  <>
                                    <Iconify icon="solar:clock-circle-bold" width={16} />
                                    <Typography variant="body2">
                                      {startTime} - {endTime}
                                    </Typography>
                                  </>
                                );
                              }
                            })()}
                          </Box>
                        </Box>
                      );
                    });
                })()}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No workers assigned to this job
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      <Card sx={{ mt: 3 }}>
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              pt: 3,
            }}
          >
            <Typography variant="h6">
              Vehicles
              <Typography typography="caption" color="text.disabled" display="block">
                List all vehicles assigned to this job
              </Typography>
            </Typography>
          </Box>

          {job?.vehicles && job.vehicles.length > 0 ? (
            <Box sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                {job.vehicles.map((vehicle: any, index: number) => (
                  <Box
                    key={vehicle.id || index}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      justifyContent: { xs: 'flex-start', sm: 'space-between' },
                      gap: { xs: 1, sm: 2 },
                      p: { xs: 1.5, md: 0 },
                      border: { xs: '1px solid', md: 'none' },
                      borderColor: { xs: 'divider', md: 'transparent' },
                      borderRadius: 1,
                    }}
                  >
                    {/* Vehicle Info */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                        flex: { xs: 'none', sm: 1 },
                        mb: { xs: vehicle.operator ? 1 : 0, sm: 0 },
                      }}
                    >
                      <Chip
                        label={formatVehicleType(vehicle.type)}
                        size="medium"
                        variant="outlined"
                        sx={{ minWidth: 80, flexShrink: 0 }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {vehicle.license_plate} - {vehicle.unit_number}
                      </Typography>
                    </Box>

                    {/* Operator Info */}
                    {vehicle.operator && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexShrink: 0,
                          ml: { xs: 1, sm: 0 },
                        }}
                      >
                        <Avatar
                          src={vehicle.operator?.photo_url ?? undefined}
                          alt={vehicle.operator?.first_name}
                          sx={{
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            flexShrink: 0,
                          }}
                        >
                          {vehicle.operator?.first_name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                          }}
                        >
                          {vehicle.operator.first_name} {vehicle.operator.last_name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No vehicles assigned to this job
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      <Card sx={{ mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h6">Job Incident Report Detail</Typography>
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
                const option = STATUS_OPTIONS.find((opt) => opt.value === selected);
                return option ? (
                  <Label variant="soft" color={getStatusColor(selected)}>
                    {option.label}
                  </Label>
                ) : (
                  selected
                );
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 3,
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                width: '100%',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Date of Incident
                </Typography>
                <Typography variant="body2">
                  {incident_report.dateOfIncident
                    ? dayjs(incident_report.dateOfIncident).format('MMM DD, YYYY')
                    : '-'}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Time of Incident
                </Typography>
                <Typography variant="body2">
                  {incident_report.timeOfIncident ? fTime(incident_report.timeOfIncident) : '-'}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                width: '100%',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Incident Report Type
                </Typography>
                <Typography variant="body2">
                  {incident_report.incidentType
                    ? INCIDENT_REPORT_TYPE.find((opt) => opt.value === incident_report.incidentType)
                        ?.label || incident_report.incidentType
                    : '-'}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Incident Severity
                </Typography>
                <Label variant="soft" color={getSeverityColor(incident_report.incidentSeverity)}>
                  {incident_report.incidentSeverity
                    ? INCIDENT_SEVERITY.find(
                        (opt) => opt.value === incident_report.incidentSeverity
                      )?.label || incident_report.incidentSeverity
                    : '-'}
                </Label>
              </Box>
            </Box>

            <Box sx={{ width: '100%' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: 'block' }}
              >
                Report Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {incident_report.reportDescription || '-'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <Card sx={{ mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Evidence / Attachments
          </Typography>

          {evidenceImages.length > 0 ? (
            <Grid container spacing={2}>
              {evidenceImages.map((image: string, index: number) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                  <Box
                    sx={{
                      position: 'relative',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 2,
                      },
                    }}
                    onClick={() => {
                      setSelectedImage(image);
                      imageDialog.onTrue();
                    }}
                  >
                    <Box
                      component="img"
                      src={image}
                      alt={`Evidence ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'contain',
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Image {index + 1}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box
              sx={{
                border: 2,
                borderColor: 'divider',
                borderStyle: 'dashed',
                borderRadius: 1,
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No evidence attached to this incident report
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      <Card sx={{ mt: 3 }}>
        <Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
            }}
          >
            <Typography variant="h6" sx={{ my: 1 }}>
              Comments
            </Typography>
          </Box>

          <Box sx={{ px: 3, pb: 3 }}>
            {/* Comment Form at the top */}
            <Box
              sx={{
                pt: 3,
                pb: 3,
                borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
              }}
            >
              <Form methods={commentMethods} onSubmit={onSubmitComment}>
                <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
                  <Field.Text
                    name="comment"
                    placeholder="Write some of your comments..."
                    multiline
                    rows={4}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" loading={isSubmittingComment}>
                      Post comment
                    </Button>
                  </Box>
                </Box>
              </Form>
            </Box>

            {/* Comments List */}
            {(comments || []).map((comment, index) => {
              const isReplying = replyingTo === comment.id;
              const isDeleted = comment.description === '[deleted]';

              return (
                <Box key={`${comment.id}-${index}`}>
                  <Box
                    sx={{
                      pt: 3,
                      gap: 2,
                      display: 'flex',
                      position: 'relative',
                    }}
                  >
                    <Avatar
                      alt={comment?.user.name as string}
                      src={comment?.user.photo_logo_url || undefined}
                      sx={{ width: 48, height: 48 }}
                    >
                      {comment.user?.name?.charAt(0)?.toUpperCase()}
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
                        {comment.user?.name}
                      </Typography>

                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                          {fDateTime(comment.posted_date)}
                        </Typography>
                        {comment.updated_at && comment.updated_at !== comment.posted_date && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                            Edited {fDateTime(comment.updated_at)}
                          </Typography>
                        )}
                      </Box>
                      {editingCommentId === comment.id ? (
                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                          <TextField
                            multiline
                            minRows={2}
                            value={editCommentInput}
                            onChange={(e) => setEditCommentInput(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                          />
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={handleCommentEditCancel}
                            >
                              Cancel
                            </Button>
                            <LoadingButton
                              size="small"
                              variant="contained"
                              loading={updateCommentMutation.isPending}
                              disabled={!editCommentInput.trim()}
                              onClick={handleCommentEditSave}
                            >
                              Save
                            </LoadingButton>
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1,
                            ...(isDeleted && {
                              color: 'text.disabled',
                              fontStyle: 'italic',
                            }),
                          }}
                        >
                          {comment.description}
                        </Typography>
                      )}

                      {!isDeleted && isReplying && (
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

                    {!isDeleted && (
                      <Box sx={{ display: 'flex', gap: 0.5, right: 0, position: 'absolute', alignItems: 'center' }}>
                        {!isReplying && user?.id !== comment.user?.id && (
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => handleReplyClick(comment.id)}
                          >
                            Reply
                          </Button>
                        )}
                        {!isReplying && user?.id === comment.user?.id && editingCommentId !== comment.id && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleCommentEdit(comment.id)}
                              aria-label="Edit comment"
                            >
                              <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCommentDelete(comment.id)}
                              aria-label="Delete comment"
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Render replies recursively */}
                  {(comment.replies || []).map((reply: any, replyIndex: number) => (
                    <RenderReply 
                      key={`${reply.id}-${replyIndex}`} 
                      reply={reply} 
                      depth={1}
                      replyingTo={replyingTo}
                      user={user}
                      replyMethods={replyMethods}
                      onSubmitReply={onSubmitReply}
                      handleCancelReply={handleCancelReply}
                      handleReplyClick={handleReplyClick}
                      isSubmittingReply={isSubmittingReply}
                    />
                  ))}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Card>

      <Dialog
        fullWidth
        maxWidth="lg"
        open={imageDialog.value}
        onClose={imageDialog.onFalse}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.default',
              maxHeight: '90vh',
            },
          },
        }}
      >
        <DialogTitle>
          Evidence Image
          <IconButton
            aria-label="close"
            onClick={imageDialog.onFalse}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Evidence"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteCommentDialog.value}
        onClose={deleteCommentDialog.onFalse}
        title="Delete comment"
        content="Are you sure you want to delete this comment? This cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteComment}
            disabled={deleteCommentMutation.isPending}
          >
            {deleteCommentMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}

type TextProps = {
  content: string | ReactNode;
  title?: string;
  icon: ReactNode;
};

export function TextBoxContainer({ content, title, icon }: TextProps) {
  return (
    <Box
      sx={{
        mb: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {icon}
        {typeof content === 'string' ? (
          <Typography variant="body1" sx={{ fontSize: '.9rem' }}>
            {content}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }}>{content}</Box>
        )}
      </Box>
    </Box>
  );
}
