import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: (checked: boolean) => void;
};

export function FlraTableRow({ row, selected, onSelectRow }: Props) {
  const router = useRouter();
  const { user } = useAuthContext();


  const handleViewFlra = useCallback(() => {
    if (row.status === 'submitted') {
      // Navigate to PDF preview for submitted FLRAs
      router.push(`/schedules/work/flra/pdf/${row.id}`);
    } else {
      // Navigate to form for draft/other statuses
      router.push(`/schedules/flra-form/${row.id}`);
    }
  }, [router, row.id, row.status]);

  // Check if user is a timesheet manager for this job
  const isTimesheetManager = row.timesheet_manager?.id === user?.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info';
      case 'submitted':
        return 'success';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableRow hover selected={selected}>
      <TableCell>
        {isTimesheetManager ? (
          <Link
            component="button"
            variant="subtitle2"
            onClick={handleViewFlra}
            sx={{
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
            title={row.status === 'submitted' ? 'View PDF Preview' : 'Edit FLRA Form'}
          >
            #{row.job?.job_number}
          </Link>
        ) : (
          <Typography variant="body2" noWrap sx={{ color: 'text.disabled' }}>
            #{row.job?.job_number}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={row.client?.logo_url} alt={row.client?.name} sx={{ width: 32, height: 32 }}>
            {row.client?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Typography variant="body2" noWrap>
            {row.client?.name}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box>
          <Typography variant="body2" noWrap>
            {row.site?.name}
          </Typography>
          {row.site?.display_address && (
            <Box
              component="span"
              sx={{
                color: 'text.disabled',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {(() => {
                // Format address like "919 292 Sterret, Vancouver BC B1T 2G2"
                const formatAddressDisplay = (address: string) => {
                  // Split by comma
                  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
                  
                  // Group parts: [street_parts, city + province + postal]
                  let streetPart = '';
                  let locationPart = '';
                  
                  // Identify where the city part begins by looking for cities
                  const commonCities = ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Toronto', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Waterloo', 'Halifax', 'London'];
                  let foundCity = false;
                  
                  for (const part of parts) {
                    // Check if this part is likely a city
                    const isCity = commonCities.some(city => 
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

                const displayText = formatAddressDisplay(row.site.display_address);
                
                // Check if we have complete address fields for Google Maps
                const hasCompleteAddress = row.site.street_number && 
                                        row.site.street_name && 
                                        row.site.city && 
                                        row.site.province && 
                                        row.site.postal_code;

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
                      {displayText}
                    </Link>
                  );
                }

                return <span>{displayText}</span>;
              })()}
            </Box>
          )}
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {row.job?.start_time ? fDate(row.job.start_time) : '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
        </Label>
      </TableCell>

      <TableCell>
        {row.submitted_by && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              alt={`${row.submitted_by.first_name} ${row.submitted_by.last_name}`}
              sx={{ width: 32, height: 32 }}
            >
              {row.submitted_by.first_name?.charAt(0)?.toUpperCase() ||
                row.submitted_by.last_name?.charAt(0)?.toUpperCase() ||
                row.submitted_by.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </Avatar>
            <Typography variant="body2" noWrap>
              {`${row.submitted_by.first_name || ''} ${row.submitted_by.last_name || ''}`.trim() ||
                row.submitted_by.email}
            </Typography>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}
