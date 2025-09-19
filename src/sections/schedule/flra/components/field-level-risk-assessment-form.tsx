import type { FieldLevelRiskAssessmentType } from 'src/pages/template/field-level-risk-assessment';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useRouter } from 'src/routes/hooks';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import { fetcher, endpoints } from 'src/lib/axios';
import FieldLevelRiskAssessmentPdf from 'src/pages/template/field-level-risk-assessment';

import { Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { SignatureStep } from './signature-step';
import { FlraDiagramForm } from './flra-diagram-form';
import { RiskAssessmentForm } from './risk-assessment-form';
import { AssessmentDetailForm } from './assessment-detail-form';
import { TrafficControlPlanForm } from './traffic-control-plan-form';

// Zod schema for FLRA validation
const FlraSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  date: z.string().min(1, 'Date is required'),
  site_foreman_name: z.string().min(1, 'Site foreman name is required'),
  contact_number: z.string().min(1, 'Contact number is required'),
  site_location: z.string().min(1, 'Site location is required'),
  company_contract: z.string().optional(),
  closest_hospital: z.string().optional(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  first_aid_on_site: z.string().optional(),
  first_aid_kit: z.string().optional(),
  signature: z
    .string()
    .nullable()
    .refine((val) => val !== null && val !== '', {
      message: 'Signature is required',
    }),
  flraDiagram: z.string().nullable().optional(),
  // Add other required fields as needed
  descriptionOfWork: z
    .object({
      road: z.string().optional(),
      distance: z.string().optional(),
      weather: z.string().optional(),
      roadOther: z.string().optional(),
      distanceOther: z.string().optional(),
    })
    .optional(),
  scopeOfWork: z
    .object({
      roadType: z
        .object({
          single_lane_alternating: z.boolean(),
          lane_closure: z.boolean(),
          road_closed: z.boolean(),
          shoulder_work: z.boolean(),
          turn_lane_closure: z.boolean(),
          showing_traffic: z.boolean(),
          other: z.boolean(),
        })
        .optional(),
      otherDescription: z.string().optional(),
      contractToolBox: z.string().optional(),
    })
    .optional(),
  present: z
    .object({
      identified: z.string().optional(),
      reduce: z.string().optional(),
      experienced: z.string().optional(),
      complete: z.string().optional(),
    })
    .optional(),
  riskAssessment: z
    .object({
      visibility: z.string().optional(),
      lineOfSight: z.string().optional(),
      slipAndStrip: z.string().optional(),
      holes: z.string().optional(),
      weather: z.string().optional(),
      dust: z.string().optional(),
      fumes: z.string().optional(),
      noise: z.string().optional(),
      blindSpot: z.string().optional(),
      overHeadLines: z.string().optional(),
      workingAlone: z.string().optional(),
      mobileEquipment: z.string().optional(),
      trafficVolume: z.string().optional(),
      conditions: z.string().optional(),
      utilities: z.string().optional(),
      fatigue: z.string().optional(),
      controlMeasure: z.string().optional(),
      other: z.string().optional(),
      otherDescription: z.string().optional(),
    })
    .optional(),
  trafficControlPlans: z.tuple([
    z.object({
      hazard_risk_assessment: z.string(),
      control_measure: z.string(),
    }),
  ]),
  updates: z.tuple([
    z.object({
      date_time_updates: z.string(),
      changes: z.string(),
      additional_control: z.string(),
      initial: z.string(),
    }),
  ]),
  responsibilities: z.tuple([
    z.object({
      role: z.string(),
      serialNumber: z.string(),
      responsibility: z.string(),
      initial: z.string(),
    }),
  ]),
  authorizations: z.tuple([
    z.object({
      fullName: z.string(),
      company: z.string(),
      date_time: z.string(),
    }),
  ]),
  supervisionLevels: z
    .object({
      communicationMode: z.boolean().optional(),
      pictureSubmission: z.boolean().optional(),
      supervisorPresence: z.boolean().optional(),
    })
    .optional(),
}) as z.ZodType<FieldLevelRiskAssessmentType>;

type Props = {
  jobData?: any;
};

export function FieldLevelRiskAssessment({ jobData }: Props) {
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const formSections = [
    'Assessment Details',
    'Risk Assessments',
    'Traffic Control Plan',
    'FLRA Diagram',
    'Signature',
  ];

  // State for FLRA ID
  const [flraId, setFlraId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to track if form has been initialized to prevent reset
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Check if FLRA already exists for this job
  useEffect(() => {
    const checkExistingFlra = async () => {
      if (!jobData?.id) return;

      try {
        const response = await fetcher(endpoints.flra.list);
        const existingFlra = response.data.flra_forms.find(
          (flra: any) => flra.job_id === jobData.id && flra.status === 'draft'
        );

        if (existingFlra) {
          setFlraId(existingFlra.id);
        }
      } catch (error) {
        console.error('Error checking for existing FLRA:', error);
      }
    };

    checkExistingFlra();
  }, [jobData?.id]);

  // Memoize the steps to prevent re-mounting and losing form state
  const steps = useMemo(
    () => [
      <AssessmentDetailForm key="assessment-detail" jobData={jobData} />,
      <RiskAssessmentForm key="risk-assessment" />,
      <TrafficControlPlanForm key="traffic-control-plan" />,
      <FlraDiagramForm key="flra-diagram" />,
      <SignatureStep key="signature-step" />,
    ],
    [jobData]
  );

  const { currentStepIndex, step, prev, next } = useMultiStepForm(steps);

  // Memoize default values to prevent form re-initialization
  const defaultValues = useMemo(
    () => ({
      full_name: user?.displayName ?? null,
      date: '',
      site_foreman_name: '',
      contact_number: '',
      site_location: '',
      company_contract: '',
      closest_hospital: '',
      start_time: '',
      end_time: '',
      first_aid_on_site: '',
      first_aid_kit: '',
      descriptionOfWork: {
        road: '',
        distance: '',
        weather: '',
        roadOther: '',
        distanceOther: '',
      },
      scopeOfWork: {
        roadType: {
          single_lane_alternating: false,
          lane_closure: false,
          road_closed: false,
          shoulder_work: false,
          turn_lane_closure: false,
          showing_traffic: false,
          other: false,
        },
        otherDescription: '',
        contractToolBox: '',
      },
      present: {
        identified: '',
        reduce: '',
        experienced: '',
        complete: '',
      },
      riskAssessment: {
        visibility: '',
        lineOfSight: '',
        slipAndStrip: '',
        holes: '',
        weather: '',
        dust: '',
        fumes: '',
        noise: '',
        blindSpot: '',
        overHeadLines: '',
        workingAlone: '',
        mobileEquipment: '',
        trafficVolume: '',
        conditions: '',
        utilities: '',
        fatigue: '',
        controlMeasure: '',
        other: '',
        otherDescription: '',
      },
      trafficControlPlans: [
        {
          hazard_risk_assessment: '',
          control_measure: '',
        },
      ] as [{ hazard_risk_assessment?: string; control_measure?: string }],
      updates: [
        {
          date_time_updates: '',
          changes: '',
          additional_control: '',
          initial: '',
        },
      ] as [
        {
          date_time_updates?: string;
          changes?: string;
          additional_control?: string;
          initial?: string;
        },
      ],
      responsibilities: [
        {
          role: '',
          serialNumber: '',
          responsibility: '',
          initial: '',
        },
      ] as [{ role?: string; serialNumber?: string; responsibility?: string; initial?: string }],
      authorizations: [
        {
          fullName: '',
          company: '',
          date_time: '',
        },
      ] as [{ fullName?: string; company?: string; date_time?: string }],
      supervisionLevels: {
        communicationMode: false,
        pictureSubmission: false,
        supervisorPresence: false,
      },
      signature: null,
      flraDiagram: null,
    }),
    [user?.displayName]
  );

  // Setting default values for testing purposes
  const methods = useForm<FieldLevelRiskAssessmentType>({
    mode: 'all',
    resolver: zodResolver(FlraSchema),
    defaultValues,
  });

  const [previewData, setPreviewData] = useState<FieldLevelRiskAssessmentType | null>(null);
  const submitDialog = useBoolean();
  const previewDialog = useBoolean();
  const stepSectionRef = useRef<HTMLDivElement>(null);

  const {
    getValues,
  } = methods;

  // Initialize form only once
  useEffect(() => {
    if (!isFormInitialized) {
      // Clear any existing sessionStorage data that might interfere
      sessionStorage.removeItem('flra-supervision-levels');
      setIsFormInitialized(true);
    }
  }, [isFormInitialized]);

  const onSubmit = async () => {
    const values = getValues();
    try {
      await handleExportPDF(values);
    } catch (error) {
      console.error('ERROR: ', { error });
    }
  };


  // Function to scroll to step section
  const scrollToStepSection = useCallback(() => {
    if (stepSectionRef.current) {
      stepSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Remove auto-save to prevent excessive API requests
  // Data will be saved only when user submits the form

  // Function to upload FLRA diagram to Cloudinary
  const uploadFlraDiagram = async (base64Image: string, jobId: string): Promise<string> => {
    try {
      // Convert base64 to File
      const response = await fetch(base64Image);
      const blob = await response.blob();
      const file = new File([blob], 'flra-diagram.png', { type: 'image/png' });

      const timestamp = Math.floor(Date.now() / 1000);
      const public_id = `flra/${jobId}/diagram_${jobId}_${timestamp}`;
      const folder = `flra/${jobId}`;

      const query = new URLSearchParams({
        public_id,
        timestamp: timestamp.toString(),
        folder,
        action: 'upload',
      }).toString();

      const { signature: cloudinarySignature, api_key, cloud_name } = await fetcher([
        `${endpoints.cloudinary.upload}/signature?${query}`,
        { method: 'GET' },
      ]);

      // Upload file with signed params
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', cloudinarySignature);
      formData.append('public_id', public_id);
      formData.append('overwrite', 'true');
      formData.append('folder', folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

      const uploadRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
      }

      return uploadData.secure_url;
    } catch (error) {
      console.error('Error uploading FLRA diagram:', error);
      throw error;
    }
  };

  // Function to create or update FLRA in database (currently unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveFlraToDatabase = async (data: FieldLevelRiskAssessmentType) => {
    try {
      const flraData = {
        job_id: jobData?.id,
        assessment_details: {
          full_name: data.full_name,
          date: data.date,
          site_foreman_name: data.site_foreman_name,
          contact_number: data.contact_number,
          company_contract: data.company_contract,
          closest_hospital: data.closest_hospital,
          site_location: data.site_location,
          start_time: data.start_time,
          end_time: data.end_time,
          first_aid_on_site: data.first_aid_on_site,
          first_aid_kit: data.first_aid_kit,
        },
        risk_assessments: {
          ...data.riskAssessment,
          otherDescription: data.riskAssessment?.otherDescription || '',
        },
        traffic_control_plan: {
          scopeOfWork: {
            roadType: Array.isArray(data.scopeOfWork?.roadType)
              ? {
                  single_lane_alternating: false,
                  lane_closure: false,
                  road_closed: false,
                  shoulder_work: false,
                  turn_lane_closure: false,
                  showing_traffic: false,
                  other: false,
                }
              : data.scopeOfWork?.roadType || {
                  single_lane_alternating: false,
                  lane_closure: false,
                  road_closed: false,
                  shoulder_work: false,
                  turn_lane_closure: false,
                  showing_traffic: false,
                  other: false,
                },
            contractToolBox: data.scopeOfWork?.contractToolBox || '',
            otherDescription: data.scopeOfWork?.otherDescription || '',
          },
          descriptionOfWork: {
            road: data.descriptionOfWork?.road || '',
            distance: data.descriptionOfWork?.distance || '',
            weather: data.descriptionOfWork?.weather || '',
            roadOther: data.descriptionOfWork?.roadOther || '',
            distanceOther: data.descriptionOfWork?.distanceOther || '',
          },
          present: {
            identified: data.present?.identified || '',
            reduce: data.present?.reduce || '',
            experienced: data.present?.experienced || '',
            complete: data.present?.complete || '',
          },
          supervisionLevels: {
            communicationMode: data.supervisionLevels?.communicationMode || false,
            pictureSubmission: data.supervisionLevels?.pictureSubmission || false,
            supervisorPresence: data.supervisionLevels?.supervisorPresence || false,
          },
          authorizations: data.authorizations || [],
          updates: data.updates || [],
          responsibilities: data.responsibilities || [],
        },
        flra_diagram: data.flraDiagram || null,
        signature: data.signature || null,
        additional_signatures: null, // For future use
      };

      if (flraId) {
        // Update existing FLRA
        await fetcher([
          endpoints.flra.update.replace(':id', flraId),
          {
            method: 'PUT',
            data: flraData,
          },
        ]);
      } else {
        // Create new FLRA
        const response = await fetcher([
          endpoints.flra.create,
          {
            method: 'POST',
            data: flraData,
          },
        ]);
        setFlraId(response.data.flra_form.id);
      }
    } catch (error) {
      console.error('Error saving FLRA to database:', error);
      throw error;
    }
  };

  const handleExportPDF = async (data: FieldLevelRiskAssessmentType) => {
    try {
      // Transform data to match PDF template expectations
      const transformedData = {
        ...data,
        scopeOfWork: {
          roadType: Array.isArray(data.scopeOfWork?.roadType)
            ? {
                single_lane_alternating: false,
                lane_closure: false,
                road_closed: false,
                shoulder_work: false,
                turn_lane_closure: false,
                showing_traffic: false,
                other: false,
              }
            : data.scopeOfWork?.roadType || {
                single_lane_alternating: false,
                lane_closure: false,
                road_closed: false,
                shoulder_work: false,
                turn_lane_closure: false,
                showing_traffic: false,
                other: false,
              },
          contractToolBox: data.scopeOfWork?.contractToolBox || '',
          otherDescription: data.scopeOfWork?.otherDescription || '',
        },
        descriptionOfWork: {
          road: data.descriptionOfWork?.road || '',
          distance: data.descriptionOfWork?.distance || '',
          weather: data.descriptionOfWork?.weather || '',
          roadOther: data.descriptionOfWork?.roadOther || '',
          distanceOther: data.descriptionOfWork?.distanceOther || '',
        },
        present: {
          identified: data.present?.identified || '',
          reduce: data.present?.reduce || '',
          experienced: data.present?.experienced || '',
          complete: data.present?.complete || '',
        },
        supervisionLevels: {
          communicationMode: data.supervisionLevels?.communicationMode || false,
          pictureSubmission: data.supervisionLevels?.pictureSubmission || false,
          supervisorPresence: data.supervisionLevels?.supervisorPresence || false,
        },
        riskAssessment: {
          ...data.riskAssessment,
          otherDescription: data.riskAssessment?.otherDescription || '',
        },
        authorizations: data.authorizations || [],
        updates: data.updates || [],
        responsibilities: data.responsibilities || [],
      };

      const blob = await pdf(<FieldLevelRiskAssessmentPdf assessment={transformedData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with safety checks
      // const clientName = response.data?.client?.name || 'unknown';
      // const jobNumber = response.data?.job?.job_number || 'unknown';
      // const timesheetDate = response.data?.timesheet?.timesheet_date || response.data?.job?.start_time || new Date();

      // Format client name: remove spaces, convert to lowercase
      // const formattedClientName = clientName.replace(/\s+/g, '-').toLowerCase();

      const filename = `field-level-risk-assessment.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup after downloading the file
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 300);
      submitDialog.onFalse();
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      throw new Error('Failed to generate PDF');
    }
  };

  const renderPreviewDialog = () => {
    // Transform data for preview
    const transformedPreviewData = previewData
      ? {
          ...previewData,
          scopeOfWork: {
            roadType: Array.isArray(previewData.scopeOfWork?.roadType)
              ? {
                  single_lane_alternating: false,
                  lane_closure: false,
                  road_closed: false,
                  shoulder_work: false,
                  turn_lane_closure: false,
                  showing_traffic: false,
                  other: false,
                }
              : previewData.scopeOfWork?.roadType || {
                  single_lane_alternating: false,
                  lane_closure: false,
                  road_closed: false,
                  shoulder_work: false,
                  turn_lane_closure: false,
                  showing_traffic: false,
                  other: false,
                },
            contractToolBox: previewData.scopeOfWork?.contractToolBox || '',
            otherDescription: previewData.scopeOfWork?.otherDescription || '',
          },
          descriptionOfWork: {
            road: previewData.descriptionOfWork?.road || '',
            distance: previewData.descriptionOfWork?.distance || '',
            weather: previewData.descriptionOfWork?.weather || '',
            roadOther: previewData.descriptionOfWork?.roadOther || '',
            distanceOther: previewData.descriptionOfWork?.distanceOther || '',
          },
          present: {
            identified: previewData.present?.identified || '',
            reduce: previewData.present?.reduce || '',
            experienced: previewData.present?.experienced || '',
            complete: previewData.present?.complete || '',
          },
          supervisionLevels: {
            communicationMode: previewData.supervisionLevels?.communicationMode || false,
            pictureSubmission: previewData.supervisionLevels?.pictureSubmission || false,
            supervisorPresence: previewData.supervisionLevels?.supervisorPresence || false,
          },
          riskAssessment: {
            ...previewData.riskAssessment,
            otherDescription: previewData.riskAssessment?.otherDescription || '',
          },
          authorizations: previewData.authorizations || [],
          updates: previewData.updates || [],
          responsibilities: previewData.responsibilities || [],
        }
      : null;

    return (
      <Dialog fullWidth maxWidth="lg" open={previewDialog.value} onClose={previewDialog.onFalse}>
        <DialogTitle sx={{ pb: 2 }}>FLRA Preview</DialogTitle>
        <DialogContent sx={{ typography: 'body2', height: '80vh', p: 0 }}>
          {transformedPreviewData && (
            <PDFViewer width="100%" height="100%">
              <FieldLevelRiskAssessmentPdf assessment={transformedPreviewData} />
            </PDFViewer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              previewDialog.onFalse();
              setPreviewData(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              previewDialog.onFalse();
              submitDialog.onTrue();
            }}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            Submit Assessment
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderSubmitDialog = () => (
    <Dialog fullWidth maxWidth="md" open={submitDialog.value} onClose={submitDialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>Submit FLRA Assessment</DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Are you sure you want to submit this FLRA assessment? Once submitted, it cannot be
          modified.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            submitDialog.onFalse();
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="success"
          onClick={async () => {
            const values = getValues();
            setIsSubmitting(true);
            try {
              let diagramUrl = null;

              // Upload diagram to Cloudinary if it exists
              if (values.flraDiagram && jobData?.id) {
                try {
                  diagramUrl = await uploadFlraDiagram(values.flraDiagram, jobData.id);
                } catch (error) {
                  console.error('Error uploading diagram:', error);
                  // Continue without diagram if upload fails
                }
              }

              // Prepare FLRA data with Cloudinary URL
              const flraData = {
                job_id: jobData?.id,
                assessment_details: {
                  full_name: values.full_name,
                  date: values.date,
                  site_foreman_name: values.site_foreman_name,
                  contact_number: values.contact_number,
                  company_contract: values.company_contract,
                  closest_hospital: values.closest_hospital,
                  site_location: values.site_location,
                  start_time: values.start_time,
                  end_time: values.end_time,
                  first_aid_on_site: values.first_aid_on_site,
                  first_aid_kit: values.first_aid_kit,
                },
                risk_assessments: {
                  ...values.riskAssessment,
                  otherDescription: values.riskAssessment?.otherDescription || '',
                },
                traffic_control_plan: {
                  scopeOfWork: {
                    roadType: Array.isArray(values.scopeOfWork?.roadType)
                      ? {
                          single_lane_alternating: false,
                          lane_closure: false,
                          road_closed: false,
                          shoulder_work: false,
                          turn_lane_closure: false,
                          showing_traffic: false,
                          other: false,
                        }
                      : values.scopeOfWork?.roadType || {
                          single_lane_alternating: false,
                          lane_closure: false,
                          road_closed: false,
                          shoulder_work: false,
                          turn_lane_closure: false,
                          showing_traffic: false,
                          other: false,
                        },
                    contractToolBox: values.scopeOfWork?.contractToolBox || '',
                    otherDescription: values.scopeOfWork?.otherDescription || '',
                  },
                  descriptionOfWork: {
                    road: values.descriptionOfWork?.road || '',
                    distance: values.descriptionOfWork?.distance || '',
                    weather: values.descriptionOfWork?.weather || '',
                    roadOther: values.descriptionOfWork?.roadOther || '',
                    distanceOther: values.descriptionOfWork?.distanceOther || '',
                  },
                  present: {
                    identified: values.present?.identified || '',
                    reduce: values.present?.reduce || '',
                    experienced: values.present?.experienced || '',
                    complete: values.present?.complete || '',
                  },
                  supervisionLevels: {
                    communicationMode: values.supervisionLevels?.communicationMode || false,
                    pictureSubmission: values.supervisionLevels?.pictureSubmission || false,
                    supervisorPresence: values.supervisionLevels?.supervisorPresence || false,
                  },
                  authorizations: values.authorizations || [],
                  updates: values.updates || [],
                  responsibilities: values.responsibilities || [],
                },
                flra_diagram: diagramUrl,
                signature: values.signature || null,
                additional_signatures: null,
              };

              // Create FLRA if it doesn't exist, then submit it
              let currentFlraId = flraId;

              if (!currentFlraId) {
                // Create new FLRA first
                const createResponse = await fetcher([
                  endpoints.flra.create,
                  {
                    method: 'POST',
                    data: flraData,
                  },
                ]);
                currentFlraId = createResponse.data.flra_form.id;
                setFlraId(currentFlraId);
              } else {
                // Update existing FLRA
                await fetcher([
                  endpoints.flra.update.replace(':id', currentFlraId),
                  {
                    method: 'PUT',
                    data: flraData,
                  },
                ]);
              }

              // Submit the FLRA (change status to submitted)
              if (!currentFlraId) {
                throw new Error('FLRA ID is required for submission');
              }

              await fetcher([
                endpoints.flra.submit.replace(':id', currentFlraId),
                {
                  method: 'POST',
                  data: flraData,
                },
              ]);

              // Invalidate FLRA list query to refresh the data
              await queryClient.invalidateQueries({ queryKey: ['flra-forms-list'] });

              // Show success message
              toast.success('FLRA submitted successfully!');

              // Close dialog and redirect to FLRA list
              submitDialog.onFalse();
              router.push('/schedules/flra/list');
            } catch (error) {
              console.error('Error submitting FLRA:', error);
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Card ref={stepSectionRef} sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={currentStepIndex} alternativeLabel>
          {formSections.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ py: 3, px: 5 }}>
          <Stack spacing={3}>{step}</Stack>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            mt={5}
          >
            {currentStepIndex !== 0 ? (
              <Button
                type="button"
                variant="contained"
                onClick={() => {
                  prev();
                  // Scroll to step section after a brief delay to allow step to update
                  setTimeout(() => {
                    scrollToStepSection();
                  }, 100);
                }}
              >
                Prev
              </Button>
            ) : (
              <Stack />
            )}
            <Stack>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Page {`${currentStepIndex + 1} of ${steps.length}`}
              </Typography>
            </Stack>

            {currentStepIndex < steps.length - 1 ? (
              <Button
                type="button"
                variant="contained"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  next();
                  // Scroll to step section after a brief delay to allow step to update
                  setTimeout(() => {
                    scrollToStepSection();
                  }, 100);
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                color="success"
                onClick={() => {
                  const values = getValues();

                  // Validate signature before showing preview
                  if (!values.signature || values.signature.trim() === '') {
                    toast.error(
                      'Signature is required. Please add your signature before previewing.'
                    );
                    return;
                  }

                  setPreviewData(values);
                  previewDialog.onTrue();
                }}
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                Preview & Submit
              </Button>
            )}
          </Stack>
        </Card>
        {renderPreviewDialog()}
        {renderSubmitDialog()}
        {/* {renderOperatorSignatureDialog()} */}
      </Form>
    </>
  );
}
