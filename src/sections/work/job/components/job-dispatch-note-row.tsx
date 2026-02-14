import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { fDate, fTime, fDateTime } from 'src/utils/format-time';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { JobDispatchNoteExpandedRow } from './job-dispatch-note-expanded-row';

// ----------------------------------------------------------------------

type Worker = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
  phone_number?: string | null;
  position: string;
  start_time: string;
  end_time: string;
  status: string;
  is_timesheet_manager: boolean;
  vehicle?: {
    type: string;
    license_plate: string;
    unit_number: string;
  } | null;
};

type Job = {
  id: string;
  job_number: string;
  memo?: string | null;
  memo_created_by?: string | null;
  memo_created_at?: string | null;
  memo_updated_at?: string | null;
  memo_created_by_user?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  memo_updated_by_user?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
  created_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  updated_by?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  customer: {
    id: string;
    name: string;
    logo_url?: string | null;
  };
  client: {
    id: string;
    name: string;
    logo_url?: string | null;
    contact_number?: string | null;
  };
  location?: string;
  lct_count: number;
  tcp_count: number;
  hwy_count: number;
  field_supervisor_count: number;
  workers: Worker[];
  region?: string;
};

type Props = {
  job: Job;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedDate: string;
};

export function JobDispatchNoteRow({ job, isExpanded, onToggleExpand, selectedDate }: Props) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoValue, setMemoValue] = useState(job.memo || '');
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  
  // Check if current user can edit the memo
  // Admins can always add/edit, or if user created it, or if it's empty
  const isAdmin = user?.role === 'admin';
  const canEditMemo = isAdmin || !job.memo || job.memo_created_by === user?.id;
  
  // Check if memo is long (more than 50 characters)
  const isMemoLong = (job.memo?.length || 0) > 50;

  // Update memo mutation
  const updateMemoMutation = useMutation({
    mutationFn: async (memo: string) => {
      const url = `${endpoints.work.job}/${job.id}/memo`;
      return fetcher([url, {
        method: 'PATCH',
        data: { memo },
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-dispatch-note', selectedDate] });
      setIsEditingMemo(false);
      toast.success('Memo updated');
    },
    onError: () => {
      toast.error('Failed to update memo');
      setMemoValue(job.memo || '');
    },
  });

  const handleSaveMemo = () => {
    updateMemoMutation.mutate(memoValue);
  };

  const handleCancelMemo = () => {
    setMemoValue(job.memo || '');
    setIsEditingMemo(false);
  };

  const renderUserCell = (
    userInfo?: { first_name: string; last_name: string; photo_url?: string | null } | null,
    timestamp?: string
  ) => {
    if (!userInfo) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={userInfo.photo_url || undefined}
            alt={`${userInfo.first_name} ${userInfo.last_name}`}
            sx={{ width: 28, height: 28 }}
          >
            {userInfo.first_name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" noWrap>
            {userInfo.first_name} {userInfo.last_name}
          </Typography>
        </Box>
        {timestamp && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {fDateTime(timestamp)}
          </Typography>
        )}
      </Box>
    );
  };

  // Enhanced tooltip content for memo - ALWAYS show for memos
  const memoTooltipContent = job.memo ? (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
        {job.memo}
      </Typography>
      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        {job.memo_created_by_user && (
          <>
            <Typography variant="caption" display="block">
              By: {job.memo_created_by_user.first_name} {job.memo_created_by_user.last_name}
            </Typography>
            {job.memo_created_at && (
              <Typography variant="caption" display="block">
                Created: {fDate(job.memo_created_at, 'MMM DD YYYY')} {fTime(job.memo_created_at)}
              </Typography>
            )}
          </>
        )}
        {job.memo_updated_by_user && job.memo_updated_at && job.memo_updated_at !== job.memo_created_at && (
          <>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Last edited by: {job.memo_updated_by_user.first_name} {job.memo_updated_by_user.last_name}
            </Typography>
            <Typography variant="caption" display="block">
              Edited: {fDate(job.memo_updated_at, 'MMM DD YYYY')} {fTime(job.memo_updated_at)}
            </Typography>
          </>
        )}
      </Box>
      <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', opacity: 0.8 }}>
        Click to view in dialog
      </Typography>
    </Box>
  ) : null;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        {/* Memo */}
        <TableCell sx={{ width: 300, maxWidth: 300 }}>
          {isEditingMemo ? (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={3}
                value={memoValue}
                onChange={(e) => setMemoValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveMemo();
                  }
                  if (e.key === 'Escape') {
                    handleCancelMemo();
                  }
                }}
                autoFocus
                sx={{ fontSize: '0.875rem', minWidth: 200 }}
              />
              <IconButton 
                size="small" 
                onClick={handleSaveMemo} 
                disabled={updateMemoMutation.isPending}
                color="success"
              >
                <Iconify icon="solar:check-circle-bold" width={16} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleCancelMemo}
                color="error"
              >
                <Iconify icon="solar:close-circle-bold" width={16} />
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Box 
                sx={{ 
                  flex: 1, 
                  minWidth: 0,
                }}
              >
                {job.memo ? (
                  <Tooltip 
                    title={memoTooltipContent} 
                    arrow 
                    placement="top-start"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 400,
                          bgcolor: 'grey.900',
                        },
                      },
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      noWrap
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemoDialogOpen(true);
                      }}
                    >
                      {job.memo}
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.disabled"
                    sx={{ cursor: canEditMemo ? 'pointer' : 'default' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canEditMemo) setIsEditingMemo(true);
                    }}
                  >
                    {canEditMemo ? 'Add memo...' : ''}
                  </Typography>
                )}
              </Box>
              {job.memo && (
                <Tooltip 
                  title={
                    job.memo_updated_by_user 
                      ? `${job.memo_updated_by_user.first_name} ${job.memo_updated_by_user.last_name}` 
                      : job.memo_created_by_user 
                        ? `${job.memo_created_by_user.first_name} ${job.memo_created_by_user.last_name}`
                        : ''
                  }
                  arrow
                >
                  <Avatar
                    src={
                      job.memo_updated_by_user?.photo_url 
                        ? job.memo_updated_by_user.photo_url 
                        : job.memo_created_by_user?.photo_url || undefined
                    }
                    alt={
                      job.memo_updated_by_user 
                        ? `${job.memo_updated_by_user.first_name} ${job.memo_updated_by_user.last_name}`
                        : job.memo_created_by_user
                          ? `${job.memo_created_by_user.first_name} ${job.memo_created_by_user.last_name}`
                          : ''
                    }
                    sx={{ width: 20, height: 20, fontSize: '0.625rem' }}
                  >
                    {job.memo_updated_by_user 
                      ? job.memo_updated_by_user.first_name.charAt(0).toUpperCase()
                      : job.memo_created_by_user
                        ? job.memo_created_by_user.first_name.charAt(0).toUpperCase()
                        : ''
                    }
                  </Avatar>
                </Tooltip>
              )}
              {canEditMemo && !isMemoLong && (
                <IconButton
                  size="small"
                  onClick={() => setIsEditingMemo(true)}
                  sx={{ 
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                    '.MuiTableRow-root:hover &': { opacity: 1 },
                  }}
                >
                  <Iconify
                    icon="solar:pen-bold"
                    width={14}
                    color="primary"
                  />
                </IconButton>
              )}
            </Box>
          )}
        </TableCell>

        {/* Job Number */}
        <TableCell sx={{ width: 100 }}>
          <Typography variant="body2" fontWeight="600">
            {job.job_number}
          </Typography>
        </TableCell>

        {/* Created By */}
        <TableCell sx={{ width: 140 }}>
          {renderUserCell(job.created_by, job.created_at)}
        </TableCell>

        {/* Updated By */}
        <TableCell sx={{ width: 140 }}>
          {renderUserCell(job.updated_by, job.updated_at)}
        </TableCell>

        {/* Assigned Workers */}
        <TableCell sx={{ width: 200 }}>
          {job.workers.length > 0 ? (
            <Stack spacing={0.75}>
              {job.workers.slice(0, 3).map((worker) => (
                <Box key={worker.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                  <Avatar
                    src={worker.photo_url || undefined}
                    alt={`${worker.first_name} ${worker.last_name}`}
                    sx={{ width: 24, height: 24, flexShrink: 0 }}
                  >
                    {worker.first_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {worker.first_name} {worker.last_name}
                    </Typography>
                    {worker.phone_number && (
                      <Link
                        href={`tel:${worker.phone_number.replace(/\D/g, '')}`}
                        variant="caption"
                        color="primary"
                        underline="hover"
                        sx={{ display: 'block' }}
                      >
                        {formatPhoneNumberSimple(worker.phone_number)}
                      </Link>
                    )}
                  </Box>
                </Box>
              ))}
              {job.workers.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{job.workers.length - 3} more
                </Typography>
              )}
            </Stack>
          ) : null}
        </TableCell>

        {/* Customer */}
        <TableCell sx={{ width: 150 }}>
          {job.customer.name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={job.customer.logo_url || undefined}
                alt={job.customer.name}
                sx={{ width: 28, height: 28 }}
              >
                {job.customer.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {job.customer.name}
              </Typography>
            </Box>
          )}
        </TableCell>

        {/* Client */}
        <TableCell sx={{ width: 150 }}>
          {job.client.name && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Avatar
                src={job.client.logo_url || undefined}
                alt={job.client.name}
                sx={{ width: 28, height: 28, flexShrink: 0 }}
              >
                {job.client.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {job.client.name}
                </Typography>
                {job.client.contact_number && (
                  <Link
                    href={`tel:${job.client.contact_number.replace(/\D/g, '')}`}
                    variant="caption"
                    color="primary"
                    underline="hover"
                    sx={{ display: 'block', mt: 0.25 }}
                  >
                    {formatPhoneNumberSimple(job.client.contact_number)}
                  </Link>
                )}
              </Box>
            </Box>
          )}
        </TableCell>

        {/* Location */}
        <TableCell sx={{ width: 120 }}>
          {job.location && (
            <Typography variant="body2">{job.location}</Typography>
          )}
        </TableCell>

        {/* LCT */}
        <TableCell sx={{ width: 60, textAlign: 'center' }}>
          {job.lct_count > 0 && (
            <Typography variant="body2">{job.lct_count}</Typography>
          )}
        </TableCell>

        {/* TCP */}
        <TableCell sx={{ width: 60, textAlign: 'center' }}>
          {job.tcp_count > 0 && (
            <Typography variant="body2">{job.tcp_count}</Typography>
          )}
        </TableCell>

        {/* Expand Button */}
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small" onClick={onToggleExpand}>
            <Iconify
              icon={isExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded Row */}
      <TableRow>
        <TableCell colSpan={11} sx={{ py: 0, px: 0 }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <JobDispatchNoteExpandedRow workers={job.workers} />
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Memo Dialog - Moved outside TableRow to fix click issues */}
      {memoDialogOpen && (
        <Dialog
          open={memoDialogOpen}
          onClose={() => setMemoDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Memo - Job {job.job_number}</Typography>
              <IconButton size="small" onClick={() => setMemoDialogOpen(false)}>
                <Iconify icon="solar:close-circle-bold" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {job.memo}
              </Typography>
              {job.memo_created_by_user && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Created by
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Avatar
                      src={job.memo_created_by_user.photo_url || undefined}
                      alt={`${job.memo_created_by_user.first_name} ${job.memo_created_by_user.last_name}`}
                      sx={{ width: 32, height: 32 }}
                    >
                      {job.memo_created_by_user.first_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      {job.memo_created_by_user.first_name} {job.memo_created_by_user.last_name}
                    </Typography>
                  </Box>
                  {job.memo_created_at && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 5 }}>
                      {fDate(job.memo_created_at, 'MMM DD YYYY')} at {fTime(job.memo_created_at)}
                    </Typography>
                  )}
                  {job.memo_updated_by_user && job.memo_updated_at && job.memo_updated_at !== job.memo_created_at && (
                    <>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, mt: 2 }}>
                        Last edited by
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Avatar
                          src={job.memo_updated_by_user.photo_url || undefined}
                          alt={`${job.memo_updated_by_user.first_name} ${job.memo_updated_by_user.last_name}`}
                          sx={{ width: 32, height: 32 }}
                        >
                          {job.memo_updated_by_user.first_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {job.memo_updated_by_user.first_name} {job.memo_updated_by_user.last_name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 5 }}>
                        {fDate(job.memo_updated_at, 'MMM DD YYYY')} at {fTime(job.memo_updated_at)}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
              {canEditMemo && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      setMemoDialogOpen(false);
                      setIsEditingMemo(true);
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
