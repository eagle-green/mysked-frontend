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
export function CompanyHumanResourcePolicy({ open, onClose, onSave }: Props) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [acknowledge, SetAcknowledge] = useState<boolean>(false);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose} fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 2 }}>Company Human Resource Policies (EG-PO-HR-703)</DialogTitle>
      <DialogContent
        sx={{
          typography: 'body2',
          height: isMobile ? 'calc(100vh - 200px)' : '80vh',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          px: 3,
          gap: 2,
        }}
      >
        <Stack>
          <Typography variant="subtitle2">
            Eagle Green LLP (EG) is committed to the health and safety of its employees. EG accepts
            the responsibility to provide its employees with a healthy, safe, and productive
            workplace. The use of illegal drugs, improper use of prescription medication, and the
            use of alcohol can have serious consequences leading to work place injuries or other
            incidents. Recognizing the potential negative effects of alcohol and drug use within the
            organization, in particular, the hazards that individuals who use/abuse drugs or alcohol
            pose themselves, their coworkers, and the general public, EG has developed a
            comprehensive drug and alcohol policy. EG requires that all employees be aware of this
            policy and cooperate and support the workplace in remaining free of any hazards that may
            be associated with the use/misuse of drugs and alcohol in the workplace.
          </Typography>
        </Stack>
        <Stack>
          <Typography variant="subtitle1">Purpose</Typography>
          <Typography variant="subtitle2">
            The purpose of this policy is to establish EG`s expectations for appropriate
            behavior,the consequences for non-compliance and to provide consistent guidelines for
            allemployees in the treatment of situations arising from the use/ abuse of drugs or
            alcohol.
          </Typography>
        </Stack>
        <Stack>
          <Typography variant="subtitle1">Policy</Typography>
          <Typography variant="subtitle2">
            This policy provides for the testing of prospective employees for drug and/or alcohol
            abuse, assisting all employees who voluntarily seek help for problems relating to drugs
            and/or alcohol, and educating em ployees on the dangers of drug and alcohol abuse. This
            policy also provides guidance for managers of employees with drug and/or alcohol
            dependency issues, drawing on applicable OHS legislation. For the purposes of this
            policy, the following are prohibited:
          </Typography>

          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">
                The presence in the body of illicit drugs (or their metabolites) while at work.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                The use, possession, consumption, delivery, distribution, exchange, manufacturing,
                purchasing, sale or transfer of any illegal drugs, narcotics, or other unauthorized
                substances on APM`s sites while conducting company business.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                The unauthorized use, possession, consumption, delivery, distribution, exchange,
                manufacturing, purchasing, sale or transfer of alcohol while on Company Name`s sites
                or while conducting company business.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Misuse, excessive use, or recreational use of over-the-counter (OTC) medication or
                prescription drugs while on APM`s sites or while conducting company business.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Engaging in controlled activities while under the influence of unauthorized
                substances.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                Refusing to submit to drug/alcohol testing, failure to report to a
                company-designated facility for a drug/alcohol test, or tampering or attempting to
                tamper with a test sample.
              </Typography>
            </li>
          </Stack>
        </Stack>
        <Stack>
          <Typography variant="subtitle1">Treatment and Accommodation for Addiction</Typography>
          <Typography variant="subtitle2">
            Any employee suffering from a drug or alcohol addiction is strongly encouraged to
            disclose the addiction to their supervisor. EG understands its responsibility to assist
            and accommodate employees suffering from an illness/addiction due to drugs and/or
            alcohol to the extent reasonably possible without suffering undue hardship.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            Further, employees who are concerned that a fellow employee may be suffering from a drug
            and/or alcohol addiction are strongly encouraged to report their concerns to their
            supervisor.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            EG has partnered to offer support and program options to an addicted employee. Further,
            for all of its employees, the company provides confidential access to addiction/abuse
            counselling services to encourage well-being and ongoing support for employees through
            our service provider.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Drugs and Alcohol</Typography>
          <Typography variant="subtitle2">
            While on EG`s premises and/or while conducting company-related activities off-site, no
            employee may use, possess, distribute, sell, or be under the influence of illegal drugs.
            This includes meal periods and sched uled breaks.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            The normal use of OTC medications and the legal use of prescription drugs is not
            prohibited by EG provided that these aids were obtained lawfully and are not consumed at
            a frequency or quantity greater than the prescribed dosage. The legal use of prescribed
            drugs is permitted at work only if it does not impair the employee`s ability to perform
            their work effectively and in a safe manner. Employees are required to disclose the use
            of prescription drugs which may affect their work performance or the safe execution of
            their duties. EG is committed to accommodating an employee`s necessary use of
            prescription drugs to the extent reasonably possible without suffering undue hardship.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            If an employee is called back after regular working hours to perform work-related duties
            and has been consuming alcohol or using drugs, it is the employee`s responsibility to:
            Under no circumstances operate a motor vehicle while under the influence of drugs and/or
            alcohol. Notify an authorized person(e.g. manager on duty) of the circumstances
            immediately. Receive assistance from the authorized person to be relieved of the
            employee`s duties and to be safely transported home or to a medical facility at the
            discretion of the authorized person.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Testing</Typography>
          <Typography variant="subtitle2">
            Testing is conducted to confirm the presence of:
          </Typography>

          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">Alcohol</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Amphetamines/Methamphetamines</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Cocaine</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Marijuana (THC)</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Opiates</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Phencyclidine (PCP)</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Ecstacy</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">Heroin</Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Post Indicent Testing</Typography>
          <Typography variant="subtitle2">
            An employee involved in an incident/injury or a near miss may be required by the company
            to undergo post-incident testing for drugs and/or alcohol.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Post Indicent Testing</Typography>
          <Typography variant="subtitle2">
            An employee involved in an incident/injury or a near miss may be required by the company
            to undergo post-incident testing for drugs and/or alcohol.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Pre-Employment Testing</Typography>
          <Typography variant="subtitle2">
            EG may choose to conduct pre-employment drug and alcohol testing prior to an offer of
            employment being extended. In this instance, an offer of employment is conditional on a
            negative test result.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Testing When Required By The Customer</Typography>
          <Typography variant="subtitle2">
            When a Customer requires EG employees to be tested for drugs and alcohol, EG will abide
            by these require ments. Employees however can voluntarily choose to be tested or not
            tested. If the employee chooses to not test, he will be unable to work on that Customer
            project and will be reassigned.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Reasonable Cause For Testing</Typography>
          <Typography variant="subtitle2">
            EG reserves the right to conduct testing for the presence of drugs and/or alcohol when a
            supervisor has reasonable cause to believe that the actions, appearance, or conduct of
            an employee while on duty is indicative of the use of drugs and/or alcohol.
          </Typography>
          <Typography variant="subtitle2">
            The basis for the decision to test will be made with the employees direct supervisor,
            and any two of the following: General Foreman, Superintendent, any member of the Senior
            Leadership Team, and Human Re sources.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">
            If an employee is assessed as not addicted, he will be offered the opportunity to return
            to work under a Return to Work Agreement.
          </Typography>
          <Typography variant="subtitle2">
            If the employee refuses the assessment or refuses to sign a Return to Work Agreement, he
            will then be subject to discipline under the terms of this policy.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Discipline</Typography>
          <Typography variant="subtitle2">
            Discipline Relating to Drugs and Alcohol Seeking voluntary assistance for drug and/or
            alcohol addiction will not jeopardize an employees employ ment, so long as the employee
            continues to cooperate and seek appropriate treatment. With treatment and control, the
            employee is encouraged to work with EG in facilitating a return to work within a
            reasonably foreseeable future. Employees who fail to cooperate with assistance, testing,
            assessment or treatment and/or engage in repeated infractions of this policy will be
            subject to the normal disciplinary measures including indefinite suspension up to and
            including termination.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Scope</Typography>
          <Typography variant="subtitle2">
            This policy applies to all employees. Grievance procedures for Union employees are
            governed by the terms of the applicable Collective agreement.
          </Typography>
        </Stack>
        <Stack>
          <Typography variant="subtitle1">Responsibility</Typography>
          <Typography variant="subtitle2">
            Employees have the responsibility to report to work capable of performing their work in
            a productive and safe manner. Employees also have the responsibility to report any
            unsafe situations related to (or unrelated to) the suspected use or impairment of drugs
            or alcohol by another employee.
          </Typography>
          <Typography variant="subtitle2">
            Managers are responsible for investigating and responding in a timely manner regarding
            issues or con cerns raised.
          </Typography>
        </Stack>

        <Stack>
          <Typography variant="subtitle2">Definitions</Typography>
          <Typography variant="subtitle2">
            Under the influence of drugs including prescription drugs, alcohol or any controlled
            substance for the purpose of this policy is defined as the use of one or more of these
            substances to an extent that the employee is:
          </Typography>
          <Stack
            sx={{
              px: 4,
              py: 1,
            }}
          >
            <li>
              <Typography variant="subtitle2">Unable to work in a productive manner.</Typography>
            </li>
            <li>
              <Typography variant="subtitle2">
                In a physical or mental condition that creates a risk to the safety and well-being
                of the individual, other employees, property of Company Name, or any member of the
                public
              </Typography>
            </li>
          </Stack>
        </Stack>

        <Stack>
          <Typography variant="subtitle1">Reference</Typography>
          <Typography variant="subtitle2">EG Collective Agreement</Typography>
          <Typography variant="subtitle2">EG Safety Policies</Typography>
          <Typography variant="subtitle2">Provincial Workers Compensation Legislation</Typography>
          <Typography variant="subtitle2">EG-Drugs and Alcohol Manager Guidelines</Typography>
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
            name="HR_703"
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
