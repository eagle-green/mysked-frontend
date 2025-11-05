import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  row: any | null;
  onViewRow: () => void;
};

export function TmpTableRow({ row, onViewRow }: Props) {
  if (!row) {
    return (
      <TableRow>
        <TableCell><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
        <TableCell><Skeleton /></TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow hover>
      {/* Job Number - Clickable */}
      <TableCell>
        <Link
          color="primary"
          onClick={onViewRow}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          <Typography variant="body2" fontWeight="bold">
            #{row.job?.job_number}
          </Typography>
        </Link>
      </TableCell>

      {/* Site */}
      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <span>{row.site?.name || '-'}</span>

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
                          const parts = address
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean);

                          let streetPart = '';
                          let locationPart = '';

                          const commonCities = [
                            'Vancouver', 'Surrey', 'Burnaby', 'Richmond', 
                            'Toronto', 'Montreal', 'Calgary', 'Edmonton', 
                            'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 
                            'Waterloo', 'Halifax', 'London'
                          ];
                          let foundCity = false;

                          for (const part of parts) {
                            const isCity = commonCities.some((city) =>
                              part.includes(city) || part.toLowerCase().includes(city.toLowerCase())
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

                        const fullAddress = [
                          row.site.unit_number,
                          row.site.street_number,
                          row.site.street_name,
                          row.site.city,
                          row.site.province,
                          row.site.postal_code,
                          row.site.country,
                        ]
                          .filter(Boolean)
                          .join(', ');

                        return formatAddressDisplay(fullAddress);
                      })()}
                    </Link>
                  );
                }

                if (row.site.display_address) {
                  return <span>{row.site.display_address}</span>;
                }
              }

              return <span>-</span>;
            })()}
          </Box>
        </Stack>
      </TableCell>

      {/* Client */}
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            src={row.client?.logo_url}
            alt={row.client?.name}
            sx={{ width: 32, height: 32 }}
          >
            {row.client?.name?.charAt(0)}
          </Avatar>
          <Typography variant="body2" noWrap>
            {row.client?.name || '-'}
          </Typography>
        </Stack>
      </TableCell>

      {/* Date */}
      <TableCell>
        <Typography variant="body2">
          {row.job?.start_time ? fDate(row.job.start_time) : '-'}
        </Typography>
      </TableCell>

      {/* TMPs Count */}
      <TableCell>
        <Typography variant="body2">
          {row.pdf_count || 0}
        </Typography>
      </TableCell>

      {/* Confirmation Status */}
      <TableCell>
        <Label 
          variant="soft" 
          color={
            (row.pdf_count === 0 || row.pdf_count === undefined) 
              ? 'info' 
              : row.worker_confirmed 
                ? 'success' 
                : 'warning'
          }
        >
          {(row.pdf_count === 0 || row.pdf_count === undefined) 
            ? 'Draft' 
            : row.worker_confirmed 
              ? 'Confirmed' 
              : 'Pending'}
        </Label>
      </TableCell>
    </TableRow>
  );
}

