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
};
export function CompanyFleetPolicyNCS003U({ open, onClose, onSave }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [acknowledge, SetAcknowledge] = useState<boolean>(false);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>
        Company Fleet Policies - Use of Company Vehicles (EG-PO-FL-NCS-003U)
      </DialogTitle>
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
          <Typography variant="subtitle1">Purpose</Typography>
          <Typography variant="subtitle2">
            The purpose of this policy is to ensure all employees understand the acceptable use of
            Company Vehicles. This policy is for union employees at the Foreman level and below.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Policy</Typography>
          <Typography variant="subtitle2">
            The assignment and use of a Company Vehicle is a privilege and it is EG`s policy to
            insist that employees operate in a safe and economical manner while using Company
            Vehicles.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">General Principles:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Employees must hold a valid driver`s License to operate a company Vehicle.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Employees are responsible for the cleanliness of the interior and exterior of the
                vehicle. Company Vehicles must be clean and presentable at all times without garbage
                and excess clutter and are subject to random inspections.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                No after-market accessories are to be added to the vehicle without written consent
                from APM`s Fleet Manager.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Idling:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                All employees operating EG vehicles will make every effort to avoid idling while
                performing their daily work duties.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Excessive idling adversely affects our environment and directly contributes to
                increased operating costs which include increased fuel costs as well as wear and
                tear on EG vehicles and equipment.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                In certain operating areas and jurisdictions, idling of company vehicles is required
                to a greater extent than in other areas. Notwithstanding the inherent necessity to
                idle vehicles for longer periods in these areas, it is incumbent on EG employees to
                minimize the amount of idling that occurs.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Traffic Laws and Speeding:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Employees will obey posted speed limits, up to and including 110 KM per hour. No
                vehicle will exceed 110 KM per hour under any circumstance. GPS devices will be used
                to enforce this policy.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Employees must conform to all traffic laws, signals or markings. Any traffic or
                parking fines incurred while operating an EG vehicle are the responsibility of the
                employee.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Business Usage:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Company Vehicles are used to carry out EG Business only, and to and from work with
                pre-approval. Vehicles are not used for personal business.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Exceptions to this are management personnel, Superintendents, Area Managers and
                General Managers, as a perquisite of the position.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Cell Phone Usage While Driving:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                If a call is necessary, the employee must pull over to a safe location for the
                duration of the call.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                If a call is necessary while driving, the use of a hands-free device is mandatory
                for any use of phones in a vehicle. Only hands-free cell phones that are
                voice-activated, or activated by one touch, provided they are securely attached to
                the vehicle or the driver`s body (such as an earpiece)are allowed to be used while
                driving.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Business Usage:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Company Vehicles are used to carry out EG Business only, and to and from work with
                pre-approval. Vehicles are not used for personal business.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Exceptions to this are management personnel, Superintendents, Area Managers and
                General Managers, as a perquisite of the position.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                To keep distracted driving to a minimum, these conversations are kept to a minimum.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Texting or Emailing While Driving:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Texting and emailing are prohibited while driving, this includes while stopped at a
                red light.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                If texting or emailing is necessary, the employee must pull over to a safe location.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Safety:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Vehicles are not to be operated after the consumption of alcohol or drugs that cause
                impairment.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Possession or use of any kind of substances causing impairment, narcotics, alcohol
                or any other likewise substance within the vehicle is strictly prohibited.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Employees must operate Company Vehicles in a safe, courteous, and professional
                manner in the eye of the general public.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Maintenance:</Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                Employees are responsible for ensuring the vehicle is in safe mechanical condition
                and all maintenance require ments are reported immediately.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Employees are responsible for pre-trip and post-trip inspections.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Employees must report all damages to Company Vehicles immediately.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Employees are responsible for reading the Owner`s Manual and understanding basic
                maintenance requirements, safety equipment, and operation of Towing Modes where
                required.
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Violation of this Policy:</Typography>
          <Typography variant="subtitle2">
            This is a reminder that the Provinces of British Columbia, Alberta, Saskatchewan and
            Manitoba have newer hands-free legislation in effect. It is against the law to drive
            while holding a cell phone or other electronic device.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Any violation of the law will net drivers fines and points. Each employee shall be
            personally responsible for the payment of fines. Should an employee be restricted from
            driving an EG vehicle because of driver points, that employee will be subject to
            escalating discipline, including a change of position or termination of employment.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Employees who violate any section of this policy will, and if found to be negligent,
            face disciplinary measures up to termination, and face legal responsibility if, in the
            course and scope of their duties, they are involved in a car accident as a result of
            violating this policy.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Scope</Typography>
          <Typography variant="subtitle2">
            This policy applies to all employees who operate company-owned vehicles/equipment and
            those who are operating personal vehicles on behalf of EG or while on EG time.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Responsibility</Typography>
          <Typography variant="subtitle2">
            Employees - it is the employees responsibility to use Company Vehicles in the manner for
            which they were intended.
          </Typography>
          <Typography variant="subtitle2">
            Managers - it is the Manager`s responsibility to oversee the proper and consistent use
            of Company Vehicles.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Reference</Typography>
          <Typography variant="subtitle2">EG - GPS Policy</Typography>
          <Typography variant="subtitle2">EG - Drug and Alcohol Policy</Typography>
          <Typography variant="subtitle2">EG -Safety Policy</Typography>
        </Stack>

        <Box
          sx={{
            bgcolor: 'divider',
            p: 1,
            borderRadius: 1,
            width: '100%',
          }}
        >
          <Field.Checkbox
            name="NCS_003U"
            label="By signing this policy, I confirm that I have read, understood and agree to abide by the information contained within."
            slotProps={{
              checkbox: {
                onChange: async (e, checked) => {
                  SetAcknowledge(checked);
                },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={() => onClose()}>
          Close
        </Button>
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
      </DialogActions>
    </Dialog>
  );
}
