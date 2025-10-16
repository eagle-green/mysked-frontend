import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import dayjs from 'dayjs';
import { Buffer } from 'buffer';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useQuery } from '@tanstack/react-query';
import { Page, pdfjs, Document } from 'react-pdf';
import React, { useState, useCallback } from 'react';
import { pdf, PDFViewer } from '@react-pdf/renderer';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Set up PDF.js worker - use unpkg instead of cdnjs for better reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function FlraPdfView() {
  const params = useParams();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width:768px)');
  const flraId = params.id as string;
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Mobile PDF navigation states
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageKey, setPageKey] = useState(0);

  // Fetch FLRA form details
  const {
    data: flraData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['flra-pdf', flraId],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.flra.detail.replace(':id', flraId)}`);
      return response.data.flra_form;
    },
    enabled: !!flraId,
  });

  const handleBack = () => {
    router.push(paths.schedule.work.flra.list);
  };

  const handleEdit = () => {
    // Navigate to FLRA edit form with the current FLRA ID
    router.push(paths.schedule.work.flra.edit(flraId));
  };

  // Mobile PDF navigation functions
  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
    setPageKey((prev) => prev + 1);
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
    setPageKey((prev) => prev + 1);
  };

  // Cleanup blob URL on unmount
  React.useEffect(
    () => () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    },
    [pdfBlobUrl]
  );

  // Transform FLRA data to match PDF template structure
  const transformFlraData = useCallback((data: any) => {
    if (!data) {
      console.error('FlraPdfView - No data provided to transformFlraData');
      return null;
    }

    // Parse JSON strings
    let assessmentDetails: any = {};
    let riskAssessments: any = {};
    let trafficControlPlan: any = {};

    try {
      assessmentDetails = data.assessment_details ? JSON.parse(data.assessment_details) : {};
    } catch (parseError) {
      console.error('FlraPdfView - Error parsing assessment_details:', parseError);
    }

    try {
      riskAssessments = data.risk_assessments ? JSON.parse(data.risk_assessments) : {};
    } catch (parseError) {
      console.error('FlraPdfView - Error parsing risk_assessments:', parseError);
    }

    try {
      trafficControlPlan = data.traffic_control_plan ? JSON.parse(data.traffic_control_plan) : {};
    } catch (parseError) {
      console.error('FlraPdfView - Error parsing traffic_control_plan:', parseError);
    }

    return {
      // Basic info - get from assessment_details JSON first, then fallback to main data
      full_name:
        assessmentDetails.full_name ||
        `${data.created_by?.first_name || ''} ${data.created_by?.last_name || ''}`.trim() ||
        'Unknown',
      date: assessmentDetails.date || dayjs(data.created_at).tz('America/Los_Angeles').format('MMM D, YYYY'),
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
          single_lane_alternating:
            trafficControlPlan.scopeOfWork?.roadType?.single_lane_alternating || false,
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

      // Supervision levels - map from supervisionLevel to supervisionLevels
      supervisionLevels: (() => {
        const supervisionLevel = data.supervisionLevel || data.supervision_level;

        return {
          communicationMode:
            supervisionLevel === 'low' ||
            trafficControlPlan.supervisionLevels?.communicationMode ||
            false,
          pictureSubmission:
            supervisionLevel === 'medium' ||
            trafficControlPlan.supervisionLevels?.pictureSubmission ||
            false,
          supervisorPresence:
            supervisionLevel === 'high' ||
            trafficControlPlan.supervisionLevels?.supervisorPresence ||
            false,
        };
      })(),

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
        console.error('FlraPdfView - No transformed data available');
        return;
      }

      const blob = await pdf(<FieldLevelRiskAssessmentPdf assessment={transformedData} />).toBlob();
      setPdfBlob(blob);

      // Create blob URL for mobile navigation
      if (isMobile) {
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      }
    } catch (blobError) {
      console.error('Error generating PDF blob:', blobError);
    }
  }, [flraData, transformFlraData, isMobile]);

  // Generate PDF when data is loaded
  React.useEffect(() => {
    if (flraData) {
      generatePdfBlob();
    }
  }, [flraData, generatePdfBlob]);

  if (isLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
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
          { name: 'Schedule', href: paths.schedule.root },
          { name: 'FLRA', href: paths.schedule.work.flra.list },
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
            {/* Show Edit button always for now - we'll fix status check later */}
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              color="warning"
            >
              Edit
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
          isMobile ? (
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
                      key={pdfBlobUrl}
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
                        key={`page-${pageNumber}-${pageKey}`}
                        pageNumber={pageNumber}
                        width={window.innerWidth - 40}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadError={(loadError) =>
                          console.error(`Page ${pageNumber} load error:`, loadError)
                        }
                      />
                    </Document>
                  </Box>
                  {/* Mobile navigation controls */}
                  {numPages && numPages > 1 && (
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
                        disabled={pageNumber >= numPages}
                        onClick={goToNextPage}
                        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                      >
                        Next
                      </Button>
                    </Box>
                  )}
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
                  <CircularProgress />
                </Box>
              )}
            </Box>
          ) : (
            // Desktop: Use PDFViewer
            <PDFViewer width="100%" height="100%" showToolbar>
              <FieldLevelRiskAssessmentPdf
                assessment={transformFlraData(flraData) || ({} as any)}
              />
            </PDFViewer>
          )
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
