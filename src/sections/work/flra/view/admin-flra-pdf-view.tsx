import { Buffer } from 'buffer';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';
import { pdf, PDFViewer } from '@react-pdf/renderer';

// Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { useMediaQuery } from '@mui/material';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import FieldLevelRiskAssessmentPdf from 'src/pages/template/field-level-risk-assessment';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function AdminFlraPdfView() {
  const params = useParams();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width:768px)');
  const flraId = params.id as string;
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch FLRA form details
  const {
    data: flraData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['flra-form', flraId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.flra.detail.replace(':id', flraId)}`);
      return response.data.flra_form;
    },
    enabled: !!flraId,
  });

  const transformFlraData = useCallback((data: any) => {
    if (!data) {
      console.error('AdminFlraPdfView - No data provided to transformFlraData');
      return null;
    }

    // Parse JSON strings
    let assessmentDetails: any = {};
    let riskAssessments: any = {};
    let trafficControlPlan: any = {};

    try {
      assessmentDetails = data.assessment_details ? JSON.parse(data.assessment_details) : {};
    } catch (parseError) {
      console.error('AdminFlraPdfView - Error parsing assessment_details:', parseError);
    }

    try {
      riskAssessments = data.risk_assessments ? JSON.parse(data.risk_assessments) : {};
    } catch (parseError) {
      console.error('AdminFlraPdfView - Error parsing risk_assessments:', parseError);
    }

    try {
      trafficControlPlan = data.traffic_control_plan ? JSON.parse(data.traffic_control_plan) : {};
    } catch (parseError) {
      console.error('AdminFlraPdfView - Error parsing traffic_control_plan:', parseError);
    }

    return {
      // Basic info - get from assessment_details JSON first, then fallback to main data
      full_name:
        assessmentDetails.full_name ||
        `${data.created_by?.first_name || ''} ${data.created_by?.last_name || ''}`.trim() ||
        'Unknown',
      date: assessmentDetails.date || new Date(data.created_at).toLocaleDateString(),
      site_foreman_name:
        assessmentDetails.site_foreman_name ||
        `${data.timesheet_manager?.first_name || ''} ${data.timesheet_manager?.last_name || ''}`.trim() ||
        'Unknown',
      contact_number: assessmentDetails.contact_number || data.client?.contact_number || '',
      site_location: assessmentDetails.site_location || data.site?.display_address || '',
      company_contract: assessmentDetails.company_contract || data.company?.name || '',
      closest_hospital: assessmentDetails.closest_hospital || '',
      start_time:
        assessmentDetails.start_time ||
        (data.job?.start_time && data.job.start_time !== null && data.job.start_time !== ''
          ? data.job.start_time
          : ''),
      end_time:
        assessmentDetails.end_time ||
        (data.job?.end_time && data.job.end_time !== null && data.job.end_time !== ''
          ? data.job.end_time
          : ''),
      first_aid_on_site: assessmentDetails.first_aid_on_site || '',
      first_aid_kit: assessmentDetails.first_aid_kit || '',

      // Description of work
      descriptionOfWork: {
        road: trafficControlPlan.descriptionOfWork?.road || '',
        distance: trafficControlPlan.descriptionOfWork?.distance || '',
        weather: trafficControlPlan.descriptionOfWork?.weather || '',
        roadOther: trafficControlPlan.descriptionOfWork?.roadOther || '',
        distanceOther: trafficControlPlan.descriptionOfWork?.distanceOther || '',
      },

      // Scope of work
      scopeOfWork: {
        roadType: {
          single_lane_alternating: trafficControlPlan.scopeOfWork?.roadType?.single_lane_alternating || false,
          lane_closure: trafficControlPlan.scopeOfWork?.roadType?.lane_closure || false,
          road_closed: trafficControlPlan.scopeOfWork?.roadType?.road_closed || false,
          shoulder_work: trafficControlPlan.scopeOfWork?.roadType?.shoulder_work || false,
          turn_lane_closure: trafficControlPlan.scopeOfWork?.roadType?.turn_lane_closure || false,
          showing_traffic: trafficControlPlan.scopeOfWork?.roadType?.showing_traffic || false,
          other: trafficControlPlan.scopeOfWork?.roadType?.other || false,
        },
        otherDescription: trafficControlPlan.scopeOfWork?.otherDescription || '',
        contractToolBox: trafficControlPlan.scopeOfWork?.contractToolBox || '',
      },

      // Present section
      present: {
        identified: trafficControlPlan.present?.identified || '',
        reduce: trafficControlPlan.present?.reduce || '',
        experienced: trafficControlPlan.present?.experienced || '',
        complete: trafficControlPlan.present?.complete || '',
      },

      // Risk assessment
      riskAssessment: {
        visibility: riskAssessments.visibility || '',
        lineOfSight: riskAssessments.lineOfSight || '',
        slipAndStrip: riskAssessments.slipAndStrip || '',
        holes: riskAssessments.holes || '',
        weather: riskAssessments.weather || '',
        dust: riskAssessments.dust || '',
        fumes: riskAssessments.fumes || '',
        noise: riskAssessments.noise || '',
        blindSpot: riskAssessments.blindSpot || '',
        overHeadLines: riskAssessments.overHeadLines || '',
        workingAlone: riskAssessments.workingAlone || '',
        mobileEquipment: riskAssessments.mobileEquipment || '',
        trafficVolume: riskAssessments.trafficVolume || '',
        conditions: riskAssessments.conditions || '',
        utilities: riskAssessments.utilities || '',
        fatigue: riskAssessments.fatigue || '',
        controlMeasure: riskAssessments.controlMeasure || '',
        other: riskAssessments.other || '',
        otherDescription: riskAssessments.otherDescription || '',
      },

      // Traffic control plans
      trafficControlPlans: trafficControlPlan.trafficControlPlans || [],

      // Updates
      updates: trafficControlPlan.updates || [],

      // Responsibilities
      responsibilities: trafficControlPlan.responsibilities || [],

      // Authorizations
      authorizations: trafficControlPlan.authorizations || [],

      // Supervision levels
      supervisionLevels: {
        communicationMode: trafficControlPlan.supervisionLevels?.communicationMode || false,
        pictureSubmission: trafficControlPlan.supervisionLevels?.pictureSubmission || false,
        supervisorPresence: trafficControlPlan.supervisionLevels?.supervisorPresence || false,
      },

      // Signature and diagram
      signature: data.signature || null,
      flraDiagram: data.flra_diagram || null,
    };
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!flraData) {
      console.error('No FLRA data available for download');
      return;
    }

    if (isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);

      const transformedData = transformFlraData(flraData);
      if (!transformedData) {
        console.error('Failed to transform FLRA data');
        return;
      }

      const blob = await pdf(<FieldLevelRiskAssessmentPdf assessment={transformedData} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename in the format: #128 - Field Level Risk Assessment
      const jobNumber = flraData?.job?.job_number || 'Unknown';
      const filename = `#${jobNumber} - Field Level Risk Assessment.pdf`;

      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);

      link.click();

      // Cleanup after downloading the file
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [flraData, transformFlraData, isDownloading]);

  // Generate PDF blob when data is available
  const generatePdfBlob = useCallback(async () => {
    if (!flraData) return;

    try {
      const transformedData = transformFlraData(flraData);
      if (!transformedData) {
        console.error('AdminFlraPdfView - No transformed data available');
        return;
      }

      const blob = await pdf(<FieldLevelRiskAssessmentPdf assessment={transformedData} />).toBlob();
      setPdfBlob(blob);
    } catch (blobError) {
      console.error('Error generating PDF blob:', blobError);
    }
  }, [flraData, transformFlraData]);

  // Generate PDF when data is loaded
  React.useEffect(() => {
    if (flraData) {
      generatePdfBlob();
    }
  }, [flraData, generatePdfBlob]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !flraData) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
          <Typography variant="h6" color="error">
            Error loading FLRA data
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Back to FLRA List
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Field Level Risk Assessment Preview"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Work Management', href: paths.work.root },
          { name: 'FLRA', href: paths.work.flra.list },
          { name: `Job #${flraData.job?.job_number}`, href: '#' },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrowhead-left-fill" />}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </Box>
        }
        sx={{ mb: 3 }}
      />

      <Card
        sx={{
          height: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 200px)',
          // Add print-specific styles to ensure footer is visible
          '@media print': {
            height: '100vh',
            overflow: 'visible',
          },
        }}
      >
        {pdfBlob && flraData ? (
          <PDFViewer 
            width="100%" 
            height="100%"
            showToolbar={!isMobile}
          >
            <FieldLevelRiskAssessmentPdf assessment={transformFlraData(flraData) || ({} as any)} />
          </PDFViewer>
        ) : (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <CircularProgress />
          </Box>
        )}
      </Card>
    </DashboardContent>
  );
}
