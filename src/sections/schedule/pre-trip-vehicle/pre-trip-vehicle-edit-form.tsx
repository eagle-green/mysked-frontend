import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { DefectModal } from './pre-trip-defect-modal-form';

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

const INSPECTION_DATA = [
  {
    field_name: 'air_brake_system',
    label: 'Air brake System',
    has_defect: '',
    detect_issues: {
      detect_type: '',
      notes: '',
      photo: undefined,
    },
  },
  {
    field_name: 'cab',
    label: 'Cab',
    has_defect: '',
    detect_issues: {
      detect_type: '',
      notes: '',
      photo: undefined,
    },
  },
  {
    field_name: 'cargo_securement',
    label: 'Cargo Securement',
    has_defect: '',
    detect_issues: {
      detect_type: '',
      notes: '',
      photo: undefined,
    },
  },
  {
    field_name: 'steering',
    label: 'Steering',
    has_defect: '',
    detect_issues: {
      detect_type: '',
      notes: '',
      photo: undefined,
    },
  },
  {
    field_name: 'suspension_system',
    label: 'Suspension System',
    has_defect: '',
    detect_issues: {
      detect_type: '',
      notes: '',
      photo: undefined,
    },
  },
  {
    field_name: 'tires',
    label: 'Tires',
    has_defect: '',
    detect_issues: {
      detect_type: '',
      notes: '',
      photo: undefined,
    },
  },
];

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

  const methods = useForm<any>({
    mode: 'onChange',
    // resolver: zodResolver(FlraSchema),
    defaultValues: {
      inspections: INSPECTION_DATA,
    },
  });

  const { setValue, watch, getValues } = methods;
  const [openModalIndex, setOpenModalIndex] = useState<any>(null);
  const modal = useBoolean();
  const inspections = watch('inspections');

  const onSubmit = async () => {
    const values = getValues();
  };

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
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
            <Typography variant="h6">Inspection List</Typography>
            <Typography variant="subtitle2" color="text.disabled">
              Your fleet requires you to document inspection of parts marked with an asterisk (*)
            </Typography>

            {inspections.map((inspection: any, index: any) => (
              <Box
                key={`${inspection.field_name}-${index}`}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1">
                  {`${index + 1} - ${inspection.label}`} *
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <IconButton
                    onClick={() => {
                      setValue(`inspections.${index}.has_defect`, 'no');
                    }}
                    sx={{
                      color: inspection.has_defect == 'no' ? 'primary.main' : 'default',
                      '&:hover': {
                        backgroundColor:
                          inspection.has_defect == 'no' ? 'primary.lighter' : 'default',
                      },
                    }}
                  >
                    <Iconify icon="solar:like-bold" />
                  </IconButton>

                  <IconButton
                    onClick={() => {
                      setValue(`inspections.${index}.has_defect`, 'yes');
                      setOpenModalIndex(index);
                      modal.onTrue();
                    }}
                    sx={{
                      color: inspection.has_defect == 'yes' ? 'error.main' : 'default',
                      '&:hover': {
                        backgroundColor:
                          inspection.has_defect == 'yes' ? 'error.lighter' : 'default',
                      },
                    }}
                  >
                    <Iconify icon="solar:danger-bold" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            type="button"
            variant="contained"
            size="large"
            sx={{ minWidth: { xs: '120px', md: '140px' } }}
            onClick={async () => {}}
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="contained"
            color="success"
            size="large"
            sx={{ minWidth: { xs: '120px', md: '140px' } }}
            onClick={async () => {
              const values = getValues();
              console.log(values);
            }}
          >
            Submit
          </Button>
        </Stack>

        <DefectModal
          open={modal.value}
          openIndex={openModalIndex}
          onClose={() => {
            modal.onFalse();
            setOpenModalIndex(null);
          }}
        />
      </Form>
    </>
  );
}
