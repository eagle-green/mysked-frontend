import type { IEquipmentLeftAtSite } from 'src/types/timesheet';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function formatVehicleTypeLabel(type?: string | null): string {
  if (!type) return '';
  const t = String(type).toLowerCase();
  if (t === 'highway_truck') return 'HWY';
  if (t === 'lane_closure_truck') return 'LCT';
  return type;
}

export type EquipmentConfirmItem = Partial<IEquipmentLeftAtSite> & {
  vehicle_id?: string;
  inventory_id?: string;
  quantity?: number;
  inventory_name?: string;
  sku?: string;
  vehicle_type?: string;
  license_plate?: string;
  unit_number?: string;
  inventory_type?: string;
  typical_application?: string | null;
  notes?: string | null;
  cover_url?: string | null;
};

type Props = {
  equipmentLeftAnswer: 'yes' | 'no' | '';
  items: EquipmentConfirmItem[];
};

/**
 * Read-only summary of equipment left at site for confirmation dialogs (matches Equipment Left at Site styling).
 */
export function TimesheetEquipmentConfirmSummary({ equipmentLeftAnswer, items }: Props) {
  const hasItems = items.some(
    (it) =>
      it?.vehicle_id &&
      it?.inventory_id &&
      Number(it?.quantity) > 0
  );

  return (
    <Card variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.neutral' }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Equipment left at site
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: hasItems ? 1.5 : 0 }}>
        {equipmentLeftAnswer === 'yes' && (
          <>
            <strong>Left equipment at site:</strong> Yes
          </>
        )}
        {equipmentLeftAnswer === 'no' && (
          <>
            <strong>Left equipment at site:</strong> No
          </>
        )}
        {equipmentLeftAnswer === '' && (
          <>
            <strong>Left equipment at site:</strong> Not answered
          </>
        )}
      </Typography>

      {equipmentLeftAnswer === 'yes' && hasItems && (
        <Stack spacing={1.5}>
          {items
            .filter(
              (it) =>
                it?.vehicle_id &&
                it?.inventory_id &&
                Number(it?.quantity) > 0
            )
            .map((item, index) => (
              <Card
                key={`${item.vehicle_id}-${item.inventory_id}-${index}`}
                variant="outlined"
                sx={{ p: 1.5, borderColor: 'divider' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  }}
                >
                  {item.cover_url ? (
                    <Avatar
                      src={item.cover_url}
                      variant="rounded"
                      sx={{ width: 48, height: 48, flexShrink: 0 }}
                    />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 48, height: 48, flexShrink: 0 }}>
                      <Iconify icon={'solar:box-bold' as any} width={28} />
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                      {item.inventory_name || '—'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1, wordBreak: 'break-word' }}
                    >
                      SKU: {item.sku || '—'} • Type:{' '}
                      {item.inventory_type
                        ? item.inventory_type.charAt(0).toUpperCase() + item.inventory_type.slice(1)
                        : '—'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      <Chip
                        size="small"
                        variant="soft"
                        color="info"
                        label={`Vehicle: ${formatVehicleTypeLabel(item.vehicle_type)} — ${item.license_plate || ''}${item.unit_number ? ` ${item.unit_number}` : ''}`}
                      />
                      {item.typical_application ? (
                        <Chip size="small" variant="soft" label={item.typical_application} />
                      ) : null}
                    </Stack>
                    <Typography variant="body2">
                      <Box component="span" color="text.secondary">
                        Quantity:{' '}
                      </Box>
                      <strong>{item.quantity}</strong>
                    </Typography>
                    {item.notes?.trim() ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Notes: {item.notes}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              </Card>
            ))}
        </Stack>
      )}

      {equipmentLeftAnswer === 'yes' && !hasItems && (
        <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>
          No equipment lines added yet. Add items under Equipment Left at Site before submitting.
        </Typography>
      )}
    </Card>
  );
}
