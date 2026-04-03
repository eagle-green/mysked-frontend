import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Field } from 'src/components/hook-form/fields';
import { Iconify } from 'src/components/iconify/iconify';

type Props = {
  open: boolean;
  onClose(): void;
  onSave(): void;
  isPreview?: boolean;
};
export function CompanyRulesPolicies({ open, onClose, onSave, isPreview = false }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [acknowledge, SetAcknowledge] = useState<boolean>(false);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>Company Rules</DialogTitle>
      <DialogContent
        sx={{
          typography: 'body2',
          height: isMobile ? 'calc(100vh - 200px)' : 'auto',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          px: 3,
          gap: 2,
        }}
      >
        <Stack>
          <Typography variant="subtitle1">
            Eaglegreen employees are required to familiarize themselves with the Health and Safety
            rules and Company rules and procedures.
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 5,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'primary.lighter',
            color: 'primary.dark',
            borderRadius: 2,
          }}
        >
          <li>
            <Typography variant="body1">
              Employees working on the road must ensure PPE (personal protective equipment) is worn
              at all times. Failure to do so will result in a verbal written warning.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">PPE consists of :</Typography>
            <Box sx={{ px: 2 }}>
              <ul>
                <li>
                  <Typography>Hard Hat (Orange/Yellow)</Typography>
                </li>
                <li>
                  <Typography>Ankle Bands</Typography>
                </li>
                <li>
                  <Typography>Wrist Bands</Typography>
                </li>
                <li>
                  <Typography>Vest</Typography>
                </li>
                <li>
                  <Typography>Paddle</Typography>
                </li>
                <li>
                  <Typography>Safety Steel Boots</Typography>
                </li>
              </ul>
            </Box>
          </li>
          <li>
            <Typography variant="body1">
              Bullying and Harassment are strongly prohibited at Eaglegreen.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Employees are not permitted to use any electronic devices or headsets while working on
              the road. In cases of emergency, speak to LCT & Foremen and step aside, where you or
              others are not in danger.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              LCTs are responsible for the tidiness of their trucks.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Any unauthorized driving and fuel charges are subject to verbal warnings and
              deductions.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              LCTs are to understand other Eaglegreen employees may use their company trucks for
              breaks or a place to store personal belongings in times where needed. Working on the
              road has its challenges and working together, and ensuring each other`s wellbeing is
              important.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              LCTs need to ensure all set-ups are as per MOT Manual set-ups as it`s a government
              requirement.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Employees are responsible for reporting all incidents or near-miss incidents to the
              office and supervisors.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Keep their work areas clean and tidy, free of hazards that could cause slips, trips,
              or falls.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Co-operate fully with any investigations regarding Health & Safety carried out by EG
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Immediately address all identified or potential hazards. Where this is not possible,
              they must report the situation to their field supervisor or dispatch.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Right to refuse work - stop any work activity where an unsafe working condition is
              identified and ensure that this is corrected before work is allowed to restart. Any
              such action shall be reported to the office and supervisors.
            </Typography>
          </li>
        </Box>

        {!isPreview && (
          <Box
            sx={{
              bgcolor: 'divider',
              p: 1,
              borderRadius: 1,
              width: '100%',
              mt: 2,
            }}
          >
            <Field.Checkbox
              name="COMPANY_RULES"
              label="I have reviewed, understood, and agree to comply with all company policies and procedures as applicable."
              slotProps={{
                checkbox: {
                  onChange: async (e, checked) => {
                    SetAcknowledge(checked);
                  },
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={() => onClose()}>
          Close
        </Button>
        {!isPreview && (
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onSave();
              onClose();
            }}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            disabled={!acknowledge}
          >
            Accept Agreement
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
