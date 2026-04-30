import { z } from 'zod';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { useUpdateVehicleInspection } from 'src/actions/vehicle-inspection';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { AdminDefectModal } from './pre-trip-inspection-detail-modal';
//---------------------------------------------------

type Props = {
  data: any;
  inspections: Array<{
    field_name: string;
    label: string;
    is_required: boolean;
    has_defect: string;
    detect_issues: {
      detect_type: string;
      notes: string;
      photo: string | undefined;
    };
  }>;
};

type AvatarTextProps = {
  content: {
    photo: string | undefined;
    displayName: string;
    role?: string;
    displayRole: boolean;
  };
};

const DetectIssuesSchema = z.object({
  detect_type: z.string().optional(),
  notes: z.string().optional(),
  photo: z.any().optional(),
});

const InspectionItemSchema = z
  .object({
    field_name: z.string(),
    label: z.string(),
    is_required: z.boolean(),
    has_defect: z.string().optional(),
    detect_issues: DetectIssuesSchema,
  })
  .superRefine((data, ctx) => {
    // Rule 1: has_defect required if is_required
    if (data.is_required && !data.has_defect) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['has_defect'],
        message: 'This field is required',
      });
    }

    // Rule 2: detect_issues required if has_defect = 'yes'
    if (data.has_defect === 'yes') {
      if (!data.detect_issues.detect_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['detect_issues', 'detect_type'],
          message: 'Detect type is required',
        });
      }

      if (!data.detect_issues.notes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['detect_issues', 'notes'],
          message: 'Notes are required',
        });
      }
    }
  });

export const InspectionListSchema = z.object({
  inspections: z.array(InspectionItemSchema),
});

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

export const TextWithAvatar = ({ content }: AvatarTextProps) => (
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

export function AdminPreTripVehicleDetailComponent({ data, inspections }: Props) {
  const methods = useForm<any>({
    mode: 'onChange',
    resolver: zodResolver(InspectionListSchema),
    defaultValues: {
      inspections: inspections,
    },
  });

  const {
    setValue,
    watch,
    getValues,
    formState: { errors, isValid },
  } = methods;
  const [openModalIndex, setOpenModalIndex] = useState<any>(null);
  const modal = useBoolean();
  const inspectionList = watch('inspections');

  const updateRequest = useUpdateVehicleInspection();

  return (
    <>
      <Form methods={methods}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            justifyContent: 'space-between',
            p: 2,
            gap: 2,
          }}
        >
          <Card sx={{ flex: 2, p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: 1,
                borderColor: 'divider',
                borderBottomStyle: 'dashed',
                py: 2,
              }}
            >
              <Avatar
                src={data?.driver?.photo ?? undefined}
                alt={data?.driver?.displayName}
                sx={{ width: 75, height: 75 }}
              >
                {data?.driver.displayName?.charAt(0).toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Typography variant="body1">{data?.driver?.displayName}</Typography>
                <Stack spacing={2} direction="row">
                  <Label variant="soft" color="primary">
                    {data?.driver?.status}
                  </Label>
                  <Label variant="soft" color="default">
                    {data?.driver?.role}
                  </Label>
                </Stack>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridColumn: 2,
                gridRow: 3,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2,
                alignItems: 'space-between',
                px: 2,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  JOB NUMBER
                </Typography>
                <Box
                  sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}
                >
                  <Iconify icon="solar:case-minimalistic-bold" />
                  <Typography variant="body2"> {data?.job?.job_number}</Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
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
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  SITE
                </Typography>
                <Box
                  sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}
                >
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
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  JOB DATE
                </Typography>
                <Stack spacing={1} direction="row" alignItems="center">
                  <Stack spacing={0.5} alignItems="start" justifyContent="start" direction="column">
                    <Typography variant="body2">{fDate(data?.job?.job_start)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fTime(data?.job?.job_start)}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5} alignItems="start" justifyContent="start" direction="column">
                    <Typography variant="body2">{fDate(data?.job?.job_end)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fTime(data?.job?.job_end)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
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

          <Card
            sx={{
              flex: 1,
              p: 2,
            }}
          >
            <Stack spacing={2} direction="column" sx={{ p: 2 }}>
              <Typography variant="body1">Assigned Vehicle</Typography>
              <Box
                sx={{
                  border: 2,
                  borderColor: 'divider',
                  borderStyle: 'dashed',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <Iconify
                  icon="solar:gallery-circle-outline"
                  width={48}
                  height={48}
                  sx={{ mb: 2, opacity: 0.5 }}
                />
                <Typography variant="body2">No image have been uploaded yet</Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridColumn: 2,
                  gridRow: 3,
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' },
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
                  }}
                >
                  <Typography variant="caption" color="text.disabled">
                    LICENSE PLATE
                  </Typography>
                  <Typography variant="body2">{data?.vehicle?.license_plate}</Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" color="text.disabled">
                    VEHICLE INFO
                  </Typography>
                  <Typography variant="body2">
                    {`${data?.vehicle?.info} (${data?.vehicle?.year})`}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
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
            </Stack>
          </Card>
        </Box>

        <Box sx={{ p: 2 }}>
          <Card sx={{ p: 2 }}>
            <Stack spacing={1} direction="column">
              <Stack
                justifyContent="space-between"
                direction="row"
                alignItems="center"
                sx={{ py: 1 }}
              >
                <Typography variant="body1">Recent Inspection Activity</Typography>
              </Stack>

              <Divider />

              {inspectionList.map((item: any, index: number) => (
                <Box key={`${index}`}>
                  <Stack
                    justifyContent="space-between"
                    direction={{ xs: 'column', md: 'row' }}
                    alignItems={{ xs: 'space-between', md: 'center' }}
                    sx={{ py: 1 }}
                    gap={1}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      flex={1}
                      alignItems="center"
                    >
                      <Stack direction="column" alignItems="start">
                        <Typography variant="body1">{item.label}</Typography>
                        <Typography variant="caption" color="text.disabled">
                          {!item.has_defect
                            ? `Ongoing - ${fDate(dayjs().toISOString())}`
                            : `Completed - ${fDate(dayjs().toISOString())}`}
                        </Typography>
                      </Stack>

                      <Label
                        variant="soft"
                        color={
                          !item.has_defect
                            ? 'default'
                            : item.has_defect?.toLowerCase() == 'yes'
                              ? 'error'
                              : 'success'
                        }
                        sx={{
                          py: 2,
                          px: 3,
                        }}
                      >
                        {!item?.has_defect
                          ? 'Not Started'
                          : item.has_defect?.toLowerCase() == 'yes'
                            ? 'Defect Found'
                            : 'No Defect Found'}
                      </Label>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => {
                          setOpenModalIndex(index);
                          modal.onTrue();
                        }}
                        disabled={item.has_defect?.toLowerCase() == 'no' || !item.has_defect}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </Stack>
                  <Divider />
                </Box>
              ))}
            </Stack>
          </Card>
        </Box>

        <AdminDefectModal
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
