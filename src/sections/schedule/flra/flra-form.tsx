import dayjs from 'dayjs';
import { pdf } from '@react-pdf/renderer';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import SignatureCanvas from 'react-signature-canvas';
import { useCallback, useRef, useState } from 'react';

import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useMultiStepForm } from 'src/hooks/use-multistep-form';

import FieldLevelRiskAssessmentPdf, {
  FieldLevelRiskAssessmentType,
} from 'src/pages/template/field-level-risk-assessment';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { RiskAssessmentForm } from './risk-assessment-form';
import { AssessmentDetailForm } from './assessment-detail-form';
import { TrafficControlPlanForm } from './traffic-control-plan-form';

export function FieldLevelRiskAssessment() {
  const { user } = useAuthContext();
  const currentDate = dayjs().format('YYYY-MM-DD');
  const formSections = ['Assessment Details', 'Risk Assessments', 'Traffic Control Plan'];
  const { currentStepIndex, steps, step, prev, next } = useMultiStepForm([
    <AssessmentDetailForm />,
    <RiskAssessmentForm />,
    <TrafficControlPlanForm />,
  ]);

  const methods = useForm<FieldLevelRiskAssessmentType>({
    mode: 'all',
    // resolver: zodResolver(),
    defaultValues: {
      full_name: user?.displayName ?? null,
      date: currentDate,
      site_foreman_name: '',
      contact_number: '',
      site_location: '',
      start_time: dayjs(currentDate).toISOString(),
      end_time: dayjs(currentDate).add(1).toISOString(),
      first_aid_on_site: '',
      first_aid_kit: '',
      descriptionOfWork: {
        road: '',
        distance: '',
        weather: '',
      },
      scopeOfWork: {
        roadType: [],
        contractToolBox: '',
      },
      present: {
        identified: '',
        reduce: '',
        new: '',
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
      },
      trafficControlPlans: [
        {
          hazard_risk_assessment: '',
          control_measure: '',
        },
      ],
      updates: [
        {
          date_time_updates: currentDate,
          changes: '',
          additional_control: '',
          initial: '',
        },
      ],
      responsibilities: [
        {
          role: '',
          serialNumber: '',
          responsibility: '',
          initial: '',
        },
      ],
      authorizations: [
        {
          fullName: '',
          company: '',
          date_time: currentDate,
        },
      ],
      supervisionLevels: {
        communicationMode: false,
        pictureSubmission: false,
        supervisorPresence: false,
      },
      signature: null,
    },
  });

  const [signature, setSignature] = useState<string | null>(null);
  const submitDialog = useBoolean();
  const theme = useTheme();
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const isXsSmMd = useMediaQuery(theme.breakpoints.down('md'));

  const {
    watch,
    setValue,
    getValues,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async () => {
    const values = getValues();
    try {
      await handleExportPDF(values);
    } catch (error) {
      console.error('ERROR: ', { error });
    }
  };

  const resetSignatures = useCallback(() => {
    // setSignatureType('');
    setSignature(null);
    setValue('signature', null);
  }, []);

  const handleExportPDF = async (data: FieldLevelRiskAssessmentType) => {
    console.log(data);
    try {
      const blob = await pdf(<FieldLevelRiskAssessmentPdf data={data} />).toBlob();
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
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      throw new Error('Failed to generate PDF');
    }
  };

  const renderSubmitDialog = () => (
    <Dialog fullWidth maxWidth="md" open={submitDialog.value} onClose={submitDialog.onFalse}>
      <DialogTitle sx={{ pb: 2 }}> Signature </DialogTitle>
      <DialogContent sx={{ typography: 'body2' }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {!signature
            ? 'Please add signature before submission of assessment.'
            : 'Signature added. You can submit the assessment now.'}
        </Typography>
        <Paper elevation={3}>
          {!signature ? (
            <SignatureCanvas
              penColor={theme.palette.text.secondary}
              minWidth={2}
              maxWidth={3}
              throttle={16}
              velocityFilterWeight={0.7}
              canvasProps={{
                width: isXsSmMd ? 300 : 850,
                height: 200,
                style: {
                  width: '100%',
                  height: 200,
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  borderColor: `${theme.palette.text.secondary}`,
                },
              }}
              ref={sigCanvas}
            />
          ) : (
            <img
              src={`${signature}`}
              alt="Signature"
              style={{ maxWidth: '100%', borderRadius: '6px' }}
            />
          )}
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            submitDialog.onFalse();
            resetSignatures();
          }}
        >
          Cancel
        </Button>
        {!signature && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              sigCanvas.current?.clear();
            }}
          >
            Clear
          </Button>
        )}
        {!signature ? (
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              const sign = sigCanvas.current?.isEmpty()
                ? null
                : (sigCanvas.current?.getCanvas().toDataURL('image/png') as string);
              setSignature(sign);
              setValue('signature', sign);
            }}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            sx={{
              fontSize: { xs: 13, md: 14 },
            }}
          >
            Add Signature
          </Button>
        ) : (
          <Button
            type="submit"
            variant="contained"
            color="success"
            onClick={onSubmit}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            sx={{
              fontSize: { xs: 13, md: 14 },
            }}
          >
            Submit Assessment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={currentStepIndex} alternativeLabel>
          {formSections.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>
      <Form methods={methods}>
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
              <Button type="button" variant="contained" onClick={prev}>
                Prev
              </Button>
            ) : (
              <Stack />
            )}
            <Stack>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Page {`${currentStepIndex + 1} out of  ${steps.length}`}
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
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                color="success"
                onClick={() => submitDialog.onTrue()}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
              >
                Submit
              </Button>
            )}
          </Stack>
        </Card>
        {renderSubmitDialog()}
        {/* {renderOperatorSignatureDialog()} */}
      </Form>
    </>
  );
}
