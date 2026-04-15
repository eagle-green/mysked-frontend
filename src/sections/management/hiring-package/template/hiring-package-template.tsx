import dayjs from 'dayjs';
import { Document } from '@react-pdf/renderer';

import { NewHire } from 'src/types/new-hire';

import { EmployeeHireForm } from './employee-form-page';
import { CompanyRulesPage } from './company-rules-page';
import { MotiveCameraPage } from './camera-motive-page';
import { ContractDetailPage } from './contract-detail-page';
import { SafetyProtocolPage } from './safety-protocol-page';
import { CompanyPolicy703Page } from './company-policy-703-page';
import { CompanyPolicy704Page } from './company-policy-704-page';
import { CompanyPolicyNCS001Page } from './company-policy-ncs-001-page';
import { CompanyPolicyGen002Page } from './company-policy-gen-002-page';
import { CompanyPolicyGen003Page } from './company-policy-gen-003-page';
import { PayrollDirectDepositPage } from './payroll-direct-deposit-page';
import { EmployeeTaxCreditTD1Page } from './employee-tax-credit-td1-page';
import { CompanyPolicyNCS003UPage } from './company-policy-ncs-003U-page';
import { EquipmentReturnPolicyPage } from './equipment-return-policy-page';
import { EmployeeTaxCreditTD1BCPage } from './employee-tax-credit-td1bc-page';
import { EmployeeEquityQuestionPage } from './employment-equity-question-page';
import { EmployeeSocialCommitteePage } from './employee-social-committee-page';
import { EmployeeOrientationCheckList } from './employee-orientation-checklist-page';
import { EmployeeEmergencyInformationPage } from './employee-emergency-infomation-page';
import { CelebrateDivesityEagleGreenLPPPage } from './celebrate-diversity-eaglegreen-page';
import { AdminCheckListFleetOnboardingPage } from './admin-checklist-fleet-onboarding-page';
import { CompanyPolicyFireExtinguisherPage } from './company-policy-fire-extinguisher-page';
import { AdminPreHireOnboardingDocumentationPage } from './admin-pre-hire-documentation-page';

//--------------------------------------
type Props = {
  data: NewHire;
};
export default function HiringPackagePdfTemplate({ data }: Props) {
  const dateNow = dayjs().format('MM/DD/YYYY');
  const { employee, contract_detail } = data;
  contract_detail.employee_name = `${employee.last_name}, ${employee.first_name}`;
  contract_detail.employee_signature = employee.signature || '';
  contract_detail.date = dateNow;

  return (
    <Document>
      {/* Contract Detail Page */}
      <ContractDetailPage data={data} />

      {/* ADMIN PRE-HIRE & ONBOARDING DOCUMENTATION PAGE */}
      <AdminPreHireOnboardingDocumentationPage data={data} />

      {/* EMPLOYEE FORM PAGE */}
      <EmployeeHireForm data={data} />

      {/* EMPLOYEE EMERGENCY/CONSENT INFORMATION PAGE*/}
      <EmployeeEmergencyInformationPage data={data} />

      {/* EQUIPMENT RETURN POLICY FROM PAGE */}
      <EquipmentReturnPolicyPage data={data} />

      {/* PAYROLL DIRECT DEPOSIT */}
      <PayrollDirectDepositPage data={data} />

      {/* Employee Social Committee */}
      <EmployeeSocialCommitteePage data={data} />

      {/* Celebrate Diversity at Eagle Green LPP */}
      <CelebrateDivesityEagleGreenLPPPage data={data} />

      {/* EMPLOYMENT EQUITY QUESTIONS */}
      <EmployeeEquityQuestionPage data={data} />

      {/* Admin Checklist Fleet Onboarding Page */}
      <AdminCheckListFleetOnboardingPage data={data} />

      <CompanyPolicy703Page data={data} />

      <CompanyPolicy704Page data={data} />

      <CompanyPolicyNCS001Page data={data} />

      <CompanyPolicyNCS003UPage data={data} />

      <CompanyPolicyGen002Page data={data} />

      <CompanyPolicyGen003Page data={data} />

      {/*  Eagle Green New Employee Orientation Checklist*/}
      <EmployeeOrientationCheckList data={data} />

      <CompanyPolicyFireExtinguisherPage data={data} />

      {/* Eagle Green Protocol Page */}
      <SafetyProtocolPage data={data} />

      {/* Eagle green company rules page */}
      <CompanyRulesPage data={data} />

      {/* Motive Cameras page */}
      <MotiveCameraPage data={data} />

      {/* Personal Tax Credits Return */}
      <EmployeeTaxCreditTD1Page data={data} />

      {/* Personal British Columbia Tax Credits Return */}
      <EmployeeTaxCreditTD1BCPage data={data} />
    </Document>
  );
}
