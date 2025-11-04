import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import AlertTitle from '@mui/material/AlertTitle';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { fDate, fTime } from 'src/utils/format-time';
import { getPositionColor } from 'src/utils/format-role';

import { fetcher, endpoints } from 'src/lib/axios';
import { JOB_POSITION_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  userId: string;
};

const TABLE_HEAD = [
  { id: 'job_number', label: 'Job #' },
  { id: 'date', label: 'Date' },
  { id: 'company', label: 'Company' },
  { id: 'site', label: 'Site' },
  { id: 'position', label: 'Position' },
  { id: 'status', label: 'Status' },
  { id: 'reason', label: 'Rejection Reason', width: 200 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AccountJobHistoryTab({ userId }: Props) {
  const table = useTable({ defaultRowsPerPage: 10, defaultDense: true, defaultOrderBy: 'date', defaultOrder: 'desc' });
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch job history
  const { data, isLoading } = useQuery({
    queryKey: ['worker-job-history', userId, statusFilter, table.page, table.rowsPerPage, table.orderBy, table.order],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: table.rowsPerPage.toString(),
        offset: (table.page * table.rowsPerPage).toString(),
        orderBy: table.orderBy,
        order: table.order,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetcher(
        `${endpoints.work.job}/worker/${userId}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch rejection statistics
  const { data: rejectionStats } = useQuery({
    queryKey: ['worker-rejection-stats', userId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.work.job}/worker/${userId}/rejection-stats`);
      return response.data;
    },
    enabled: !!userId,
  });

  const stats = data?.stats || {};
  const jobs = data?.jobs || [];
  const totalCount = data?.pagination?.total || 0;
  const rejectionData = rejectionStats || {};

  const isApproachingLimit =
    rejectionData.last3Months >= 1 || rejectionData.thisYear >= 4;
  const hasExceededLimit = rejectionData.last3Months > 1 || rejectionData.thisYear >= 5;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'accepted':
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'info';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusFilterChange = useCallback((event: any) => {
    setStatusFilter(event.target.value);
    table.onChangePage(null, 0); // Reset to first page
  }, [table]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Statistics Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* Job Stats Card */}
        <Card sx={{ p: 3, flex: 1 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:case-minimalistic-bold" width={32} color="primary.main" />
              <Typography variant="h6">Job Statistics</Typography>
            </Box>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Jobs:
                </Typography>
                <Typography variant="h6">{stats.total || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Completed:
                </Typography>
                <Label color="success" variant="soft">
                  {stats.completed || 0}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Rejected:
                </Typography>
                <Label color="error" variant="soft">
                  {stats.rejected || 0} ({stats.rejectionPercentage || '0.0'}%)
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Cancelled:
                </Typography>
                <Label color="default" variant="soft">
                  {stats.cancelled || 0}
                </Label>
              </Box>
            </Stack>
          </Stack>
        </Card>

        {/* Rejection Policy Card */}
        <Card
          sx={{
            p: 3,
            flex: 1,
            bgcolor: hasExceededLimit
              ? (theme) => alpha(theme.palette.error.main, 0.08)
              : isApproachingLimit
                ? (theme) => alpha(theme.palette.warning.main, 0.08)
                : 'background.paper',
            border: (theme) =>
              hasExceededLimit
                ? `1px solid ${theme.palette.error.main}`
                : isApproachingLimit
                  ? `1px solid ${theme.palette.warning.main}`
                  : 'none',
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify
                icon="solar:shield-check-bold"
                width={32}
                color={hasExceededLimit ? 'error.main' : isApproachingLimit ? 'warning.main' : 'info.main'}
              />
              <Typography variant="h6">Rejection Status</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Policy: Max <strong>1 rejection / 3 months</strong> OR{' '}
              <strong>5 rejections / year</strong>
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Last 3 months:
                </Typography>
                <Label
                  color={rejectionData.last3Months >= 1 ? 'error' : 'success'}
                  variant="soft"
                >
                  {rejectionData.last3Months || 0} / 1
                  {rejectionData.last3Months >= 1 && ' ⚠️'}
                </Label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  This year:
                </Typography>
                <Label
                  color={rejectionData.thisYear >= 4 ? 'error' : 'success'}
                  variant="soft"
                >
                  {rejectionData.thisYear || 0} / 5
                  {rejectionData.thisYear >= 4 && ' ⚠️'}
                </Label>
              </Box>
            </Stack>
            {hasExceededLimit && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <AlertTitle>Limit Exceeded</AlertTitle>
                You have exceeded the rejection limit. Further rejections will be reviewed by
                management.
              </Alert>
            )}
            {!hasExceededLimit && isApproachingLimit && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <AlertTitle>Approaching Limit</AlertTitle>
                You are approaching the rejection limit. Please avoid rejecting additional jobs
                if possible.
              </Alert>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Job History Table */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">Job History</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={handleStatusFilterChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom 
                headCells={TABLE_HEAD}
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : jobs.length === 0 ? (
                  <TableNoData notFound />
                ) : (
                  jobs.map((job: any) => {
                    const positionLabel =
                      JOB_POSITION_OPTIONS.find((option) => option.value === job.position)
                        ?.label || job.position;

                    return (
                      <TableRow key={`${job.job_id}-${job.start_time}`} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{job.job_number}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{fDate(job.start_time)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fTime(job.worker_start_time)} - {fTime(job.worker_end_time)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{job.company_name || ''}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{job.site_name || ''}</Typography>
                          {job.site_city && (
                            <Typography variant="caption" color="text.secondary">
                              {job.site_city}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Label variant="soft" color={getPositionColor(job.position)}>
                            {positionLabel}
                          </Label>
                        </TableCell>

                        <TableCell>
                          <Label variant="soft" color={getStatusColor(job.worker_status)}>
                            {job.worker_status}
                          </Label>
                        </TableCell>

                        <TableCell>
                          {job.rejection_reason && (
                            <Tooltip title={job.rejection_reason} arrow>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 200,
                                  cursor: 'help',
                                }}
                              >
                                {job.rejection_reason}
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalCount}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Box>
      </Card>
    </Box>
  );
}

