import dayjs from 'dayjs';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';

dayjs.extend(utc);
dayjs.extend(timezone);

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { useTable, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  vehicleId: string;
};

type HistoryEntry = {
  id: string;
  action_type: string;
  changed_by: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  changed_at: string;
  field_name?: string | null;
  old_value?: unknown;
  new_value?: unknown;
  description: string;
  metadata?: Record<string, unknown> | null;
};

const getActionColor = (actionType: string): string => {
  switch (actionType) {
    case 'created':
      return 'success.main';
    case 'updated':
      return 'info.main';
    case 'picture_added':
      return 'primary.main';
    case 'picture_deleted':
      return 'error.main';
    case 'inventory_added':
      return 'success.main';
    case 'inventory_updated':
      return 'warning.main';
    case 'inventory_removed':
      return 'error.main';
    case 'inventory_audit':
      return 'primary.main';
    case 'driver_assigned':
      return 'info.main';
    case 'driver_unassigned':
      return 'warning.main';
    default:
      return 'divider';
  }
};

const getActionIcon = (actionType: string): string => {
  switch (actionType) {
    case 'created':
    case 'updated':
    case 'driver_assigned':
    case 'driver_unassigned':
      return 'ic:baseline-fire-truck';
    case 'picture_added':
    case 'picture_deleted':
      return 'solar:camera-bold';
    case 'inventory_added':
    case 'inventory_updated':
    case 'inventory_removed':
      return 'solar:box-bold';
    case 'inventory_audit':
      return 'solar:clipboard-check-bold';
    default:
      return 'solar:clock-circle-bold';
  }
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'vehicle_info', label: 'Vehicle Info' },
  { value: 'picture', label: 'Picture' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'audit', label: 'Audit' },
];

export function VehicleHistoryTab({ vehicleId }: Props) {
  const table = useTable({ 
    defaultRowsPerPage: 25, 
    defaultOrderBy: 'changed_at', 
    defaultOrder: 'desc' 
  });
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-history', vehicleId, filter, table.page, table.rowsPerPage],
    queryFn: async () => {
      if (!vehicleId) return { history: [], pagination: { total: 0 } };
      
      const params = new URLSearchParams({
        limit: table.rowsPerPage.toString(),
        offset: (table.page * table.rowsPerPage).toString(),
      });

      if (filter !== 'all') {
        params.append('action_type', filter);
      }

      const response = await fetcher(
        `${endpoints.management.vehicle}/${vehicleId}/history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!vehicleId,
  });

  const history = (data?.history || []) as HistoryEntry[];
  const totalCount = data?.pagination?.total || 0;

  if (isLoading) {
    return (
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={80} />
        </Stack>
      </Card>
    );
  }

  const handleFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setFilter(newValue);
    table.onResetPage();
  };

  return (
    <Card sx={{ p: 3 }}>
      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={filter} onChange={handleFilterChange}>
          {FILTER_OPTIONS.map((option) => (
            <Tab key={option.value} label={option.label} value={option.value} />
          ))}
        </Tabs>
      </Box>

      {/* History List */}
      {history.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="solar:clock-circle-bold" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            {filter === 'all' 
              ? 'No history available' 
              : `No ${FILTER_OPTIONS.find(f => f.value === filter)?.label.toLowerCase()} history`}
          </Typography>
        </Box>
      ) : (
        <>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {history.map((entry) => (
          <Box
            key={entry.id}
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              borderLeft: '3px solid',
              borderColor: getActionColor(entry.action_type),
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                {entry.changed_by?.photo_url ? (
                  <Avatar
                    src={entry.changed_by.photo_url}
                    alt={`${entry.changed_by.first_name} ${entry.changed_by.last_name}`}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {entry.changed_by.first_name?.charAt(0).toUpperCase()}
                  </Avatar>
                ) : entry.changed_by ? (
                  <Avatar
                    alt={`${entry.changed_by.first_name} ${entry.changed_by.last_name}`}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  >
                    {entry.changed_by.first_name?.charAt(0).toUpperCase() ||
                      entry.changed_by.last_name?.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <Avatar sx={{ width: 32, height: 32, flexShrink: 0 }}>
                    <Iconify icon="solar:user-id-bold" width={20} />
                  </Avatar>
                )}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                    {entry.changed_by
                      ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                      : 'System'}
                  </Typography>
                  <Iconify
                    icon={getActionIcon(entry.action_type) as any}
                    sx={{ fontSize: 18, color: getActionColor(entry.action_type) }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(entry.changed_at).tz('America/Los_Angeles').format('MMM D, YYYY h:mm A')}
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="body2" sx={{ pl: 5 }}>
                {entry.description}
              </Typography>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <Box sx={{ pl: 5, pt: 0.5 }}>
                  {(entry.metadata as any).picture_id && (
                    <Typography variant="caption" color="text.secondary">
                      Picture ID: {String((entry.metadata as any).picture_id)}
                    </Typography>
                  )}
                  {(entry.metadata as any).driver_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Driver: {String((entry.metadata as any).driver_name)}
                    </Typography>
                  )}
                  {(entry.metadata as any).inventory_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Item: {String((entry.metadata as any).inventory_name)}
                    </Typography>
                  )}
                  {entry.action_type === 'inventory_audit' && (entry.metadata as any).changes && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Changes:
                      </Typography>
                      {Array.isArray((entry.metadata as any).changes) && ((entry.metadata as any).changes as any[]).map((change: any, idx: number) => (
                        <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          • {change.inventory_name}: {change.old_quantity} → {change.new_quantity}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
        ))}
          </Stack>

          {/* Pagination */}
          <TablePaginationCustom
            page={table.page}
            count={totalCount}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </>
      )}
    </Card>
  );
}

