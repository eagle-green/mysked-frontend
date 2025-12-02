import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Form, Field } from 'src/components/hook-form';

//---------------------------------------------------------------------------------

const INCIDENT_SEVERITY = [
  { label: 'Minor', caption: '(No injuries, no major disruptions)', value: 'minor' },
  {
    label: 'Moderate',
    caption: '(Injuries reported, traffic flow disrupted temporarily)',
    value: 'moderate',
  },
  {
    label: 'Severe',
    caption: '(Serious injuries or fatalities, major traffic disruption)',
    value: 'severe',
  },
];

const INCIDENT_REPORT_TYPE = [
  { label: 'Traffic Accident', value: 'traffic accident' },
  { label: 'Equipment Malfunction', value: 'equipment malfunction' },
  { label: 'Safety Violation', value: 'safety violation' },
  { label: 'Unauthorized Access', value: 'unauthorized access' },
  { label: 'Construction Site Disruption', value: 'construction site disruption' },
  { label: 'Weather/Environmental Incident', value: 'wetaher incident' },
  { label: 'Personnel Injury/Accident', value: 'personnel accident' },
  { label: 'Traffic Signal Failure', value: 'traffic signal failure' },
  { label: 'Road Blockage/Obstruction', value: 'road obstruction' },
  { label: 'Work Zone Inadequacy', value: 'work zone inadequacy' },
  { label: 'Public Interaction or Dispute', value: 'public interaction' },
  { label: 'Other', value: 'others' },
];

type Props = {
  data?: {
    id: number;
    jobNumber: string;
    incidentType: string;
    incidentDate: Date;
    reportDescription: string;
    reportDate: Date;
    reportedBy: string;
    incidentSeverity: string;
  };
  open: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
};

export function IncidentReportForm({ data, open, onClose, onUpdateSuccess }: Props) {
  const methods = useForm<any>({
    mode: 'all',
    defaultValues: data || {
      id: 1,
      jobNumber: '25-10232',
      incidentType: 'traffic accident',
      incidentDate: new Date(),
      reportDescription: 'Sample report description',
      reportDate: new Date(),
      reportedBy: 'Jerwin Fortillano',
      incidentSeverity: 'minor',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (values) => values);

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 670 },
        },
      }}
    >
      <DialogTitle>Incident Report</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              py: 2,
            }}
          >
            <Field.DatePicker
              name="reportDate"
              label="Report Date"
              disabled
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: false,
                  disabled: true,
                },
              }}
            />

            <Field.Select name="incidentType" label="Incident Report Type *">
              {INCIDENT_REPORT_TYPE.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select name="incidentSeverity" label="Incident Severity *">
              {INCIDENT_SEVERITY.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                  <Typography variant="caption" color="text.disabled" sx={{ pl: 1 }}>
                    {option.caption}
                  </Typography>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.DatePicker
              name="incidentDate"
              label="Incident Date"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Report Description"
              name="reportDescription"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
