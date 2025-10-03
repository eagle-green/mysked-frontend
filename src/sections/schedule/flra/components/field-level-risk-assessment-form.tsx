import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import type { FieldLevelRiskAssessmentType } from 'src/pages/template/field-level-risk-assessment';

import { z } from 'zod';
import { Buffer } from 'buffer';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { Page, pdfjs, Document } from 'react-pdf';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { zodResolver } from '@hookform/resolvers/zod';

// Set up PDF.js worker - use unpkg instead of cdnjs for better reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}
import { useQueryClient } from '@tanstack/react-query';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import { useMediaQuery } from '@mui/material';
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
  present: z.object({
    identified: z.string().min(1, 'Escape route identification is required'),
    reduce: z.string().min(1, 'Speed reduction indication is required'),
    experienced: z.string().min(1, 'LCT/TCP experience indication is required'),
    complete: z.string().min(1, 'Young/new worker form indication is required'),
  }),
  riskAssessment: z.object({
    visibility: z.string().min(1, 'Visibility is required'),
    lineOfSight: z.string().min(1, 'Line of Sight is required'),
    slipAndStrip: z.string().min(1, 'Slip & Strip is required'),
    holes: z.string().min(1, 'Holes is required'),
    weather: z.string().min(1, 'Weather is required'),
    dust: z.string().min(1, 'Dust is required'),
    fumes: z.string().min(1, 'Fumes is required'),
    noise: z.string().min(1, 'Noise is required'),
    blindSpot: z.string().min(1, 'Blind Spot is required'),
    overHeadLines: z.string().min(1, 'Over Head Lines is required'),
    workingAlone: z.string().min(1, 'Working Alone is required'),
    mobileEquipment: z.string().min(1, 'Mobile Equipment is required'),
    trafficVolume: z.string().min(1, 'Traffic Volume is required'),
    conditions: z.string().min(1, 'Conditions is required'),
    utilities: z.string().min(1, 'Utilities is required'),
    fatigue: z.string().min(1, 'Fatigue is required'),
    controlMeasure: z.string().min(1, 'Control Measure is required'),
    other: z.string().optional(),
    otherDescription: z.string().optional(),
  }),
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
  supervisionLevel: z.enum(['low', 'medium', 'high']).optional(),
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
  editData?: any; // Existing FLRA data for editing
  flraId?: string; // FLRA ID for updating
};

export function FieldLevelRiskAssessment({ jobData, editData, flraId }: Props) {
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery('(max-width:768px)');

  // Debug: Log the props received
  const formSections = [
    'Assessment Details',
    'Risk Assessments',
    'Traffic Control Plan',
    'FLRA Diagram',
    'Signature',
  ];

  // State for FLRA ID
  const [currentFlraId, setCurrentFlraId] = useState<string | null>(flraId || null);
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
          setCurrentFlraId(existingFlra.id);
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
  const defaultValues = useMemo(() => {
    // If editing existing FLRA, use editData
    if (editData) {
      // Parse JSON strings from API
      let assessmentDetails = {};
      let riskAssessments = {};
      let trafficControlPlan = {};

      try {
        assessmentDetails = editData.assessment_details
          ? JSON.parse(editData.assessment_details)
          : {};
      } catch (e) {
        console.error('Error parsing assessment_details:', e);
      }

      try {
        riskAssessments = editData.risk_assessments ? JSON.parse(editData.risk_assessments) : {};
      } catch (e) {
        console.error('Error parsing risk_assessments:', e);
      }

      try {
        trafficControlPlan = editData.traffic_control_plan
          ? JSON.parse(editData.traffic_control_plan)
          : {};
      } catch (e) {
        console.error('Error parsing traffic_control_plan:', e);
      }

      return {
        full_name: (assessmentDetails as any)?.full_name || (user?.displayName ?? null),
        date: (assessmentDetails as any)?.date || '',
        site_foreman_name: (assessmentDetails as any)?.site_foreman_name || '',
        contact_number: (assessmentDetails as any)?.contact_number || '',
        site_location: (assessmentDetails as any)?.site_location || '',
        company_contract: (assessmentDetails as any)?.company_contract || '',
        closest_hospital: (assessmentDetails as any)?.closest_hospital || '',
        start_time: (assessmentDetails as any)?.start_time || '',
        end_time: (assessmentDetails as any)?.end_time || '',
        first_aid_on_site: (assessmentDetails as any)?.first_aid_on_site || '',
        first_aid_kit: (assessmentDetails as any)?.first_aid_kit || '',
        descriptionOfWork: (trafficControlPlan as any)?.descriptionOfWork || {
          road: '',
          distance: '',
          weather: '',
          roadOther: '',
          distanceOther: '',
        },
        scopeOfWork: (trafficControlPlan as any)?.scopeOfWork || {
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
        present: (trafficControlPlan as any)?.present || {
          identified: '',
          reduce: '',
          experienced: '',
          complete: '',
        },
        riskAssessment: (riskAssessments as any) || {
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
        trafficControlPlans:
          (trafficControlPlan as any)?.trafficControlPlans ||
          ([
            {
              hazard_risk_assessment: '',
              control_measure: '',
            },
          ] as [{ hazard_risk_assessment?: string; control_measure?: string }]),
        updates:
          (trafficControlPlan as any)?.updates ||
          ([
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
          ]),
        responsibilities:
          (trafficControlPlan as any)?.responsibilities ||
          ([
            {
              role: '',
              serialNumber: '',
              responsibility: '',
              initial: '',
            },
          ] as [
            { role?: string; serialNumber?: string; responsibility?: string; initial?: string },
          ]),
        authorizations:
          (trafficControlPlan as any)?.authorizations ||
          ([
            {
              fullName: '',
              company: '',
              date_time: '',
            },
          ] as [{ fullName?: string; company?: string; date_time?: string }]),
        // Map supervision level from supervisionLevels object
        supervisionLevel: (() => {
          const supervisionLevels = (trafficControlPlan as any)?.supervisionLevels || {};
          if (supervisionLevels.supervisorPresence) return 'high' as const;
          if (supervisionLevels.pictureSubmission) return 'medium' as const;
          if (supervisionLevels.communicationMode) return 'low' as const;
          return undefined;
        })(),
        supervisionLevels: (trafficControlPlan as any)?.supervisionLevels || {
          communicationMode: false,
          pictureSubmission: false,
          supervisorPresence: false,
        },
        signature: editData.signature || null,
        flraDiagram: editData.flra_diagram || null,
      };
    }

    // Default values for new FLRA
    return {
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
    };
  }, [user?.displayName, editData]);

  // Setting default values for testing purposes
  const methods = useForm<FieldLevelRiskAssessmentType>({
    mode: 'all',
    resolver: zodResolver(FlraSchema),
    defaultValues,
  });

  // Debug: Log form values after initialization
  React.useEffect(() => {}, [methods]);

  // Initialize form with editData only once
  React.useEffect(() => {
    if (editData && flraId && !isFormInitialized) {
      // Use setTimeout to ensure the form is ready
      setTimeout(() => {
        methods.reset(defaultValues);
        setIsFormInitialized(true);
      }, 100);
    }
  }, [editData, flraId, isFormInitialized, defaultValues, methods]);

  const [previewData, setPreviewData] = useState<FieldLevelRiskAssessmentType | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageKey, setPageKey] = useState(0); // Force re-render key
  const submitDialog = useBoolean();
  const previewDialog = useBoolean();
  const stepSectionRef = useRef<HTMLDivElement>(null);

  const {
    getValues,
    trigger,
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


  // Helper function to delete all diagrams (handles both single URL and JSON array of URLs)
  const deleteAllDiagramsFromCloudinary = async (diagramData: string): Promise<void> => {
    try {
      // Check if it's a JSON array or single URL
      let urls: string[] = [];

      if (diagramData.startsWith('[')) {
        // JSON array format
        try {
          urls = JSON.parse(diagramData);
          if (!Array.isArray(urls)) {
            urls = [diagramData];
          }
        } catch {
          urls = [diagramData];
        }
      } else {
        // Single URL
        urls = [diagramData];
      }

      // Delete all URLs
      const deletePromises = urls.map((url) => deleteFlraDiagramFromCloudinary(url));
      await Promise.allSettled(deletePromises); // Use allSettled so one failure doesn't stop others
    } catch (error) {
      console.error('Error in deleteAllDiagramsFromCloudinary:', error);
      // Don't throw - we still want to proceed with the update
    }
  };

  // Function to delete a single FLRA diagram from Cloudinary
  const deleteFlraDiagramFromCloudinary = async (cloudinaryUrl: string): Promise<void> => {
    try {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/flra/jobId/diagram_jobId_timestamp.jpg
      // OR: https://res.cloudinary.com/cloud_name/image/upload/flra/jobId/diagram_jobId_timestamp.jpg

      // Extract the part after '/upload/' - this is more reliable
      const uploadIndex = cloudinaryUrl.indexOf('/upload/');
      if (uploadIndex === -1) {
        console.error('Invalid Cloudinary URL - cannot find /upload/');
        return;
      }

      const afterUpload = cloudinaryUrl.substring(uploadIndex + 8); // '/upload/' is 8 characters

      // Remove version (vXXXXXXXX/) if present
      let pathWithoutVersion = afterUpload;
      if (afterUpload.startsWith('v')) {
        const parts = afterUpload.split('/');
        pathWithoutVersion = parts.slice(1).join('/'); // Remove version part
      }

      // Remove file extension
      const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');

      // Use the test delete endpoint which we know works
      await fetcher([
        `${endpoints.cloudinary.upload}/test-delete`,
        {
          method: 'POST',
          data: { public_id: publicId },
        },
      ]);
    } catch (error) {
      console.error('Error deleting diagram from Cloudinary:', error);
      // Don't throw error - we still want to update the database even if Cloudinary delete fails
    }
  };

  // Function to upload FLRA diagram to Cloudinary
  const uploadFlraDiagram = async (
    base64Image: string,
    jobId: string,
    index: number = 0
  ): Promise<string> => {
    try {
      // Convert base64 to File
      const response = await fetch(base64Image);
      const blob = await response.blob();
      const file = new File([blob], `flra-diagram-${index}.png`, { type: 'image/png' });

      const timestamp = Math.floor(Date.now() / 1000);
      const public_id = `flra/${jobId}/diagram_${jobId}_${timestamp}_${index}`;
      const folder = `flra/${jobId}`;

      const query = new URLSearchParams({
        public_id,
        timestamp: timestamp.toString(),
        folder,
        action: 'upload',
      }).toString();

      const {
        signature: cloudinarySignature,
        api_key,
        cloud_name,
      } = await fetcher([`${endpoints.cloudinary.upload}/signature?${query}`, { method: 'GET' }]);

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
            communicationMode: data.supervisionLevel === 'low',
            pictureSubmission: data.supervisionLevel === 'medium',
            supervisorPresence: data.supervisionLevel === 'high',
          },
          trafficControlPlans: data.trafficControlPlans || [],
          authorizations: data.authorizations || [],
          updates: data.updates || [],
          responsibilities: data.responsibilities || [],
        },
        flra_diagram: data.flraDiagram || null,
        signature: data.signature || null,
        additional_signatures: null, // For future use
      };

      if (currentFlraId) {
        // Update existing FLRA
        await fetcher([
          endpoints.flra.update.replace(':id', currentFlraId),
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
        setCurrentFlraId(response.data.flra_form.id);
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

  // Helper function for mobile PDF navigation
  const generatePdfBlob = useCallback(async () => {
    if (!previewData) return;

    try {
      const blob = await pdf(
        <FieldLevelRiskAssessmentPdf assessment={previewData} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (error) {
      console.error('Error generating PDF blob:', error);
    }
  }, [previewData]);

  const renderPreviewDialog = () => {
    // Transform data for preview FIRST (before using it)
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
            communicationMode: previewData.supervisionLevel === 'low',
            pictureSubmission: previewData.supervisionLevel === 'medium',
            supervisorPresence: previewData.supervisionLevel === 'high',
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


    const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
      // Only set numPages, don't reset pageNumber
      // This prevents the page from resetting to 1 when navigating
      if (numPages !== nextNumPages) {
        setNumPages(nextNumPages);
      }
    };

    const goToPrevPage = () => {
      setPageNumber((prevPage) => Math.max(prevPage - 1, 1));
      setPageKey((prevKey) => prevKey + 1); // Force re-render
    };
    const goToNextPage = () => {
      setPageNumber((prevPage) => Math.min(prevPage + 1, numPages || 1));
      setPageKey((prevKey) => prevKey + 1); // Force re-render
    };


    return (
      <Dialog
        fullWidth
        maxWidth="lg"
        open={previewDialog.value}
        onClose={previewDialog.onFalse}
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 2 }}>
          FLRA Preview
          {isMobile && numPages && (
            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
              Page {pageNumber} of {numPages}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent
          sx={{
            typography: 'body2',
            height: isMobile ? 'calc(100vh - 200px)' : '80vh',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {transformedPreviewData &&
            (isMobile ? (
              // Mobile: Use react-pdf Document/Page for better navigation
              <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {pdfBlobUrl ? (
                  <>
                    <Box
                      sx={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        p: 1,
                      }}
                    >
                      <Document
                        key={pdfBlobUrl} // Add key to force re-render when blob changes
                        file={pdfBlobUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '100%',
                            }}
                          >
                            <Typography>Loading PDF...</Typography>
                          </Box>
                        }
                      >
                        <Page
                          key={`page-${pageNumber}-${pageKey}`} // Use both pageNumber and pageKey
                          pageNumber={pageNumber}
                          width={window.innerWidth - 40}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadError={(error) =>
                            console.error(`Page ${pageNumber} load error:`, error)
                          }
                        />
                      </Document>
                    </Box>
                    {/* Mobile navigation controls */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={pageNumber <= 1}
                        onClick={goToPrevPage}
                        startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                      >
                        Previous
                      </Button>
                      <Typography variant="body2">
                        {pageNumber} / {numPages}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={pageNumber >= (numPages || 1)}
                        onClick={goToNextPage}
                        endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                      >
                        Next
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography>Generating PDF...</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              // Desktop: Use PDFViewer
              <PDFViewer width="100%" height="100%" showToolbar>
                <FieldLevelRiskAssessmentPdf assessment={transformedPreviewData} />
              </PDFViewer>
            ))}
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
              // Don't close preview dialog, just open submit dialog
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

  // Generate blob when preview dialog opens on mobile
  React.useEffect(() => {
    if (previewDialog.value && isMobile && previewData) {
      if (!pdfBlobUrl) {
        // Only generate blob and reset page if we don't have a blob yet
        generatePdfBlob();
        setPageNumber(1); // Reset to page 1 when dialog opens
        setPageKey(0); // Reset page key
      }
    } else if (!previewDialog.value && pdfBlobUrl) {
      // Cleanup blob URL when dialog closes
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [previewDialog.value, isMobile, previewData, pdfBlobUrl, generatePdfBlob]);

  const renderSubmitDialog = () => (
    <Dialog fullWidth maxWidth="md" open={submitDialog.value} onClose={submitDialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}>
        {flraId ? 'Update FLRA Assessment' : 'Submit FLRA Assessment'}
      </DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {flraId
            ? 'Are you sure you want to update this FLRA assessment? Changes will be saved immediately.'
            : 'Are you sure you want to submit this FLRA assessment? Once submitted, it cannot be modified.'}
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

              // For updates, handle diagram changes
              if (flraId) {
                if (values.flraDiagram === null) {
                  // User explicitly removed all diagrams - delete from Cloudinary if exists
                  if (editData?.flra_diagram) {
                    // Handle both JSON array (multiple images) and single URL formats
                    await deleteAllDiagramsFromCloudinary(editData.flra_diagram);
                  }
                  diagramUrl = null;
                } else if (values.flraDiagram && jobData?.id) {
                  // Upload new diagram(s) to Cloudinary
                  try {
                    // Delete old diagram(s) from Cloudinary if they exist
                    if (editData?.flra_diagram) {
                      // Handle both JSON array (multiple images) and single URL formats
                      await deleteAllDiagramsFromCloudinary(editData.flra_diagram);
                    }

                    // Parse the JSON string to get array of base64 images
                    const diagramArray = JSON.parse(values.flraDiagram);
                    if (Array.isArray(diagramArray) && diagramArray.length > 0) {
                      // Upload ALL images and store ALL URLs as JSON array string
                      const uploadPromises = diagramArray.map((base64Image, index) =>
                        uploadFlraDiagram(base64Image, jobData.id, index)
                      );
                      const uploadedUrls = await Promise.all(uploadPromises);
                      // Store all URLs as JSON array string (PDF template expects this format)
                      diagramUrl = JSON.stringify(uploadedUrls);
                    }
                  } catch (error) {
                    console.error('Error uploading diagram:', error);
                    // Continue without diagram if upload fails
                  }
                } else {
                  // No diagram data, keep existing or set to null
                  diagramUrl = editData?.flra_diagram || null;
                }
              } else if (values.flraDiagram && jobData?.id) {
                // For new FLRA, upload diagram(s)
                try {
                  const diagramArray = JSON.parse(values.flraDiagram);
                  if (Array.isArray(diagramArray) && diagramArray.length > 0) {
                    const uploadPromises = diagramArray.map((base64Image, index) =>
                      uploadFlraDiagram(base64Image, jobData.id, index)
                    );
                    const uploadedUrls = await Promise.all(uploadPromises);
                    // Store all URLs as JSON array string (PDF template expects this format)
                    diagramUrl = JSON.stringify(uploadedUrls);
                  }
                } catch (error) {
                  console.error('Error uploading diagram:', error);
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
                    communicationMode: values.supervisionLevel === 'low',
                    pictureSubmission: values.supervisionLevel === 'medium',
                    supervisorPresence: values.supervisionLevel === 'high',
                  },
                  trafficControlPlans: values.trafficControlPlans || [],
                  authorizations: values.authorizations || [],
                  updates: values.updates || [],
                  responsibilities: values.responsibilities || [],
                },
                flra_diagram: diagramUrl,
                signature: values.signature || null,
                additional_signatures: null,
              };

              // Create FLRA if it doesn't exist, then submit it
              let workingFlraId = currentFlraId;

              if (!workingFlraId) {
                // Create new FLRA first
                const createResponse = await fetcher([
                  endpoints.flra.create,
                  {
                    method: 'POST',
                    data: flraData,
                  },
                ]);
                workingFlraId = createResponse.data.flra_form.id;
                setCurrentFlraId(workingFlraId);
              } else {
                // Update existing FLRA
                await fetcher([
                  endpoints.flra.update.replace(':id', workingFlraId),
                  {
                    method: 'PUT',
                    data: flraData,
                  },
                ]);
              }

              if (flraId) {
                // Update existing FLRA without changing status
                // Invalidate FLRA list query to refresh the data
                await queryClient.invalidateQueries({ queryKey: ['flra-forms-list'] });
                await queryClient.invalidateQueries({ queryKey: ['flra-edit', flraId] });

                // Show success message
                toast.success('FLRA updated successfully!');

                // Close dialog and redirect to FLRA list
                submitDialog.onFalse();
                router.push('/schedules/flra/list');
              } else {
                // Submit the FLRA (change status to submitted) - only for new FLRA
                if (!workingFlraId) {
                  throw new Error('FLRA ID is required for submission');
                }

                await fetcher([
                  endpoints.flra.submit.replace(':id', workingFlraId),
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
              }
            } catch (error) {
              console.error('Error submitting FLRA:', error);
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          {isSubmitting
            ? flraId
              ? 'Updating...'
              : 'Submitting...'
            : flraId
              ? 'Update Assessment'
              : 'Submit Assessment'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Card ref={stepSectionRef} sx={{ p: { xs: 1, md: 2 }, mb: 2 }}>
        {isMobile ? (
          // Mobile: Vertical stepper with compact design
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
              Step {currentStepIndex + 1} of {formSections.length}
            </Typography>
            <Stepper
              activeStep={currentStepIndex}
              orientation="vertical"
              sx={{ '& .MuiStepLabel-label': { fontSize: '0.875rem' } }}
            >
              {formSections.map((label, index) => (
                <Step key={index}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                        fontWeight: index === currentStepIndex ? 600 : 400,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Stack>
        ) : (
          // Desktop: Horizontal stepper with alternative label
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {formSections.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </Card>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 5 } }}>
          <Stack spacing={3}>{step}</Stack>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            mt={{ xs: 3, md: 5 }}
          >
            {currentStepIndex !== 0 ? (
              <Button
                type="button"
                variant="contained"
                size={isMobile ? 'medium' : 'large'}
                sx={{ minWidth: { xs: '80px', md: '100px' } }}
                onClick={() => {
                  prev();
                  // Scroll to step section after a brief delay to allow step to update
                  setTimeout(() => {
                    scrollToStepSection();
                  }, 100);
                }}
              >
                {isMobile ? 'Back' : 'Previous'}
              </Button>
            ) : (
              <Stack />
            )}
            {!isMobile && (
              <Stack>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Page {`${currentStepIndex + 1} of ${steps.length}`}
                </Typography>
              </Stack>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <Button
                type="button"
                variant="contained"
                size={isMobile ? 'medium' : 'large'}
                sx={{ minWidth: { xs: '80px', md: '100px' } }}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Validate current step fields based on step index
                  let fieldsToValidate: string[] = [];

                  switch (currentStepIndex) {
                    case 0: // Assessment Details
                      fieldsToValidate = [
                        'full_name',
                        'date',
                        'site_foreman_name',
                        'contact_number',
                        'site_location',
                        'start_time',
                        'end_time',
                        'present.identified',
                        'present.reduce',
                        'present.experienced',
                        'present.complete',
                      ];
                      break;
                    case 1: // Risk Assessments
                      fieldsToValidate = [
                        'riskAssessment.visibility',
                        'riskAssessment.lineOfSight',
                        'riskAssessment.slipAndStrip',
                        'riskAssessment.holes',
                        'riskAssessment.weather',
                        'riskAssessment.dust',
                        'riskAssessment.fumes',
                        'riskAssessment.noise',
                        'riskAssessment.blindSpot',
                        'riskAssessment.overHeadLines',
                        'riskAssessment.workingAlone',
                        'riskAssessment.mobileEquipment',
                        'riskAssessment.trafficVolume',
                        'riskAssessment.conditions',
                        'riskAssessment.utilities',
                        'riskAssessment.fatigue',
                        'riskAssessment.controlMeasure',
                      ];
                      break;
                    case 2: // Traffic Control Plan
                    case 3: // FLRA Diagram
                      // No specific validation needed for these steps
                      break;
                    case 4: // Signature
                      fieldsToValidate = ['signature'];
                      break;
                    default:
                      break;
                  }

                  // Trigger validation for the current step
                  const isValid =
                    fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;

                  if (!isValid) {
                    // Find the first error field and scroll to it
                    setTimeout(() => {
                      // Try to find the first error element in the DOM
                      const firstErrorElement =
                        document.querySelector('[aria-invalid="true"]') ||
                        document.querySelector('.Mui-error') ||
                        document.querySelector('[role="alert"]');

                      if (firstErrorElement) {
                        // Scroll to the first error with some offset
                        firstErrorElement.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      } else {
                        // Fallback to scroll to step section
                        scrollToStepSection();
                      }
                    }, 100);
                    return;
                  }

                  next();
                  // Scroll to step section after a brief delay to allow step to update
                  setTimeout(() => {
                    scrollToStepSection();
                  }, 100);
                }}
              >
                {isMobile ? 'Next' : 'Next'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                color="success"
                size={isMobile ? 'medium' : 'large'}
                sx={{ minWidth: { xs: '120px', md: '140px' } }}
                onClick={async () => {
                  const values = getValues();

                  // Trigger validation for signature field
                  const isValid = await methods.trigger('signature');
                  if (!isValid) {
                    return; // Zod error will be displayed automatically
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
