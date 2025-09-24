import type { FieldLevelRiskAssessmentType } from 'src/pages/template/field-level-risk-assessment';

import { Buffer } from 'buffer';
import { PDFViewer } from '@react-pdf/renderer';
import { useFormContext } from 'react-hook-form';

// Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useMediaQuery } from '@mui/material';
import Typography from '@mui/material/Typography';

import FieldLevelRiskAssessmentPdf from 'src/pages/template/field-level-risk-assessment';

import { Iconify } from 'src/components/iconify/iconify';

//---------------------------------------------------------------
export function SignatureConfirmation() {
  const { watch, getValues } = useFormContext<FieldLevelRiskAssessmentType>();
  const isMobile = useMediaQuery('(max-width:768px)');
  
  const signature = watch('signature');
  const fullName = watch('full_name');

  // Get all form data for PDF preview
  const formData = getValues();

  // Transform data for PDF preview (same as in main form)
  const transformedData = {
    ...formData,
    scopeOfWork: {
      roadType: Array.isArray(formData.scopeOfWork?.roadType) 
        ? {
            single_lane_alternating: false,
            lane_closure: false,
            road_closed: false,
            shoulder_work: false,
            turn_lane_closure: false,
            showing_traffic: false,
            other: false,
          }
        : (formData.scopeOfWork?.roadType || {
            single_lane_alternating: false,
            lane_closure: false,
            road_closed: false,
            shoulder_work: false,
            turn_lane_closure: false,
            showing_traffic: false,
            other: false,
          }),
      contractToolBox: formData.scopeOfWork?.contractToolBox || '',
      otherDescription: formData.scopeOfWork?.otherDescription || '',
    },
    descriptionOfWork: {
      road: formData.descriptionOfWork?.road || '',
      distance: formData.descriptionOfWork?.distance || '',
      weather: formData.descriptionOfWork?.weather || '',
      roadOther: formData.descriptionOfWork?.roadOther || '',
      distanceOther: formData.descriptionOfWork?.distanceOther || '',
    },
    present: {
      identified: formData.present?.identified || '',
      reduce: formData.present?.reduce || '',
      experienced: formData.present?.experienced || '',
      complete: formData.present?.complete || '',
    },
    supervisionLevels: {
      communicationMode: formData.supervisionLevels?.communicationMode || false,
      pictureSubmission: formData.supervisionLevels?.pictureSubmission || false,
      supervisorPresence: formData.supervisionLevels?.supervisorPresence || false,
    },
    riskAssessment: {
      ...formData.riskAssessment,
      otherDescription: formData.riskAssessment?.otherDescription || '',
    },
    authorizations: formData.authorizations || [],
    updates: formData.updates || [],
    responsibilities: formData.responsibilities || [],
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4">Signature Confirmation</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please review your signature and the statement below. This is how it will appear on the first page of your FLRA document.
        </Typography>
      </Box>

      {/* PDF Preview - First Page Only */}
      <Card sx={{ p: 0, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            height: isMobile ? '60vh' : '80vh', 
            width: '100%',
          }}
        >
          <PDFViewer 
            width="100%" 
            height="100%"
            showToolbar={!isMobile}
          >
            <FieldLevelRiskAssessmentPdf assessment={transformedData} />
          </PDFViewer>
        </Box>
      </Card>

      {/* Signature Statement Highlight */}
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" color="primary">
            Signature Statement
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1, border: 1, borderColor: 'primary.main' }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
              &ldquo;I hereby certify that this hazard assessment is mandatory as per company policy and Worksafe BC
              and all information on this form is accurate to the best of my knowledge.&rdquo;
            </Typography>
          </Box>

          {/* Signature Display */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Your Signature:
            </Typography>
            
            {signature ? (
              <Box
                sx={{
                  border: 2,
                  borderColor: 'success.main',
                  borderRadius: 1,
                  p: 2,
                  minHeight: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'success.lighter',
                }}
              >
                <Box
                  component="img"
                  src={signature}
                  alt="Signature"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 80,
                    objectFit: 'contain',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  border: 2,
                  borderColor: 'error.main',
                  borderStyle: 'dashed',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                  color: 'error.main',
                  minHeight: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2">
                  No signature provided
                </Typography>
              </Box>
            )}

            {/* Name Display */}
            {fullName && (
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Signed by: <strong>{fullName}</strong>
                </Typography>
              </Box>
            )}
          </Box>

          {/* Confirmation Message */}
          <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:check-circle-bold" color="success.main" />
              <Typography variant="body2" color="success.darker">
                Your signature has been captured and will be included in the FLRA document. 
                You can now proceed to submit your assessment.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
