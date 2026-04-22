import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify/iconify';

//-----------------------------------------------------------------------------
type Props = {
  data: any;
};

type AvatarTextProps = {
  content: {
    photo: string | undefined;
    displayName: string;
    role?: string;
    displayRole: boolean;
  };
};

export function PreTripVehicleEditForm({ data }: Props) {
  const TextWithAvatar = ({ content }: AvatarTextProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        src={content.photo ?? undefined}
        alt={content.displayName}
        sx={{ width: 32, height: 32 }}
      >
        {content.displayName?.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2">{content.displayName}</Typography>
        {content.displayRole && (
          <Label variant="soft" color="secondary">
            {content.role}
          </Label>
        )}
      </Box>
    </Box>
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'success';
      default:
        return 'default';
    }
  };

  console.log(data?.job?.job_start);
  console.log(data?.job?.job_end);

  return (
    <>
      <Card sx={{ px: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridColumn: 2,
            gridRow: 3,
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
            p: 2,
            alignItems: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              borderRight: { xs: 'none', md: 1 },
              borderColor: { xs: '', md: 'divider' },
              gap: 1,
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              JOB NUMBER
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}>
              <Iconify icon="solar:case-minimalistic-bold" />
              <Typography variant="body2"> {data?.job?.job_number}</Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              borderRight: { xs: 'none', md: 1 },
              borderColor: { xs: '', md: 'divider' },
              gap: 1,
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              CUSTOMER
            </Typography>
            <TextWithAvatar
              content={{
                displayName: data?.customer?.displayName,
                photo: data?.customer?.photo_url,
                displayRole: false,
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              CLIENT
            </Typography>
            <TextWithAvatar
              content={{
                displayName: data?.client?.displayName,
                photo: data?.client?.photo_url,
                displayRole: false,
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
              borderRight: { xs: 'none', md: 1 },
              borderColor: { xs: '', md: 'divider' },
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              SITE
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}>
              <Iconify icon="mingcute:location-fill" />
              <Typography variant="body2"> {data?.site?.display_address}</Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
              borderRight: { xs: 'none', md: 1 },
              borderColor: { xs: '', md: 'divider' },
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              JOB DATE
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Stack spacing={0.5} alignItems="center" direction="row">
                <Typography variant="body2">{fDate(data?.job?.job_start)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fTime(data?.job?.job_start)}
                </Typography>
              </Stack>
              -
              <Stack spacing={0.5} alignItems="center" direction="row">
                <Typography variant="body2">{fDate(data?.job?.job_end)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fTime(data?.job?.job_end)}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              STATUS
            </Typography>
            <Label variant="soft" color={getStatusColor(data?.status)}>
              {data?.status}
            </Label>
          </Box>
        </Box>
      </Card>

      <Card sx={{ mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Vehicle Details
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridColumn: 2,
              gridRow: 3,
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
              alignItems: 'space-between',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                borderRight: { xs: 'none', md: 1 },
                borderColor: { xs: '', md: 'divider' },
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                DRIVER NAME
              </Typography>
              <TextWithAvatar
                content={{
                  displayName: data?.driver?.displayName,
                  photo: data?.driver?.photo_url,
                  displayRole: true,
                  role: data?.driver?.role,
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderRight: { xs: 'none', md: 1 },
                borderColor: { xs: '', md: 'divider' },
                gap: 1,
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                VEHICLE TYPE
              </Typography>
              <Typography variant="body2"> {data?.vehicle?.vehicle_type}</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                LICENSE PLATE
              </Typography>
              {data?.vehicle?.license_plate}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                borderRight: { xs: 'none', md: 1 },
                borderColor: { xs: '', md: 'divider' },
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                VEHICLE INFO
              </Typography>
              <Typography variant="body2">
                {' '}
                {`${data?.vehicle?.info} (${data?.vehicle?.year})`}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                borderRight: { xs: 'none', md: 1 },
                borderColor: { xs: '', md: 'divider' },
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                VEHICLE PARTS
              </Typography>
              <Stack spacing={1} direction="row" alignItems="center">
                {data?.vehicle?.SpareKey && <Typography variant="body2">Spare Key</Typography>}
                {data?.vehicle?.WinterTire && (
                  <Typography variant="body2">, Winter Tire</Typography>
                )}
                {data?.vehicle?.TowHitch && <Typography variant="body2">, Tow Hitch</Typography>}
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.disabled">
                VEHICLE STATUS
              </Typography>
              <Label
                variant="soft"
                color={data?.vehicle?.status?.toLowerCase() == 'active' ? 'success' : 'error'}
              >
                {data?.vehicle?.status}
              </Label>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Vehicle Inspection Details
          </Typography>
        </Box>
      </Card>
    </>
  );
}
