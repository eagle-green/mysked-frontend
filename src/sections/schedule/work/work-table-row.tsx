import type { IJob, IJobWorker, IJobEquipment } from 'src/types/job';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { fDate, fTime } from 'src/utils/format-time';
import { formatPhoneNumberSimple } from 'src/utils/format-number';

import { provinceList } from 'src/assets/data/assets';
import { VEHICLE_TYPE_OPTIONS } from 'src/assets/data/vehicle';
import { JOB_POSITION_OPTIONS, JOB_EQUIPMENT_OPTIONS } from 'src/assets/data/job';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { WorkResponseDialog } from './work-response-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: IJob;
};

// Helper to build full address from site fields
function getFullAddress(site: any) {
  if (site.display_address) return site.display_address;
  // Build the address string from fields
  let addr = [
    site.unit_number,
    site.street_number,
    site.street_name,
    site.city,
    site.province,
    site.postal_code,
    site.country,
  ]
    .filter(Boolean)
    .join(', ');
  // Replace province name with code
  provinceList.forEach(({ value, code }) => {
    addr = addr.replace(value, code);
  });
  return addr;
}

const formatVehicleType = (type: string) => {
  const option = VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

const formatEquipmentType = (type: string) => {
  const option = JOB_EQUIPMENT_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

export function JobTableRow(props: Props) {
  const { row } = props;
  const collapseRow = useBoolean();
  const responseDialog = useBoolean();
  const { user } = useAuthContext();

  if (!row || !row.id) return null;

  const currentUserWorker = row.workers.find((w) => w.id === user?.id);

  function renderPrimaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow hover>
        <TableCell>{row.job_number}</TableCell>

        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              src={row.company?.logo_url ?? undefined}
              alt={row.company?.name ?? 'Company'}
              sx={{ width: 32, height: 32 }}
            >
              {row.company?.name?.charAt(0)?.toUpperCase() ?? 'C'}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.company?.name ?? 'Unknown Company'}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            {row.site ? <span>{row.site.name}</span> : <span>{row.company.name}</span>}

            <Box component="span" sx={{ color: 'text.disabled' }}>
              {(() => {
                if (row.site) {
                  const hasCompleteAddress =
                    !!row.site.street_number &&
                    !!row.site.street_name &&
                    !!row.site.city &&
                    !!row.site.province &&
                    !!row.site.postal_code &&
                    !!row.site.country;

                  if (hasCompleteAddress) {
                    return (
                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [
                            row.site.unit_number,
                            row.site.street_number,
                            row.site.street_name,
                            row.site.city,
                            row.site.province,
                            row.site.postal_code,
                            row.site.country,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {(() => {
                          // Format address like "919 292 Sterret, Vancouver BC B1T 2G2"
                          const formatAddressDisplay = (address: string) => {
                            // Split by comma
                            const parts = address
                              .split(',')
                              .map((p) => p.trim())
                              .filter(Boolean);

                            // Group parts: [street_parts, city + province + postal]
                            let streetPart = '';
                            let locationPart = '';

                            // Identify where the city part begins by looking for cities
                            const commonCities = [
                              'Vancouver',
                              'Surrey',
                              'Burnaby',
                              'Richmond',
                              'Toronto',
                              'Montreal',
                              'Calgary',
                              'Edmonton',
                              'Ottawa',
                              'Winnipeg',
                              'Quebec City',
                              'Hamilton',
                              'Waterloo',
                              'Halifax',
                              'London',
                            ];
                            let foundCity = false;

                            for (const part of parts) {
                              // Check if this part is likely a city
                              const isCity = commonCities.some(
                                (city) =>
                                  part.includes(city) ||
                                  part.toLowerCase().includes(city.toLowerCase())
                              );

                              if (!foundCity) {
                                if (isCity) {
                                  foundCity = true;
                                  locationPart = part;
                                } else {
                                  if (streetPart) streetPart += ' ';
                                  streetPart += part;
                                }
                              } else {
                                if (locationPart) locationPart += ' ';
                                locationPart += part
                                  .replace('British Columbia', 'BC')
                                  .replace('Canada', '');
                              }
                            }

                            // Clean up
                            locationPart = locationPart.replace(/BC BC/g, 'BC').trim();

                            // If we could not split properly, return formatted original
                            if (!foundCity) {
                              return address
                                .replace('British Columbia', 'BC')
                                .replace('Canada', '')
                                .replace(/,\s*,/g, ',')
                                .replace(/^\s*,|,\s*$/g, '')
                                .replace(/,/g, ', ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            }

                            // Join with single comma
                            return `${streetPart}, ${locationPart}`.trim();
                          };

                          const fullAddress = getFullAddress(row.site);
                          return formatAddressDisplay(fullAddress);
                        })()}
                      </Link>
                    );
                  }
                  // Show as plain text if not a complete address (formatted)
                  return (
                    <span>
                      {(() => {
                        // Format address like "919 292 Sterret, Vancouver BC B1T 2G2" for plain text
                        const formatAddressDisplay = (address: string) => {
                          // Split by comma
                          const parts = address
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean);

                          // Group parts: [street_parts, city + province + postal]
                          let streetPart = '';
                          let locationPart = '';

                          // Identify where the city part begins by looking for cities
                          const commonCities = [
                            'Vancouver',
                            'Surrey',
                            'Burnaby',
                            'Richmond',
                            'Toronto',
                            'Montreal',
                            'Calgary',
                            'Edmonton',
                            'Ottawa',
                            'Winnipeg',
                            'Quebec City',
                            'Hamilton',
                            'Waterloo',
                            'Halifax',
                            'London',
                          ];
                          let foundCity = false;

                          for (const part of parts) {
                            // Check if this part is likely a city
                            const isCity = commonCities.some(
                              (city) =>
                                part.includes(city) ||
                                part.toLowerCase().includes(city.toLowerCase())
                            );

                            if (!foundCity) {
                              if (isCity) {
                                foundCity = true;
                                locationPart = part;
                              } else {
                                if (streetPart) streetPart += ' ';
                                streetPart += part;
                              }
                            } else {
                              if (locationPart) locationPart += ' ';
                              locationPart += part
                                .replace('British Columbia', 'BC')
                                .replace('Canada', '');
                            }
                          }

                          // Clean up
                          locationPart = locationPart.replace(/BC BC/g, 'BC').trim();

                          // If we could not split properly, return formatted original
                          if (!foundCity) {
                            return address
                              .replace('British Columbia', 'BC')
                              .replace('Canada', '')
                              .replace(/,\s*,/g, ',')
                              .replace(/^\s*,|,\s*$/g, '')
                              .replace(/,/g, ', ')
                              .replace(/\s+/g, ' ')
                              .trim();
                          }

                          // Join with single comma
                          return `${streetPart}, ${locationPart}`.trim();
                        };

                        const fullAddress = getFullAddress(row.site);
                        return formatAddressDisplay(fullAddress);
                      })()}
                    </span>
                  );
                } else {
                  // Fallback to company address if no site
                  const hasCompleteAddress =
                    !!row.company.street_number &&
                    !!row.company.street_name &&
                    !!row.company.city &&
                    !!row.company.province &&
                    !!row.company.postal_code &&
                    !!row.company.country;

                  if (hasCompleteAddress) {
                    return (
                      <Link
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [
                            row.company.unit_number,
                            row.company.street_number,
                            row.company.street_name,
                            row.company.city,
                            row.company.province,
                            row.company.postal_code,
                            row.company.country,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {(() => {
                          const formatAddressDisplay = (address: string) => {
                            const parts = address
                              .split(',')
                              .map((p) => p.trim())
                              .filter(Boolean);
                            let streetPart = '';
                            let locationPart = '';
                            const commonCities = [
                              'Vancouver',
                              'Surrey',
                              'Burnaby',
                              'Richmond',
                              'Toronto',
                              'Montreal',
                              'Calgary',
                              'Edmonton',
                              'Ottawa',
                              'Winnipeg',
                              'Quebec City',
                              'Hamilton',
                              'Waterloo',
                              'Halifax',
                              'London',
                            ];
                            let foundCity = false;

                            for (const part of parts) {
                              const isCity = commonCities.some(
                                (city) =>
                                  part.includes(city) ||
                                  part.toLowerCase().includes(city.toLowerCase())
                              );

                              if (!foundCity) {
                                if (isCity) {
                                  foundCity = true;
                                  locationPart = part;
                                } else {
                                  if (streetPart) streetPart += ' ';
                                  streetPart += part;
                                }
                              } else {
                                if (locationPart) locationPart += ' ';
                                locationPart += part
                                  .replace('British Columbia', 'BC')
                                  .replace('Canada', '');
                              }
                            }

                            locationPart = locationPart.replace(/BC BC/g, 'BC').trim();

                            if (!foundCity) {
                              return address
                                .replace('British Columbia', 'BC')
                                .replace('Canada', '')
                                .replace(/,\s*,/g, ',')
                                .replace(/^\s*,|,\s*$/g, '')
                                .replace(/,/g, ', ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            }

                            return `${streetPart}, ${locationPart}`.trim();
                          };

                          const fullAddress = getFullAddress(row.company);
                          return formatAddressDisplay(fullAddress);
                        })()}
                      </Link>
                    );
                  }
                  // Show as plain text if not a complete address (formatted)
                  return (
                    <span>
                      {(() => {
                        const formatAddressDisplay = (address: string) => {
                          const parts = address
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean);
                          let streetPart = '';
                          let locationPart = '';
                          const commonCities = [
                            'Vancouver',
                            'Surrey',
                            'Burnaby',
                            'Richmond',
                            'Toronto',
                            'Montreal',
                            'Calgary',
                            'Edmonton',
                            'Ottawa',
                            'Winnipeg',
                            'Quebec City',
                            'Hamilton',
                            'Waterloo',
                            'Halifax',
                            'London',
                          ];
                          let foundCity = false;

                          for (const part of parts) {
                            const isCity = commonCities.some(
                              (city) =>
                                part.includes(city) ||
                                part.toLowerCase().includes(city.toLowerCase())
                            );

                            if (!foundCity) {
                              if (isCity) {
                                foundCity = true;
                                locationPart = part;
                              } else {
                                if (streetPart) streetPart += ' ';
                                streetPart += part;
                              }
                            } else {
                              if (locationPart) locationPart += ' ';
                              locationPart += part
                                .replace('British Columbia', 'BC')
                                .replace('Canada', '');
                            }
                          }

                          locationPart = locationPart.replace(/BC BC/g, 'BC').trim();

                          if (!foundCity) {
                            return address
                              .replace('British Columbia', 'BC')
                              .replace('Canada', '')
                              .replace(/,\s*,/g, ',')
                              .replace(/^\s*,|,\s*$/g, '')
                              .replace(/,/g, ', ')
                              .replace(/\s+/g, ' ')
                              .trim();
                          }

                          return `${streetPart}, ${locationPart}`.trim();
                        };

                        const fullAddress = getFullAddress(row.company);
                        return formatAddressDisplay(fullAddress);
                      })()}
                    </span>
                  );
                }
              })()}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>{row.company.region}</TableCell>

        <TableCell>
          <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={row.client.logo_url ?? undefined}
              alt={row.client.name}
              sx={{ width: 32, height: 32 }}
            >
              {row.client.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              {row.client.name}
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(currentUserWorker?.start_time || row.start_time)}
            secondary={fTime(currentUserWorker?.start_time || row.start_time)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(currentUserWorker?.end_time || row.end_time)}
            secondary={fTime(currentUserWorker?.end_time || row.end_time)}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          {currentUserWorker?.status === 'pending' ? (
            <Button
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                responseDialog.onTrue();
              }}
              size="small"
              className="MuiButton-root"
            >
              Respond
            </Button>
          ) : (
            <Label
              variant="soft"
              color={
                (currentUserWorker?.status === 'accepted' && 'success') ||
                (currentUserWorker?.status === 'rejected' && 'error') ||
                (currentUserWorker?.status === 'cancelled' && 'error') ||
                'default'
              }
            >
              {currentUserWorker?.status}
            </Label>
          )}
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton
            color={collapseRow.value ? 'inherit' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              collapseRow.onToggle();
            }}
            sx={{ ...(collapseRow.value && { bgcolor: 'action.hover' }) }}
          >
            <Iconify icon="eva:arrow-ios-downward-fill" />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }

  function renderSecondaryRow() {
    if (!row || !row.id) return null;
    return (
      <TableRow>
        <TableCell sx={{ p: 0, border: 'none', width: '100%' }} colSpan={9}>
          <Collapse
            in={collapseRow.value}
            timeout="auto"
            unmountOnExit
            sx={{ bgcolor: 'background.neutral' }}
          >
            <Paper
              sx={{
                m: 1.5,
                mb: 0.1,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Box
                sx={(theme) => ({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: theme.spacing(1.5, 2, 1.5, 1.5),
                  borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                  width: '100%',
                  '& .MuiListItemText-root': {
                    textAlign: 'center',
                  },
                })}
              >
                <ListItemText primary="Position" />
                <ListItemText primary="Employee" />
                <ListItemText primary="Contact" />
                <ListItemText primary="Vehicle Type" />
                <ListItemText primary="Vehicle" />
                <ListItemText primary="Start Time" />
                <ListItemText primary="End Time" />
                <ListItemText primary="Status" />
              </Box>
            </Paper>
            <Paper sx={{ m: 1.5, mt: 0, mb: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              {/* Workers + Vehicle */}
              {row.workers
                .filter(
                  (worker) =>
                    // If current worker has rejected, only show them
                    // Otherwise show current worker and other accepted workers
                    worker.id === user?.id ||
                    (currentUserWorker?.status !== 'rejected' && worker.status === 'accepted')
                )
                .map((item: IJobWorker) => {
                  const vehicle = row.vehicles?.find((v) => v.operator?.id === item.id);
                  const positionLabel =
                    JOB_POSITION_OPTIONS.find((option) => option.value === item.position)?.label ||
                    item.position;

                  return (
                    <Box
                      key={item.id}
                      sx={(theme) => ({
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        alignItems: 'center',
                        p: theme.spacing(1.5, 2, 1.5, 1.5),
                        borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                        width: '100%',
                        '& .MuiListItemText-root': {
                          textAlign: 'center',
                        },
                      })}
                    >
                      <ListItemText
                        primary={positionLabel}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          justifyContent: 'center',
                        }}
                      >
                        <Avatar
                          src={item?.photo_url ?? undefined}
                          alt={item?.first_name}
                          sx={{ width: 28, height: 28, mr: 1, flexShrink: 0, fontSize: 15 }}
                        >
                          {item?.first_name?.charAt(0).toUpperCase()}
                        </Avatar>
                        {`${item.first_name || ''} ${item.last_name || ''}`.trim()}
                      </Box>
                      <ListItemText
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      >
                        <Link
                          href={`tel:${item?.phone_number}`}
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {formatPhoneNumberSimple(item?.phone_number)}
                        </Link>
                      </ListItemText>
                      <ListItemText
                        primary={vehicle?.type ? formatVehicleType(vehicle.type) : null}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                      <ListItemText
                        primary={
                          vehicle
                            ? `${vehicle.license_plate || ''} ${vehicle.unit_number ? `- ${vehicle.unit_number}` : ''}`.trim()
                            : null
                        }
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                      <ListItemText
                        primary={fTime(item.start_time)}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                      <ListItemText
                        primary={fTime(item.end_time)}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Label
                          variant="soft"
                          color={
                            (item.status === 'accepted' && 'success') ||
                            (item.status === 'rejected' && 'error') ||
                            (item.status === 'pending' && 'warning') ||
                            'default'
                          }
                        >
                          {item.status === 'accepted' && 'Accepted'}
                          {item.status === 'rejected' && 'Rejected'}
                          {item.status === 'pending' && 'Pending'}
                          {item.status === 'draft' && 'Draft'}
                          {!['accepted', 'rejected', 'pending', 'draft'].includes(
                            item.status || ''
                          ) &&
                            (item.status || 'Unknown')}
                        </Label>
                      </Box>
                    </Box>
                  );
                })}
            </Paper>
            {row.equipments && row.equipments.length > 0 && (
              <>
                <Paper
                  sx={{
                    m: 1.5,
                    mt: 0,
                    mb: 0.1,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                      '& .MuiListItemText-root': {
                        textAlign: 'center',
                      },
                    })}
                  >
                    <ListItemText primary="Equipment Type" />
                    <ListItemText primary="Quantity" />
                  </Box>
                </Paper>
                <Paper sx={{ m: 1.5, mt: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  {row.equipments.map((item: IJobEquipment) => (
                    <Box
                      key={item.id}
                      sx={(theme) => ({
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        alignItems: 'center',
                        p: theme.spacing(1.5, 2, 1.5, 1.5),
                        borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                        '& .MuiListItemText-root': {
                          textAlign: 'center',
                        },
                      })}
                    >
                      <ListItemText
                        primary={formatEquipmentType(item.type)}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />

                      <ListItemText
                        primary={item.quantity}
                        slotProps={{
                          primary: { sx: { typography: 'body2' } },
                        }}
                      />
                    </Box>
                  ))}
                </Paper>
              </>
            )}
            {row.notes && (
              <>
                <Paper
                  sx={{
                    m: 1.5,
                    mt: 0,
                    mb: 0.1,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                    })}
                  >
                    <ListItemText primary="Note" />
                  </Box>
                </Paper>
                <Paper sx={{ m: 1.5, mt: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <Box
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: 'repeat(1, 1fr)',
                      alignItems: 'center',
                      p: theme.spacing(1.5, 2, 1.5, 1.5),
                      borderBottom: `solid 2px ${theme.vars.palette.background.neutral}`,
                    })}
                  >
                    <ListItemText
                      primary={row.notes}
                      slotProps={{
                        primary: {
                          sx: {
                            typography: 'body2',
                            whiteSpace: 'pre-wrap',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {renderPrimaryRow()}
      {renderSecondaryRow()}
      <WorkResponseDialog
        open={responseDialog.value}
        onClose={responseDialog.onFalse}
        jobId={row.id}
        workerId={user?.id || ''}
      />
    </>
  );
}
