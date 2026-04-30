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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { useUpdateVehicleInspection } from 'src/actions/vehicle-inspection';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { DefectModal } from './pre-trip-defect-modal-form';

//-----------------------------------------------------------------------------
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

export function PreTripVehicleEditForm({ data, inspections }: Props) {
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
        <Card sx={{ mt: 1 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Job Details
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
                  borderRight: { xs: 'none', md: 1 },
                  borderColor: { xs: '', md: 'divider' },
                  gap: 1,
                  px: 1,
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

            {inspectionList.map((inspection: any, index: any) => {
              const itemError = (errors.inspections as any)?.[index as number];
              return (
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}
                    >
                      <Typography variant="subtitle1">
                        {`${index + 1} - ${inspection.label}`}
                      </Typography>
                      {inspection.is_required && <Typography color="error">*</Typography>}
                    </Box>

                    {itemError && (
                      <Typography variant="caption" color="error.main">
                        {itemError?.has_defect?.message}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <IconButton
                      onClick={() => {
                        setValue(`inspections.${index}.has_defect`, 'no', {
                          shouldValidate: true,
                        });
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
                        setValue(`inspections.${index}.has_defect`, 'yes', {
                          shouldValidate: true,
                        });
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
              );
            })}
          </Box>
        </Card>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            type="button"
            variant="contained"
            size="large"
            sx={{ minWidth: { xs: '120px', md: '140px' } }}
            onClick={async () => {
              await methods.trigger();
              if (!isValid) return;

              try {
                const formData = getValues();
                const payload = {
                  id: data.id,
                  job_id: data.job_id,
                  created_at: data.created_at,
                  submitted_at: dayjs().toISOString(),
                  inspections: formData,
                };
                console.log(payload);
                await updateRequest.mutateAsync({ id: payload.id, data: payload });
                toast.success('Inspection updated successfully!');
              } catch (error: any) {
                console.error('Error while updating vehicle inspection.');
                toast.error('Error while updating vehicle inspection.');
                return;
              }
            }}
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
              await methods.trigger();
              if (!isValid) return;
              try {
                const formData = getValues();
                const payload = {
                  id: data.id,
                  job_id: data.job_id,
                  created_at: data.created_at,
                  submitted_at: dayjs().toISOString(),
                  inspections: formData,
                };
                console.log(payload);
                await updateRequest.mutateAsync({ id: payload.id, data: payload });
                toast.success('Inspection submitted successfully!');
              } catch (error: any) {
                console.error('Error while submitting vehicle inspection.');
                toast.error('Error while submitting vehicle inspection.');
                return;
              }
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
