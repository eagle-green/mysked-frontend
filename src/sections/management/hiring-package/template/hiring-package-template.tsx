import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { ContractDetails, NewHire } from 'src/types/new-hire';

import { EmployeeHireForm } from './employee-form-page';
import { ContractDetailPage } from './contract-detail-page';
import { PayrollDirectDepositPage } from './payroll-direct-deposit-page';
import { EquipmentReturnPolicyPage } from './equipment-return-policy-page';
import { EmployeeSocialCommitteePage } from './employee-social-committee-page';
import { EmployeeEmergencyInformationPage } from './employee-emergency-infomation-page';
import { AdminPreHireOnboardingDocumentationPage } from './admin-pre-hire-documentation-page';

Font.register({
  family: 'Roboto-Bold',
  src: '/fonts/Roboto-Bold.ttf',
});

Font.register({
  family: 'Roboto-Regular',
  src: '/fonts/Roboto-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: '0 30px 10px 30px',
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#ffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 30,
    width: '100%',
    flexDirection: 'row',
    logo: {
      width: 150,
      hieght: 150,
    },
    detail: {},
  },
  textHeader: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
  },
  textNormal: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'column',
    width: '100%',
    fontSize: 10,
  },
  bold: {
    fontFamily: 'Roboto-Bold',
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6, // half of width/height
  },
  emptyCircle: {
    borderWidth: 1,
    borderColor: '#000',
  },
  filledCircle: {
    backgroundColor: '#000',
  },
  table: {
    border: '1px solid #000',
  },
  tableHeader: {
    fontSize: 8,
    color: '#000',
  },
  tableHeaderColored: {
    color: '#000',
    fontSize: 10,
    backgroundColor: '#e6e6e6',
  },
  td: {
    fontFamily: 'Roboto-Bold',
    fontSize: 9,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: '30px',
    padding: '2px',
    // border: '1px solid #000',
  },
  th: {
    height: 25,
    padding: '1px 2px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  bulletPoint: {
    fontSize: 22,
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
  },
});

//--------------------------------------
type Props = {
  data: NewHire;
};
export default function HiringPackagePdfTemplate({ data }: Props) {
  const dateNow = dayjs().format('DD-MM-YYYY');
  const defaultBooleanValue = true;
  const { employee } = data;

  const contract_details: ContractDetails = {
    date: dateNow,
    employee_name: `${employee.last_name}, ${employee.first_name}`,
    position: 'Software Engineer',
    rate: 9,
    employee_signature: employee.signature || '',
  };

  const Circle = ({
    content,
    isShaded = false,
    customText,
  }: {
    content: string;
    isShaded?: boolean;
    customText?: React.ReactNode;
  }) => (
    <View
      style={{
        marginTop: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        width: '100%',
      }}
    >
      <View style={[styles.circle, isShaded ? styles.filledCircle : styles.emptyCircle]} />
      <View style={{ fontSize: 12, width: '100%', padding: '0 5px' }}>
        {customText ? customText : <Text> {content}</Text>}
      </View>
    </View>
  );

  const Checkbox = ({ checked }: { checked?: boolean }) => (
    <View
      style={{
        width: 15,
        height: 15,
        border: '1pt solid black',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: 'black',
          }}
        />
      )}
    </View>
  );

  type PolicyHeaderType = {
    PolicyNo: string;
    title: string;
    subjectArea: string;
    RevNo: string;
    pageNumber: number;
    pages?: number;
  };

  const PolicyHeader = ({
    pageNumber,
    PolicyNo,
    title,
    subjectArea,
    RevNo,
    pages = 6,
  }: PolicyHeaderType) => (
    <View
      style={{
        padding: '10px',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        gap: 0,
      }}
    >
      <Table style={[styles.table, { width: '100%', height: 200, flex: 1 }]}>
        <TH style={[styles.tableHeader, styles.bold, { height: 200 }]}>
          <TD style={[{ flex: 1, padding: '2px' }]}>
            <View style={styles.header.logo}>
              <Image src="/logo/eaglegreen-single.png" />
            </View>
          </TD>
        </TH>
      </Table>
      <Table style={[styles.table, { width: '100%', height: 200, flex: 3 }]}>
        <TH style={[styles.tableHeader, styles.bold, { height: 25, fontSize: 10 }]}>
          <TD style={[{ flex: 1, color: 'red', padding: '5px' }]}>POLICIES</TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { height: 35, fontSize: 10 }]}>
          <TD style={[{ flex: 1, padding: '5px' }]}>Policy No:</TD>
          <TD style={[{ flex: 1, padding: '5px' }]}>{PolicyNo}</TD>
          <TD
            style={[{ flex: 1, padding: '5px', flexDirection: 'column', alignItems: 'flex-start' }]}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>
              Originated By: Employee Services
            </Text>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>Date:</Text>
          </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { height: 35, fontSize: 10 }]}>
          <TD style={[{ flex: 1, padding: '5px' }]}>TITLE:</TD>
          <TD style={[{ flex: 1, padding: '5px' }]}>{title}</TD>
          <TD style={[{ flex: 1, padding: '5px' }]}> </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { height: 35, fontSize: 10 }]}>
          <TD style={[{ flex: 1, padding: '5px' }]}>Subject Area:</TD>
          <TD style={[{ flex: 1, padding: '5px' }]}>{subjectArea}</TD>
          <TD style={[{ flex: 1, padding: '5px', flexWrap: 'wrap' }]}>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>
              Reviewed By: Senior Leadership Operations Date: Jan 1, 2023
            </Text>
          </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { height: 35, fontSize: 10 }]}>
          <TD style={[{ flex: 1 }]}>
            <Text style={{ padding: '5px' }}>Rev. No:</Text>
          </TD>
          <TD style={[{ flex: 1 }]}>
            <TH style={[{ height: 35, width: '100%' }, styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, padding: '5px' }]}>{RevNo}</TD>
              <TD style={[{ flex: 2, padding: '5px' }]}>DATE:</TD>
              <TD style={[{ flex: 2, padding: '5px' }]}> </TD>
            </TH>
          </TD>
          <TD
            style={[
              {
                flex: 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular', paddingLeft: '5px' }}>
              National Safety Code
            </Text>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular', paddingLeft: '5px' }}>
              Requirement
            </Text>
          </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { height: 35, fontSize: 10 }]}>
          <TD style={[{ flex: 1, padding: '5px' }]}>PAGE:</TD>
          <TD style={[{ flex: 1, padding: '5px' }]}>
            {' '}
            {pageNumber} of {pages}
          </TD>
          <TD
            style={[{ flex: 1, padding: '5px', flexDirection: 'column', alignItems: 'flex-start' }]}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>Approved By: CEO</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>Date: Jan 1, 2023</Text>
          </TD>
        </TH>
      </Table>
    </View>
  );

  const BulletList = ({
    content,
    gap = 5,
    bulletSize = 22,
  }: {
    content: React.ReactNode;
    gap?: number;
    bulletSize?: number;
  }) => (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        gap,
      }}
    >
      <Text style={[styles.bulletPoint, { fontSize: bulletSize }]}>•</Text>
      <Text style={[styles.bulletText, { fontSize: 11 }]}>{content}</Text>
    </View>
  );

  return (
    <Document>
      {/* Contract Detail Page */}
      <ContractDetailPage data={contract_details} />

      {/* ADMIN PRE-HIRE & ONBOARDING DOCUMENTATION PAGE */}
      <AdminPreHireOnboardingDocumentationPage data={contract_details} />

      {/* EMPLOYEE FORM PAGE */}
      <EmployeeHireForm employee={data.employee} />

      {/* EMPLOYEE EMERGENCY/CONSENT INFORMATION PAGE*/}
      <EmployeeEmergencyInformationPage
        emergency_contact={data.emergency_contact}
        employee={data.employee}
        is_acknowledge={data.information_consent as boolean}
      />

      {/* EQUIPMENT RETURN POLICY FROM PAGE */}
      <EquipmentReturnPolicyPage employee={data.employee} equipments={data.equipments} />

      {/* PAYROLL DIRECT DEPOSIT */}
      <PayrollDirectDepositPage
        employee={`${employee.last_name}, ${employee.first_name}`}
        signatue={employee.signature as string}
      />

      {/* Employee Social Committee */}
      <EmployeeSocialCommitteePage
        employee={data.employee}
        socialAgreement={data.socialAgreement}
      />

      {/* Celebrate Diversity at Eagle Green LPP */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 16 }]}>
              CELEBRATE DIVERSITY AT EAGLE GREEN LLP
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>TO ALL EMPLOYEES:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            gap: 5,
          }}
        >
          <Text style={[{ fontSize: 12 }]}>DATE:</Text>
          <Text style={[{ fontSize: 12 }]}>POSITION:</Text>
          <Text style={[{ fontSize: 12 }]}>AREA:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            gap: 30,
            marginTop: '20px',
          }}
        >
          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            Eagle Green hires on the basis of merit and is committed to diversity and employment
            equity within the community.
          </Text>

          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            To ensure that we are doing our part, we collect information in accordance with the
            Employment Equity Act and the Freedom of Information and Protection ofPrivacy Act,
            regarding the employment equity status of employees.
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              gap: 30,
            }}
          >
            <Text style={[styles.bold, { fontSize: 16 }]}>CONFIDENTIALITY: </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                gap: 20,
              }}
            >
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Informationyou provide is collected in accordance with the Employment Equity Act and
                the Freedom of Information and Protection of Privacy Act, and will betreated with
                the strictest confidence
              </Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                gap: 20,
              }}
            >
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Surveys will not be shared with supervisors or managers
              </Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                gap: 20,
              }}
            >
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Surveys will not be shared with supervisors or managers
              </Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                gap: 20,
              }}
            >
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Paper surveys are returned in a sealed envelopetoEmployee Services for entry
              </Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                gap: 20,
              }}
            >
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>
                Responses to this survey will be analyzed only in summary form and will be kept
                separately fiom employee files
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '20px',
          }}
        >
          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            If you do not wish to participate in the survey, please check the box below:
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '20px',
            gap: 20,
          }}
        >
          <Checkbox />
          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            I have reviewed the content of the Employment Equity Survey and do not wish to
            participate.
          </Text>
        </View>
      </Page>

      {/* EMPLOYMENT EQUITY QUESTIONS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 16 }]}>EMPLOYMENT EQUITY QUESTIONS</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            gap: 30,
          }}
        >
          <Text style={[{ fontSize: 12 }]}>
            For the purpose of employment equity, please answer the following questions:
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>1. GENDER</Text>
          <Text style={[{ fontSize: 12 }]}>What is your Gender?</Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>MALE</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>FEMALE</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>PREFER NOT TO SAY</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            marginTop: 20,
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>2. ABORIGINAL PERSONS</Text>
          <Text style={[{ fontSize: 12 }]}>
            Aboriginal peoples are those who identify as First Nations (Status, non-Status, Treaty),
            Metis, Inuit, or North American Indian.{' '}
            <Text style={styles.bold}> Do you consider yourself an Aboriginal person </Text>?
          </Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>YES</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>NO</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            marginTop: 20,
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>3. VISIBLE MINORITY</Text>
          <Text style={[{ fontSize: 12 }]}>
            Members of visible minorities are persons in Canada (other than Aboriginal peoples) who
            are non white, regardless of place of birth or citizenship.
            <Text style={styles.bold}> Do you self-identify as a visible minority </Text>?
          </Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>YES</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>NO</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>OPTIONAL QUESTIONS</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            marginTop: 20,
          }}
        >
          <Text style={[{ fontSize: 12 }]}>
            4. EG is dedicated to supporting social well-being in the communities in which we work.
            Would you be willing to participate in events that will help EG strengthen its
            commitment to diversity? If you choose to participate in certain events, Employee
            Services may ask you to attend and help. Your participation is voluntary.
          </Text>

          <Text style={[{ fontSize: 12 }]}>
            5. Some projects require members/ employees from a specific aboriginal nation to work on
            the project. Would you be interested in being considered for these opportunities?
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>YES</Text>
            </View>

            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 15,
              }}
            >
              <Checkbox />
              <Text style={[{ fontSize: 12 }]}>NO</Text>
            </View>
          </View>

          <Text style={[{ fontSize: 12 }]}>If yes, please tell us your Nation?</Text>
        </View>
      </Page>

      {/* Admin Checklist Fleet Onboarding Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '250px',
              flexWrap: 'wrap',
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 24 }]}>
              ADMIN CHECKLIST: FLEET ONBOARDING DOCUMENTATIONS
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
          }}
        >
          <Text style={[styles.bold, { fontSize: 14, textDecoration: 'underline', color: 'red' }]}>
            ONLY TO BE COMPLETED IF EMPLOYEE IS REQUIRED TO USE A COMPANY VEHICLE
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            gap: 5,
          }}
        >
          <Text style={[{ fontSize: 12 }]}>EMPLOYEE NAME:</Text>
          <Text style={[{ fontSize: 12 }]}>OPERATING AREA:</Text>
          <Text style={[{ fontSize: 12 }]}>HIRE DATE:</Text>
          <Text style={[{ fontSize: 12 }]}>POSITION TITLE:</Text>
        </View>

        <View style={{ marginTop: 15, width: '80%' }}>
          <Circle content="Copy of Current Driver's License (NSC)" />
          <Circle content="Provincial Abstract Consent Form" />
          <Circle content="Copy of 5 Yr. Commercial Driver's Abstract" />
          <Circle content="Employee Resume" />
          <Circle content="Drug & Alcohol Policy" />
          <Circle content="Pre-Trip & Post-Trip Policy" />
          <Circle content="EG Driver Identification Policy (Vehicle Fobs)" />
          <Circle content="Use of Company Vehicle UNION Policy" />
          <Circle content="Use of Company Vehicle NON UNION Policy" />
          <Circle content="Company Fuel Cards Policy" />
          <Circle content="GPS Usage Policy" />
          <Circle content="Conduct & Behavior Policy" />
          <Circle content="Additional Certifications (*Not Required, N/A if none provided)" />
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: 25,
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>
            Area Admin Confirmation of Documents Received
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10 }}>EMPLOYEE’S NAME </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10 }}>EMPLOYEE’S SIGNATURE</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: 25,
          }}
        >
          <Text style={[styles.bold, { fontSize: 12, color: 'red' }]}>
            Please Complete & Submit with Complete Hire Package to Payroll
          </Text>
          <Text style={[styles.bold, { fontSize: 12, color: 'red' }]}>
            * National Safety Code Requirement
          </Text>
        </View>
      </Page>

      {/* Policy  EG-PO-HR-703 1 out of 6*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={1}
          PolicyNo="EG-PO-HR-703"
          subjectArea="Human Resources"
          title="Drugs and Alcohol"
          RevNo="A"
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '95%',
            gap: 10,
          }}
        >
          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            Eagle Green LLP (EG) is committed to the health and safety of its employees. EG accepts
            the responsibility to provide its employees with a healthy, safe, and productive
            workplace. The use of illegal drugs, improper use of prescription medication, and the
            use of alcohol can have serious consequences leading to workplace injuries or other
            incidents.
          </Text>

          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            Recognizing the potential negative effects of alcohol and drug use within the
            organization, in particular, the hazards that individuals who use/abuse drugs or alcohol
            pose themselves, their coworkers, and the general public, EG has developed a
            comprehensive drug and alcohol policy.
          </Text>

          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            EG requires that all employees be aware of this policy and cooperate and support the
            workplace in remaining free of any hazards that may be associated with the use/misuse of
            drugs and alcohol in the workplace
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Purpose</Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              {`The purpose of this policy is to establish EG's expectations for appropriate behavior,the consequences for non-compliance and to provide consistent guidelines for allemployees in the treatment of situations arising from the use/ abuse of drugs or alcohol.`}
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Policy</Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              This policy provides for the testing of prospective employees for drug and/or alcohol
              abuse, assisting all employees who voluntarily seek help for problems relating to
              drugs and/or alcohol, and educating employees on the dangers of drug and alcohol
              abuse. This policy also provides guidance for managers of employees with drug and/or
              alcohol dependency issues, drawing on applicable OHS legislation. For the purposes of
              this policy, the following are prohibited:
            </Text>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                marginTop: '10px',
                gap: 10,
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  The presence in the body of illicit drugs (or their metabolites) while at work.
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  {`The use, possession, consumption, delivery, distribution, exchange, manufacturing, purchasing, sale or transfer of any illegal drugs, narcotics, or other unauthorized substances on APM's sites while conducting company business.`}
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  {`The unauthorized use, possession, consumption, delivery, distribution, exchange, manufacturing, purchasing, sale or transfer of alcohol while on Company Name's sites or while conducting company business.`}
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  {`Misuse, excessive use, or recreational use of over-the-counter (OTC) medication or prescription drugs while on APM's sites or while conducting company business.`}
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  Engaging in controlled activities while under the influence of unauthorized
                  substances.
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  Refusing to submit to drug/alcohol testing, failure to report to a
                  company-designated facility for a drug/alcohol test, or tampering or attempting to
                  tamper with a test sample.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* Policy  EG-PO-HR-703 2 out of 6*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={2}
          PolicyNo="EG-PO-HR-703"
          subjectArea="Human Resources"
          title="Drugs and Alcohol"
          RevNo="A"
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '95%',
            gap: 15,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>
              Treatment and Accommodation for Addiction
            </Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              Any employee suffering from a drug or alcohol addiction is strongly encouraged to
              disclose the addiction to their supervisor. EG understands its responsibility to
              assist and accommodate employees suffering from an illness/addiction due to drugs
              and/or alcohol to the extent reasonably possible without suffering undue hardship.
            </Text>
          </View>

          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            Further, employees who are concerned that a fellow employee may be suffering from a drug
            and/or alcohol addiction are strongly encouraged to report their concerns to their
            supervisor.
          </Text>

          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            EG has partnered to offer support and program options to an addicted employee. Further,
            for all of its employees, the company provides confidential access to addiction/abuse
            counselling services to encourage well-being and ongoing support for employees through
            our service provider.
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Drugs and Alcohol</Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              {`While on EG's premises and/or while conducting company-related activities off-site, no employee may use, possess, distribute, sell, or be under the influence of illegal drugs. This includes meal periods and scheduled breaks.`}
            </Text>
          </View>

          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            {`The normal use of OTC medications and the legal use of prescription drugs is not prohibited by EG provided that these aids were obtained lawfully and are not consumed at a frequency or quantity greater than the prescribed dosage. The legal use of prescribed drugs is permitted at work only if it does not impair the employee's ability to perform their work effectively and in a safe manner. Employees are required to disclose the use of prescription drugs which may affect their work performance or the safe execution of their duties. EG is committed to accommodating an employee's necessary use of prescription drugs to the extent reasonably possible without suffering undue hardship.`}
          </Text>

          <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular' }]}>
            {`If an employee is called back after regular working hours to perform work-related duties and has been consuming alcohol or using drugs, it is the employee's responsibility to: Under no circumstances operate a motor vehicle while under the influence of drugs and/or alcohol. Notify an authorized person(e.g. manager on duty) of the circumstances immediately. Receive assistance from the authorized person to be relieved of the employee's duties and to be safely transported home or to a medical facility at the discretion of the authorized person.`}
          </Text>
        </View>
      </Page>

      {/* Policy  EG-PO-HR-703 3 out of 6*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={3}
          PolicyNo="EG-PO-HR-703"
          subjectArea="Human Resources"
          title="Drugs and Alcohol"
          RevNo="A"
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '95%',
            gap: 15,
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Testing</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>
              Testing is conducted to confirm the presence of:
            </Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Alcohol</Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>
                  Amphetamines/Methamphetamines
                </Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Cocaine</Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Marijuana (THC)</Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Opiates</Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Phencyclidine (PCP)</Text>
              </View>

              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Ecstacy</Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  width: '100%',
                  gap: 5,
                }}
              >
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.bulletText, { fontSize: 11 }]}>Heroin</Text>
              </View>
            </View>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Post Indicent Testing</Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              An employee involved in an incident/injury or a near miss may be required by the
              company to undergo post-incident testing for drugs and/or alcohol.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Pre-Employment Testing</Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              EG may choose to conduct pre-employment drug and alcohol testing prior to an offer of
              employment being extended. In this instance, an offer of employment is conditional on
              a negative test result.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>
              Testing When Required By The Customer
            </Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              When a Customer requires EG employees to be tested for drugs and alcohol, EG will
              abide by these requirements. Employees however can voluntarily choose to be tested or
              not tested. If the employee chooses to not test, he will be unable to work on that
              Customer project and will be reassigned.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>
              Reasonable CauseFor Testing
            </Text>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              EG reserves the right to conduct testing for the presence of drugs and/or alcohol when
              a supervisor has reasonable cause to believe that the actions, appearance, or conduct
              of an employee while on duty is indicative of the use of drugs and/or alcohol.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
            <Text style={[{ fontSize: 11, fontFamily: 'Roboto-Regular', textAlign: 'justify' }]}>
              The basis for the decision to test will be made with the employees direct supervisor,
              and any two of the following: General Foreman, Superintendent, any member of the
              Senior Leadership Team, and Human Resources.
            </Text>
          </View>
        </View>
      </Page>

      {/*  Polic6  EG-PO-HR-703 5 out of 6 */}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={5}
          PolicyNo="EG-PO-HR-703"
          subjectArea="Human Resources"
          title="Drugs and Alcohol"
          RevNo="A"
        />

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
            marginTop: '10px',
            width: '95%',
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            If an employee is assessed as not addicted, he will be offered the opportunity to return
            to work under a Return to Work Agreement.
          </Text>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            If the employee refuses the assessment or refuses to sign a Return to Work Agreement, he
            will then be subject to discipline under the terms of this policy.
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Discipline</Text>
            <Text
              style={{ fontFamily: 'Roboto-Regular', fontSize: 11, textDecoration: 'underline' }}
            >
              Discipline Relating to Drugs and Alcohol
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Seeking voluntary assistance for drug and/or alcohol addiction will not jeopardize an
              employees employment, so long as the employee continues to cooperate and seek
              appropriate treatment. With treatment and control, the employee is encouraged to work
              with EG in facilitating a return to work within a reasonably foreseeable future.
              Employees who fail to cooperate with assistance, testing, assessment or treatment
              and/or engage in repeated infractions of this policy will be subject to the normal
              disciplinary measures including indefinite suspension up to and including termination.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Scope</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              This policy applies to all employees. Grievance procedures for Union employees are
              governed by the terms of the applicable Collective agreement.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Responsibility</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Employees have the responsibility to report to work capable of performing their work
              in a productive and safe manner. Employees also have the responsibility to report any
              unsafe situations related to (or unrelated to) the suspected use or impairment of
              drugs or alcohol by another employee.
            </Text>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            Managers are responsible for investigating and responding in a timely manner regarding
            issues or concerns raised.
          </Text>
        </View>
      </Page>

      {/*  Policy  EG-PO-HR-703 6 out of 6 */}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={6}
          PolicyNo="EG-PO-HR-703"
          subjectArea="Human Resources"
          title="Drugs and Alcohol"
          RevNo="A"
        />

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginTop: '10px',
            width: '95%',
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>Definitions</Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            {`"Under the influence"`}of drugs including prescription drugs, alcohol or any
            controlled substance for the purpose of this policy is defined as the use of one or more
            of these substances to an extent that the
          </Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>employee is:</Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              width: '100%',
              gap: 5,
            }}
          >
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={[styles.bulletText, { fontSize: 11 }]}>
              Unable to work in a productive manner.
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              width: '100%',
              gap: 5,
            }}
          >
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={[styles.bulletText, { fontSize: 11 }]}>
              In a physical or mental condition that creates a risk to the safety and well-being of
              the individual, other employees, property of Company Name, or any member of the
              public.
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginTop: '30px',
            width: '95%',
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>Reference</Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            EG Collective Agreement
          </Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>EG Safety Policies</Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            Provincial Workers Compensation Legislation
          </Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            EG-Drugs and Alcohol Manager Guidelines
          </Text>
        </View>

        <View
          style={{
            borderTop: '1px',
            borderBottom: '1px',
            padding: '5px 15px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <Text style={{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Bold' }}>
            Acknowledgement and Acceptance
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
            marginTop: '30px',
          }}
        >
          <Text style={[{ fontSize: 12, color: 'red', fontFamily: 'Roboto-Regular' }]}>
            By signing this policy, I confirm that I have read, understood and agree to abide by the
            information contained within.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S NAME </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S SIGNATURE</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>DATE </Text>
          </View>
        </View>
      </Page>

      {/* Policy  EG-PO-HR-704 1 out of 2*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={1}
          PolicyNo="EG-PO-HR-704"
          subjectArea="Human Resources"
          title="Bullying and Harassment"
          RevNo=""
          pages={2}
        />

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
            marginTop: '10px',
            width: '95%',
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            Eaglegreen is committed to maintaining a safe and respectful workplace for all employees
            and contractors. Bullying and harassment of any kind, including verbal, physical, and
            electronic, will not be tolerated.
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Scope</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              This policy applies to all employees, contractors, and subcontractors working for
              Eaglegreen, both on site and off-site, including in traffic management areas,
              construction zones, and offices.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Definition of Bullying and Harassment{' '}
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Bullying and Harassment include any unwanted behavior that creates an intimidating,
              hostile, or offensive work environment. Examples include:
            </Text>

            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BulletList
                content={
                  <Text>
                    <Text style={{ fontFamily: 'Roboto-Bold' }}>Verbal abuse </Text> (e.g.,
                    aggressive behavior, unwanted contact)
                  </Text>
                }
              />
              <BulletList
                content={
                  <Text>
                    <Text style={{ fontFamily: 'Roboto-Bold' }}>Physical intimidation </Text> (e.g.,
                    aggressive behavior, unwanted contact)
                  </Text>
                }
              />

              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Bold' }}>Exclusion or social isolation</Text>
                }
              />
              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Bold' }}>
                    Bullying via electronic communication
                  </Text>
                }
              />
            </View>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            A single severe incident may also be considered harassment.
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Employee Responsibilities
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              All employees are expected to:
            </Text>

            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BulletList content={<Text>Treat others with respect and courtesy</Text>} />
              <BulletList
                content={<Text>Report any incidents of bullying or harassment immediately</Text>}
              />

              <BulletList
                content={
                  <Text>Cooperate with investigations and support a respectful workplace </Text>
                }
              />
            </View>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Reporting and Investigation
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Employees should report any bullying or harassment to their supervisor, manager, or HR
              representative. All complaints will be investigated promptly, with confidentiality
              maintained. Employees will be informed of the outcome.
            </Text>
          </View>
        </View>
      </Page>

      {/* Policy EG-PO-HR-704 2 out 2 */}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={2}
          PolicyNo="EG-PO-HR-704"
          subjectArea="Human Resources"
          title="Bullying and Harassment"
          RevNo=""
          pages={2}
        />

        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: 15,
            width: '95%',
            fontSize: '11px',
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Consequences</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Employees found to have engaged in bullying or harassment may face:
            </Text>

            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BulletList content={<Text>Warnings or counselling </Text>} />
              <BulletList content={<Text>Suspension or demotion </Text>} />

              <BulletList
                content={
                  <Text>
                    Termination in severe cases In cases of criminal behavior (e.g., assault), legal
                    action may be pursued.{' '}
                  </Text>
                }
              />
            </View>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular' }}>
            In cases of criminal behavior (e.g., assault), legal action may be pursued.
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Confidentiality and Anti-Retaliation
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Reports and investigations will be handled confidentially. Retaliation against anyone
              who reports bullying or participates in an investigation is prohibited and will lead
              to disciplinary action.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Training and Support</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Eaglegreen will provide training to help employees understand bullying and harassment,
              and how to report it. Support is available through HR and your respective managers.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Policy Review </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              This policy will be reviewed regularly for effectiveness and legal compliance.
            </Text>
          </View>
        </View>

        <View
          style={{
            borderTop: '1px',
            borderBottom: '1px',
            padding: '5px 15px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <Text style={{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Bold' }}>
            Acknowledgement and Acceptance
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
            marginTop: '30px',
          }}
        >
          <Text style={[{ fontSize: 12, color: 'red', fontFamily: 'Roboto-Regular' }]}>
            By signing below, I acknowledge that I have read, understood and agree to abide by
            Eaglegreen’s Bullying and Harassment Policy.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S NAME </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S SIGNATURE</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>DATE </Text>
          </View>
        </View>
      </Page>

      {/* Policy EG-PO-FL-NCS-001 1 out 1 */}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={1}
          PolicyNo="EG-PO-FL-NCS-001"
          subjectArea="FLEET"
          title="PRE-TRIP & POST TRIP POLICY"
          RevNo="A"
          pages={1}
        />

        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: 20,
            width: '95%',
            fontSize: '11px',
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Pre-trip Policy:</Text>

          <Text style={{ fontFamily: 'Roboto-Regular' }}>
            It is a requirement of all Eagle Green LLP (EG) field employees who operate vehicles to
            complete a full written pre-trip report and post-trip report daily on all motorized
            vehicles and trailers. These reports meet the standards of your Provincial Motor Vehicle
            Act and National Safety Code, which states pre and post-trip reports are a legal
            requirement when operating commercially registered vehicles.
          </Text>

          <Text style={{ fontFamily: 'Roboto-Regular' }}>
            Employees changing vehicles or trailers throughout the day must complete a new pre-trip
            report for each unit.
          </Text>

          <Text style={{ fontFamily: 'Roboto-Regular' }}>
            Pre-trip reports are to be submitted at the end of every day to the designated{' '}
            {`"In Box"`}
            location. Superintendents will ensure all employees operating vehicles are trained to
            competently carry out pre & post-trip inspections. Thorough inspections can be completed
            in less than 15 minutes by an individual.
          </Text>

          <Text style={{ fontFamily: 'Roboto-Regular' }}>
            The employee acknowledges that he/she has been advised of this policy, has had an
            interactive pre-trip & post-trip inspection demonstrated to them, acknowledges this is a
            legal requirement to operate any vehicle, and is solely responsible for the vehicle
            being operated while performing their daily duties. The employee accepts all legal fines
            incurred due to vehicle deficiencies not reported on a pre-trip or post trip report will
            be the sole responsibility of the driver and will not be reimbursed by the Company.
          </Text>
        </View>

        <View
          style={{
            borderTop: '1px',
            borderBottom: '1px',
            padding: '5px 15px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <Text style={{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Bold' }}>
            Acknowledgement and Acceptance
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
            marginTop: '30px',
          }}
        >
          <Text style={[{ fontSize: 12, color: 'red', fontFamily: 'Roboto-Regular' }]}>
            By signing this policy, I confirm that I have read, understood and agree to abide by the
            information contained within.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S NAME </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S SIGNATURE</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>DATE </Text>
          </View>
        </View>
      </Page>

      {/*  Policy EG-PO-FL-NCS-002U 1 out 4*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={1}
          PolicyNo="EG-PO-FL-NCS-003U"
          subjectArea="FLEET"
          title="USE OF COMPANY VEHICLES"
          RevNo=""
          pages={4}
        />

        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: 20,
            width: '95%',
            fontSize: '12px',
          }}
        >
          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Purpose</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 10 }}>
              The purpose of this policy is to ensure all employees understand the acceptable use of
              Company Vehicles. This policy is for union employees at the Foreman level and below.
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
              fontSize: 10,
            }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Policy</Text>

            <Text style={{ fontFamily: 'Roboto-Regular' }}>
              The assignment and use of a Company Vehicle is a privilege and it is {`'EG's'`} policy
              to insist that employees operate in a safe and economical manner while using Company
              Vehicles.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>General Principles:</Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Employees must hold a valid {`'driver's`} License to operate a company Vehicle.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2.Employees are responsible for the cleanliness of the interior and exterior of the
                vehicle. Company Vehicles must be clean and presentable at all times without garbage
                and excess clutter and are subject to random inspections.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                3.No after-market accessories are to be added to the vehicle without written consent
                from APM`s Fleet Manager.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Idling:</Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.All employees operating EG vehicles will make every effort to avoid idling while
                performing their daily work duties.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2.Excessive idling adversely affects our environment and directly contributes to
                increased operating costs which include increased fuel costs as well as wear and
                tear on EG vehicles and equipment
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                3.In certain operating areas and jurisdictions, idling of company vehicles is
                required to a greater extent than in other areas. Notwithstanding the inherent
                necessity to idle vehicles for longer periods in these areas, it is incumbent on EG
                employees to minimize the amount of idling that occurs.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Traffic Laws and Speeding::
            </Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Employees will obey posted speed limits, up to and including 110 KM per hour. No
                vehicle will exceed 110 KM per hour under any circumstance. GPS devices will be used
                to enforce this policy.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2.Employees must conform to all traffic laws, signals or markings. Any traffic or
                parking fines incurred while operating an EG vehicle are the responsibility of the
                employee.
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/*  Policy EG-PO-FL-NCS-002U 2 out 4*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={2}
          PolicyNo="EG-PO-FL-NCS-003U"
          subjectArea="FLEET"
          title="USE OF COMPANY VEHICLES"
          RevNo=""
          pages={4}
        />

        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: 20,
            width: '95%',
            fontSize: '12px',
          }}
        >
          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Business Usage:</Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Company Vehicles are used to carry out EG Business only, and to and from work with
                pre-approval. Vehicles are not used for personal business.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2. Exceptions to this are management personnel, Superintendents, Area Managers and
                General Managers, as a perquisite of the position.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Cell Phone Usage While Driving:
            </Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.If a call is necessary, the employee must pull over to a safe location for the
                duration of the call.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2.If a call is necessary while driving, the use of a hands-free device is mandatory
                for any use of phones in a vehicle. Only hands-free cell phones that are
                voice-activated, or activated by one touch, provided they are securely attached to
                the vehicle or the {`'driver's`} body (such as an earpiece)are allowed to be used
                while driving.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Business Usage:</Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Company Vehicles are used to carry out EG Business only, and to and from work with
                pre-approval. Vehicles are not used for personal business.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2. Exceptions to this are management personnel, Superintendents, Area Managers and
                General Managers, as a perquisite of the position.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                3. To keep distracted driving to a minimum, these conversations are kept to a
                minimum.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Texting or Emailing While Driving:
            </Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Texting and emailing are prohibited while driving, this includes while stopped at
                a red light
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2. If texting or emailing is necessary, the employee must pull over to a safe
                location.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Safety:</Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Vehicles are not to be operated after the consumption of alcohol or drugs that
                cause impairment.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2. Possession or use of any kind of substances causing impairment, narcotics,
                alcohol or any other likewise substance within the vehicle is strictly prohibited.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                3. Employees must operate Company Vehicles in a safe, courteous, and professional
                manner in the eye of the general public.
              </Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Maintenance:</Text>

            <View
              style={{
                paddingLeft: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 10,
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                1.Employees are responsible for ensuring the vehicle is in safe mechanical condition
                and all maintenance requirements are reported immediately.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                2. Employees are responsible for pre-trip and post-trip inspections.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                3. Employees must report all damages to Company Vehicles immediately.
              </Text>
              <Text style={{ fontFamily: 'Roboto-Regular' }}>
                4. Employees are responsible for reading the {`'Owner's`} Manual and understanding
                basic maintenance requirements, safety equipment, and operation of Towing Modes
                where required.
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/*  Policy EG-PO-FL-NCS-002U 3 out 4*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={3}
          PolicyNo="EG-PO-FL-NCS-003U"
          subjectArea="FLEET"
          title="USE OF COMPANY VEHICLES"
          RevNo=""
          pages={4}
        />

        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: 20,
            width: '95%',
          }}
        >
          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Violation of this Policy:
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              This is a reminder that the Provinces of British Columbia, Alberta, Saskatchewan and
              Manitoba have newer hands-free legislation in effect. It is against the law to drive
              while holding a cell phone or other electronic device.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 15 }}
          >
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Any violation of the law will net drivers fines and points. Each employee shall be
              personally responsible for the payment of fines. Should an employee be restricted from
              driving an EG vehicle because of driver points, that employee will be subject to
              escalating discipline, including a change of position or termination of employment.
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Employees who violate any section of this policy will, and if found to be negligent,
              face disciplinary measures up to termination, and face legal responsibility if, in the
              course and scope of their duties, they are involved in a car accident as a result of
              violating this policy.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Scope</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              This policy applies to all employees who operate company-owned vehicles/equipment and
              those who are operating personal vehicles on behalf of EG or while on EG time.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>Responsibility</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Employees - it is the employees responsibility to use Company Vehicles in the manner
              for which they were intended
            </Text>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            Managers - it is the Manager`s responsibility to oversee the proper and consistent use
            of Company Vehicles.
          </Text>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>Reference</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>EG -GPS Policy</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              EG -Drug and Alcohol Policy
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>EG -Safety Policy</Text>
          </View>
        </View>
      </Page>

      {/*  Policy EG-PO-FL-NCS-002U 4 out 4*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={4}
          PolicyNo="EG-PO-FL-NCS-003U"
          subjectArea="FLEET"
          title="USE OF COMPANY VEHICLES"
          RevNo=""
          pages={4}
        />

        <View
          style={{
            borderTop: '1px',
            borderBottom: '1px',
            padding: '5px 15px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <Text style={{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Bold' }}>
            Acknowledgement and Acceptance
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 30,
            marginTop: '30px',
          }}
        >
          <Text style={[{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Regular' }]}>
            By signing this policy, I confirm that I have read, understood and agree to abide by the
            information contained within.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S NAME </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S SIGNATURE</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'red',
            }}
          >
            <Text style={{ fontSize: 10, color: 'red' }}>DATE </Text>
          </View>
        </View>
      </Page>

      {/*  Policy EG-PO-PO-FL-GEN-002 1 out 2*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={1}
          PolicyNo="EG-PO-PO-FL-GEN-002"
          subjectArea="FLEET"
          title="COMPANY FUEL CARDS"
          RevNo=""
          pages={2}
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
            width: '95%',
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Purpose</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>
              The purpose of this policy is to prevent and eliminate abusive company fuel card
              charges.
            </Text>
          </View>

          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Policy</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>
              This policy applies to all employees who have been issued company fuel cards from any
              of our suppliers to assist in the fulfilment of their respective duties and
              responsibilities. The following must be observed:
            </Text>

            <View
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: 5,
                paddingLeft: '10px',
              }}
            >
              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                1. Company fuel cards must be used for business purposes only. Under no
                circumstances should Company fuel cards be used for personal use. Personal use of
                fuel cards is considered theft and will result in immediate disciplinary action
                (which may include termination), along with the personal charges being rebilled to
                the employee plus a $10 administration fee.
              </Text>

              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                2. Purchases on fuel cards should be limited to: Regular Gasoline, Low Sulphur
                Diesel, Car Wash, Motor Oil, Grease and other lubricants. Unless given specific
                written approval or direction only regular grade gasoline should be used.
                Individuals who purchase a higher-grade fuel without said approval or instruction
                will be personally responsible for the difference in fuel charges.
              </Text>

              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                3. Fuel cards should not be transferred between employees unless specifically
                directed by a Superintendent or equivalent. The transfer of fuel cards must then be
                communicated to the Fuel Card Administrator.
              </Text>

              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                4. Upon change in employment responsibility or status (including termination) if you
                no longer require a fuel card you must return your fuel card to the local field
                support staff who will then notify the Fuel Card Administrator of the change in
                status.
              </Text>

              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                5. If a fuel card is lost or stolen it is the sole responsibility of the employee to
                contact the Fuel Card Administrator to advise them of the situation.
              </Text>

              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                6. All fuel card activations and deactivations will be done by the Fuel Card
                Administrator or Controller in his/her absence.
              </Text>

              <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
                7. All changes in fuel card limits should be made by the Superintendent or above on
                behalf of the employee, under no circumstances will a change in fuel card limits be
                processed upon request of the employee.
              </Text>
            </View>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>Reference None</Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>None</Text>
        </View>
      </Page>

      {/*  Policy EG-PO-PO-FL-GEN-002 2 out 2*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={2}
          PolicyNo="EG-PO-PO-FL-GEN-002"
          subjectArea="FLEET"
          title="COMPANY FUEL CARDS"
          RevNo=""
          pages={2}
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
            width: '95%',
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 11 }}>
              Please acknowledge below that you have received and read the above policy and
              understand that abuse or failure to follow the above policy may result in one or all
              of the following:
            </Text>

            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Bold' }}>
                    an employee having to forfeit the company fuel card;{' '}
                  </Text>
                }
              />
              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Bold' }}>
                    have fuel charges rebilled to you and{' '}
                  </Text>
                }
              />

              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Bold' }}>
                    pay a $10 administration fee for card replacement.
                  </Text>
                }
              />
            </View>
          </View>

          <View
            style={{
              borderTop: '1px',
              borderBottom: '1px',
              padding: '5px 15px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              marginTop: '30px',
            }}
          >
            <Text style={{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Bold' }}>
              Acknowledgement and Acceptance
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              gap: 30,
              marginTop: '30px',
            }}
          >
            <Text style={[{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Regular' }]}>
              By signing this policy, I confirm that I have read, understood and agree to abide by
              the information contained within.
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: 40,
            }}
          >
            <View
              style={{
                borderTop: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'red',
              }}
            >
              <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S NAME </Text>
            </View>

            <View
              style={{
                borderTop: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'red',
              }}
            >
              <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S SIGNATURE</Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: 40,
            }}
          >
            <View
              style={{
                borderTop: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'red',
              }}
            >
              <Text style={{ fontSize: 10, color: 'red' }}>DATE </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 12 }}>
            Current Fuel Cards in my possession include:
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
            }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12, flex: 1 }}>COMPANY</Text>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12, flex: 1 }}>CARD NUMBER</Text>
          </View>
        </View>
      </Page>

      {/* Policy  EG-PO-PO-FL-GEN-003 GPS Page 1 out 2 */}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={1}
          PolicyNo="EG-PO-PO-FL-GEN-003 GPS"
          subjectArea="FLEET"
          title="USAGE"
          RevNo=""
          pages={2}
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
            width: '95%',
          }}
        >
          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Purpose</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              The purpose of this policy is to ensure all employees understand the acceptable usage
              of GPS and the information provided by it.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Policy</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              GPS Devices have been installed in all of our company-owned vehicles and some
              excavation equipment. Each GPS unit comes with a dual-facing camera. GPS was primarily
              installed in these units for the following reasons:
            </Text>

            <View
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: 5,
                fontSize: 11,
                fontFamily: 'Roboto-Regular',
                paddingLeft: 10,
              }}
            >
              <Text>1. Improve EG`s dispatch function.</Text>
              <Text>
                2. Enhance EG`s approach to safety as it relates to individuals who work alone or in
                remote locations.
              </Text>
              <Text>
                3. Enhance EG`s approach to safety as it relates to speeding and accidents.
              </Text>
              <Text>4. Improve EG`s Vehicle Maintenance Scheduling.</Text>
              <Text>5. Introduce a theft deterrent and improve equipment recovery.</Text>
            </View>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              To ensure all 5 objectives are being met, EG has granted access to GPS information to
              the following employees and management:
            </Text>

            <View
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: 5,
                fontSize: 11,
                fontFamily: 'Roboto-Regular',
                paddingLeft: 10,
              }}
            >
              <Text>1. General Superintendent</Text>
              <Text>2. All area Superintendents</Text>
              <Text>3. All area General Foreman</Text>
              <Text>4. All area Dispatch function staff</Text>
              <Text>5. Fleet Manager and Fleet Support Staff</Text>
              <Text>6. Controller and support staff</Text>
            </View>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            GPS information provided will be used to run reports, review vehicles` status and
            location, enter and record maintenance, dispatch work and general upkeep of the system.
            Any employee information recorded in the system will be governed by EG`s Privacy Policy
            and will be used strictly for business or safety purposes.
          </Text>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              While GPS information will be used on a daily basis and reviewed on a continuous basis
              it will not be used for the following reasons:
            </Text>

            <View
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: 5,
                fontSize: 11,
                fontFamily: 'Roboto-Regular',
                paddingLeft: 10,
              }}
            >
              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Regular' }}>
                    To track an employee`s movement on an ongoing basis unless related to
                    operational requirements.
                  </Text>
                }
              />

              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Regular' }}>
                    To monitor the ongoing usage of our leadership group`s off hours.
                  </Text>
                }
              />

              <BulletList
                content={
                  <Text style={{ fontFamily: 'Roboto-Regular' }}>
                    To terminate or discipline an employee due to information obtained solely from
                    GPS. GPS information will however be used to document and support flagrant
                    vehicle misUse or violations of policy.
                  </Text>
                }
              />
            </View>
          </View>
        </View>
      </Page>

      {/* Policy  EG-PO-PO-FL-GEN-003 GPS Page 2 out 2 */}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={2}
          PolicyNo="EG-PO-PO-FL-GEN-003 GPS"
          subjectArea="FLEET"
          title="USAGE"
          RevNo=""
          pages={2}
        />

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
            width: '95%',
          }}
        >
          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Please note all decisions regarding discipline or termination are substantiated via
              other means before a decision of this nature is made.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Scope</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              This policy applies to all employees who operate company-owned equipment.
            </Text>
          </View>

          <View
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12 }}>Responsibility</Text>
            <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
              Employees - it is the employees` responsibility to Use both vehicles and GPS in the
              manner for which they were intended. Tampering with, deactivating or disciplinary
              action.
            </Text>
          </View>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            Employees are not to cover dual-facing cameras as it poses a security risk in case of an
            emergency
          </Text>

          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 11 }}>
            Managers - it is the Manager`s responsibility to oversee the proper and consistent Use
            of GPS and GPS information
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
              fontFamily: 'Roboto-Regular',
              fontSize: 11,
            }}
          >
            <Text>Definitions</Text>
            <Text>None</Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
              fontFamily: 'Roboto-Regular',
              fontSize: 11,
            }}
          >
            <Text>Reference</Text>
            <Text>EG - Privacy Policy</Text>
            <Text>EG - Use of Vehicle Policy</Text>
          </View>
        </View>

        <View style={{ width: '95%' }}>
          <View
            style={{
              borderTop: '1px',
              borderBottom: '1px',
              padding: '5px 15px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Bold' }}>
              Acknowledgement and Acceptance
            </Text>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              gap: 30,
              marginTop: 15,
            }}
          >
            <Text style={[{ fontSize: 14, color: 'red', fontFamily: 'Roboto-Regular' }]}>
              By signing this policy, I confirm that I have read, understood and agree to abide by
              the information contained within.
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: 25,
            }}
          >
            <View
              style={{
                borderTop: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'black',
              }}
            >
              <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S NAME </Text>
            </View>

            <View
              style={{
                borderTop: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'black',
              }}
            >
              <Text style={{ fontSize: 10, color: 'red' }}>EMPLOYEE’S SIGNATURE</Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: 25,
            }}
          >
            <View
              style={{
                borderTop: '1px',
                padding: '5px 15px',
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'black',
              }}
            >
              <Text style={{ fontSize: 10, color: 'red' }}>DATE </Text>
            </View>
          </View>
        </View>
      </Page>

      {/*  Eagle Green New Employee Orientation Checklist*/}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 24 }]}>EAGLE GREEN NEW EMPLOYEE</Text>
            <Text style={[styles.textHeader, { fontSize: 24 }]}>ORIENTATION CHECK LIST</Text>
          </View>
        </View>

        <View
          style={{
            marginTop: '10px',
            justifyContent: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            width: '95%',
          }}
        >
          <Text style={[{ fontSize: 12 }]}>EMPLOYEE NAME:</Text>
          <Text style={[{ fontSize: 12 }]}>DATE:</Text>
        </View>

        <View style={{ width: '95%', fontSize: 12, fontFamily: 'Roboto-Regular' }}>
          <Text>
            Eagle Green requires all employees entering our workforce to know and understand their
            responsibilities for health and safety prior to commencing employment. The company
            values its employees and makes every effort to create a safe and enjoyable work
            environment by providing the tools, guidelines, training and support required to achieve
            and maintain that goal.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            width: '95%',
          }}
        >
          <View style={{ flex: 1 }}>
            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Introductions: Management Supervisor and other EG Staff Members
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  EG Management Contact Information Sheet: Provide employee with a completed form
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  EG Hazard Identification and Risk Management, and its guidelines: Review and
                  Understanding
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  EG Company Rules: Review, Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  EG Responsibilities: Review, Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  EG Health & Safety Rules: Review, Understanding and sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Workers Rights and Responsibilities: Review, Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Substance Abuse Policy: Review, Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Personal Protective Equipment Policy: Review, Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Accidents, Incidents, Near Misses and Investigation Reporting Policy: Review,
                  Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>Meeting Policy: Review and Understanding</Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Joint Health and Safety Committee: Review and Understanding
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Field Level Hazard Assessment, Safe Work Practices and Safe Job Procedures Policy:
                  Review, Understanding and sign off
                </Text>
              }
            />
          </View>

          <View style={{ flex: 1 }}>
            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  EG Health, Safety and Environment Policy: Review and Understanding
                </Text>
              }
            />
            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Working Alone or in Isolation Policy: Review, Understanding
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Disciplinary Action Policy: Review and Understanding
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Job Specific Hazard Assessment and Control Documents: Review, Understanding and
                  sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>New and Young Worker: Review and Understanding</Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Company Fleet Rules / Policy: Review, Understanding and Sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Preventative Measures and Maintenance: Review and Understanding
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Training and Communication: Review, Understanding and sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>Inspections: Review and Understanding</Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Emergency Preparedness: Review, Understanding and sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Records and Statistics: Review, Understanding and sign off
                </Text>
              }
            />

            <Circle
              content=""
              customText={
                <Text style={{ fontSize: 11 }}>
                  Legislation: Review, Understanding and sign off
                </Text>
              }
            />
          </View>
        </View>
      </Page>

      {/*  Fire Extinguisher Page 1 out of 2 */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { width: '100%' }]}>
          <View style={[{ flex: 1 }]}>
            <Image src="/logo/eaglegreen-single.png" style={{ width: 125, height: 125 }} />
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              flex: 2,
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 26 }]}>FIRE</Text>
            <Text style={[styles.textHeader, { fontSize: 26 }]}>EXTINGUISHER</Text>
          </View>
        </View>

        <View
          style={{
            width: '95%',
            fontSize: 12,
            fontFamily: 'Roboto-Regular',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
          }}
        >
          <Text>
            It is essential to periodically check your fire extinguisher because it is an essential
            item to have in your home. There are numerous things you may do to avoid being reactive
            and instead be proactive.
          </Text>

          <Text>
            You can do the following to make sure your fire extinguisher is still functional:
          </Text>
        </View>

        <View
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '95%' }}
        >
          <BulletList content={<Text>Always verify the expiration date.</Text>} />
          <BulletList content={<Text>Look at the pressure gauge.</Text>} />
          <BulletList content={<Text>Call the manufacturer to inquire</Text>} />
          <BulletList
            content={<Text>Look for dents or other damage on the fire extinguisher.</Text>}
          />
          <BulletList
            content={<Text>Check the rubber fire extinguisher hose for fractures or tears.</Text>}
          />
          <BulletList content={<Text>Look for any missing pieces.</Text>} />
          <BulletList
            content={
              <Text>Your fire extinguisher`s manufacturing date can be found at the bottom.</Text>
            }
          />
          <BulletList content={<Text>Get a professional to inspect the fire extinguisher.</Text>} />
          <BulletList
            content={<Text>Recharge your fire extinguisher if it is one that can.</Text>}
          />
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            width: '95%',
          }}
        >
          <View
            style={{
              fontSize: 11,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
              flex: 1,
            }}
          >
            <Text style={{ lineHeight: 0.8 }}>
              Check the expiration date frequently. The simplest thing you can do is to check the
              expiration date. Every fire extinguisher ought to carry an expiration date so that you
              know when to discard it. Like most objects, the chemicals inside have an expiration
              date.
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              Along with the usage instructions, the expiration date ought to be printed on the
              bottle`s side. If the item does not have an expiration date, there may be a tag that
              indicates when it was last serviced. You will need to either get a new one or have it
              serviced if it hasn`t been maintained in the last ten years
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              On occasion, the bottom of the bottle will reveal the year it was made. There may even
              be a recommendation for when you should replace it in the instructions. For
              instructions, always read the directions
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              Manufacturers claim that their extinguishers last anywhere from 5 to 15 years, or on
              average 12 years, if there is no expiration date.
            </Text>
          </View>

          <View style={{ flex: 1, padding: 10 }}>
            <Image src="/pdf/fire-extinguisher-guide.png" />
          </View>
        </View>
      </Page>

      {/*  Fire Extinguisher Page 2 out of 2 */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { width: '100%' }]}>
          <View style={[{ flex: 1 }]}>
            <Image src="/logo/eaglegreen-single.png" style={{ width: 125, height: 125 }} />
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              flex: 2,
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 26 }]}>FIRE</Text>
            <Text style={[styles.textHeader, { fontSize: 26 }]}>EXTINGUISHER</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: 10,
            width: '95%',
            marginTop: 30,
          }}
        >
          <View
            style={{
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 15,
            }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold' }}>Verify the pressure gauge.</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 200, lineHeight: 0.8 }}>
              If your fire extinguisher needs servicing, the pressure gauge can let you know. You
              can proceed if the arrow is in green.
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 215, lineHeight: 0.8 }}>
              If it is empty, you might wish to have another fire extinguisher available or get it
              filled. You might not have enough depending on the size to put out a bigger fire.
              Always err on the side of caution.
            </Text>
            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 230, lineHeight: 0.8 }}>
              It`s time to get the pressure gauge filled with air or to replace it when it reads red
              or zero. No pressure might mean several things:
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 250, lineHeight: 0.8 }}>
              The bottle is empty of any additional dry chemicals.
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 300, lineHeight: 0.8 }}>
              If there are any chemicals, they cannot be sprayed. a broken bottle.
            </Text>

            <Text
              style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: '100%', lineHeight: 0.8 }}
            >
              Make careful to replace this right away in case of an emergency.
            </Text>

            <Text
              style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: '100%', lineHeight: 0.8 }}
            >
              Get the fire extinguisher serviced or replaced if you have any reason to believe the
              pressure gauge is damaged.
            </Text>

            <Text
              style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: '100%', lineHeight: 0.8 }}
            >
              Replace the bottle if the meter`s glass is cracked. An inaccurate pressure gauge might
              cause significant problems.
            </Text>
          </View>

          <View style={{ flex: 1, padding: 10, position: 'relative', zIndex: 1 }}>
            <Image
              src="/pdf/fire-extinguisher-guide-2.png"
              style={{
                width: 275,
                height: 300,
                position: 'absolute',
                right: 0,
                top: -50,
              }}
            />
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 60,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              EMPLOYEE{' '}
            </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SUPERVISOR
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 25,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>DATE </Text>
          </View>
        </View>
      </Page>

      {/* Eagle Green Protocol Page */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { width: '100%' }]}>
          <View style={[{ flex: 1 }]}>
            <Image src="/logo/eaglegreen-single.png" style={{ width: 125, height: 125 }} />
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              flex: 2,
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 26 }]}>EAGLEGREEN</Text>
            <Text style={[styles.textHeader, { fontSize: 26 }]}>SAFETY PROTOCOLS</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: 10,
            width: '95%',
            marginTop: 30,
          }}
        >
          <View
            style={{
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 20,
              fontFamily: 'Roboto-Regular',
            }}
          >
            <Text style={{ lineHeight: 0.8 }}>
              I, _______________________________________________________, acknowledge receipt of the
              following package provided by Eagle Green to ensure that safe work practices are
              implemented and adhered to.
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              I understand that safe work practices are detailed methods outlining how to perform
              tasks with minimal risk to people, equipment, materials, the environment, and
              processes. I recognize that these protocols are established to ensure my safety and
              well-being while on the job.
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              Additionally, I acknowledge that I have received and reviewed a copy of the Eagle
              Green Safety Manual. I understand and agree to abide by the policies and procedures
              outlined therein to maintain a safe working environment.
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              I further acknowledge that Eagle Green is officially COR-certified, and it is my
              responsibility to ensure that daily operations comply with COR standards.
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 50,
            gap: 50,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              EMPLOYEE{' '}
            </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SUPERVISOR{' '}
            </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SAFETY MANAGER
            </Text>
          </View>
        </View>
      </Page>

      {/* Eagle green company rules page */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { width: '100%' }]}>
          <View style={[{ flex: 1 }]}>
            <Image src="/logo/eaglegreen-single.png" style={{ width: 125, height: 125 }} />
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              flex: 2,
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 26 }]}>EAGLEGREEN</Text>
            <Text style={[styles.textHeader, { fontSize: 26 }]}>COMPANY RULES</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: 10,
            width: '95%',
            marginTop: 15,
          }}
        >
          <View
            style={{
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 20,
              fontFamily: 'Roboto-Regular',
            }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', lineHeight: 0.8 }}>
              Eaglegreen employees are required to familiarize themselves with the Health and Safety
              rules and Company rules and procedures.
            </Text>

            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '95%',
              }}
            >
              <BulletList
                gap={2}
                content={
                  <Text>
                    Employees working on the road must ensure PPE (personal protective equipment) is
                    worn at all times. Failure to do so will result in a verbal written warning.
                  </Text>
                }
              />
              <BulletList gap={2} content={<Text>PPE consists of</Text>} />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  paddingLeft: 15,
                  gap: 0,
                }}
              >
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Hard Hat (Orange/Yellow)
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Ankle Bands
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Wrist Bands
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Vest
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Paddle
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Safety Steel Boots
                    </Text>
                  }
                />
              </View>

              <BulletList
                gap={2}
                content={
                  <Text>Bullying and Harassment are strongly prohibited at Eaglegreen.</Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    Employees are not permitted to use any electronic devices or headsets while
                    working on the road. In cases of emergency, speak to LCT & Foremen and step
                    aside, where you or others are not in danger.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={<Text>LCTs are responsible for the tidiness of their trucks</Text>}
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    Any unauthorized driving and fuel charges are subject to verbal warnings and
                    deductions.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    LCTs are to understand other Eaglegreen employees may use their company trucks
                    for breaks or a place to store personal belongings in times where needed.
                    Working on the road has its challenges and working together, and ensuring each
                    other`s wellbeing is important.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    LCTs need to ensure all set-ups are as per MOT Manual set-ups as it`s a
                    government requirement.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    Employees are responsible for reporting all incidents or near-miss incidents to
                    the office and supervisors.
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Keep their work areas clean and tidy, free of hazards that could cause slips,
                    trips, or falls.
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Co-operate fully with any investigations regarding Health & Safety carried out
                    by EG
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Immediately address all identified or potential hazards. Where this is not
                    possible, they must report the situation to their field supervisor or dispatch.
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Right to refuse work - stop any work activity where an unsafe working condition
                    is identified and ensure that this is corrected before work is allowed to
                    restart. Any such action shall be reported to the office and supervisors.
                  </Text>
                }
              />
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 25,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              EMPLOYEE
            </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SUPERVISOR
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 25,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SAFETY MANAGER
            </Text>
          </View>
        </View>
      </Page>

      {/* Motive Cameras page */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { width: '100%' }]}>
          <View style={[{ flex: 1 }]}>
            <Image src="/logo/eaglegreen-single.png" style={{ width: 125, height: 125 }} />
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              flex: 2,
            }}
          >
            <Text style={[styles.textHeader, { fontSize: 26 }]}>MOTIVE CAMERAS</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 15,
            width: '95%',
            marginTop: 15,
            fontFamily: 'Roboto-Regular',
            fontSize: 11,
          }}
        >
          <Text style={{ lineHeight: 0.8 }}>
            Eaglegreen has installed new MotiveCameras to ensure the safety of all of our staff.
          </Text>
          <Text style={{ lineHeight: 0.8 }}>
            Motivecameras is to protect our business with accurate, real-time driver coaching and
            accident detection, on-the-spot exoneration evidence, and privacy protection.
          </Text>
          <Text style={{ lineHeight: 0.8 }}>
            Motive`s AI detects unsafe behaviors like cell phone use and close following with fewer
            false positives, alerting drivers in real-time. That means fewer accidents for the
            safety of our staff.
          </Text>
          <Text style={{ lineHeight: 0.8 }}>
            Advanced collision detection alerts managers of accidents with leading accuracy and
            speed. Motive`s latest model excels at catching severe collisions, such as jack-knifes
            and rollovers, enabling managers to quickly help drivers and kick off the insurance
            process
          </Text>
          <Text style={{ lineHeight: 0.8 }}>
            As stated in the hiring package, the purpose of this policy is to ensure all employees
            understand the acceptable usage of GPS and the information provided by it.
          </Text>
          <Text style={{ lineHeight: 0.8 }}>
            While GPS information will be used on a daily basis and reviewed on a continuous basis
            it will not be used for the following reasons:
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '95%',
            }}
          >
            <BulletList
              gap={2}
              content={
                <Text>
                  To track employee movement on an ongoing basis unless related to operational
                  requirements.
                </Text>
              }
            />
            <BulletList
              gap={2}
              content={
                <Text>To monitor the ongoing usage of our leadership group`s off hours.</Text>
              }
            />
            <BulletList
              gap={2}
              content={
                <Text>
                  To terminate or discipline an employee due to information obtained solely from
                  GPS.
                </Text>
              }
            />
          </View>

          <Text
            style={{
              lineHeight: 0.8,
              backgroundColor: 'yellow',
              padding: 5,
              fontFamily: 'Roboto-Bold',
            }}
          >
            As per new company rules, Motive cameras are not to be covered for any reason. HD video
            footage may be your only eyewitness when in an accident. Eaglegreen will use dashcam
            video to prove innocence and defend against litigation. Eaglegreen only has access to
            video footage when requested for safety purposes.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 40,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              EMPLOYEE
            </Text>
          </View>

          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SUPERVISOR
            </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 25,
          }}
        >
          <View
            style={{
              borderTop: '1px',
              padding: '5px 15px',
              width: '200px',
              display: 'flex',
              alignItems: 'center',
              borderColor: 'black',
            }}
          >
            <Text style={{ fontSize: 10, color: 'black', fontFamily: 'Roboto-Bold' }}>
              SAFETY MANAGER
            </Text>
          </View>
        </View>
      </Page>

      {/* Personal Tax Credits Return  page 1*/}
      <Page size="A4" style={[styles.page, { position: 'relative' }]}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
            }}
          >
            <Image src="/pdf/personal-tax-return-logo.png" style={{ width: 30, height: 25 }} />
            <Text style={{ fontSize: 8, width: 65 }}>Canada Revenue Agency</Text>
            <Text style={{ fontSize: 8, width: 65 }}>Agence de revenu du Canada</Text>
          </View>

          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Bold', textAlign: 'center' }}>
              2025 Personal Tax Credit Return
            </Text>
          </View>

          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '120px',
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed{' '}
            </Text>
            <Text>TD1 </Text>
          </View>
        </View>

        <View style={{ width: '100%', fontSize: 9, fontFamily: 'Roboto-Regular' }}>
          <Text style={{ fontFamily: 'Roboto-Bold' }}>
            Read page 2 before filling out this form. Your employer or payer will use this form to
            determine the amount of your tax deductions.
          </Text>
          <Text>Fill out this form based on the best estimate of your circumstances.</Text>
          <Text>
            If you do not fill out this form, your tax deductions will only include the basic
            personal amount, estimated by your employer or payer based on the income they pay you.
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            border: '1px',
            borderColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingBottom: '30px',
          }}
        >
          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              fontSize: 8.5,
              height: 25,
              borderBottom: '1px',
              borderColor: '#000',
            }}
          >
            <View style={{ borderRight: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Last name</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '100px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>First name and initial(s)</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '120px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Date of birth (YYYY/MM/DD)</Text>
            </View>
            <View style={{ width: '150px' }}>
              <Text style={{ padding: '0 5px' }}>Employee Number</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              fontSize: 8.5,
              height: 30,
              borderBottom: '1px',
              borderColor: '#000',
            }}
          >
            <View style={{ borderRight: '1px', borderColor: '#000', flex: 2, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Address</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '70px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Postal Code</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '130px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>For non-residents only</Text>
              <Text style={{ padding: '0 5px' }}>Country of permanent residence</Text>
            </View>
            <View style={{ width: '120px', height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Social insurance number</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>1. Basic personal amount</Text> – Every
                resident of Canada can enter a basic personal amount of $16,129. However, if your
                net income from all sources will be greater than $177,882 and you enter $16,129, you
                may have an amount owing on your income tax and benefit return at the end of the tax
                year. If your income from all sources will be greater than $177,882 you have the
                option to calculate a partial claim. To do so, fill in the appropriate section of
                Form TD1-WS, Worksheet for the 2025 Personal Tax Credits Return, and enter the
                calculated amount here.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  2. Canada caregiver amount for infirm children under age 18
                </Text>
                – Only one parent may claim $2,687 for each infirm child born in 2008 or later who
                lives with both parents throughout the year. If the child does not live with both
                parents throughout the year, the parent who has the right to claim the “Amount for
                an eligible dependant” on line 8 may also claim the Canada caregiver amount for the
                child.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>3. Age amount</Text>– If you will be 65
                or older on December 31, 2025, and your net income for the year from all sources
                will be $45,522 or less, enter $9,028. You may enter a partial amount if your net
                income for the year will be between $45,522 and $105,709. To calculate a partial
                amount, fill out the line 3 section of Form TD1-WS.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>4. Pension income amount</Text>– If you
                will receive regular pension payments from a pension plan or fund (not including
                Canada Pension Plan, Quebec Pension Plan, old age security, or guaranteed income
                supplement payments), enter whichever is less: $2,000 or your estimated annual
                pension income.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  5. Tuition (full-time and part-time)
                </Text>
                – Fill in this section if you are a student at a university or college, or an
                educational institution certified by Employment and Social Development Canada, and
                you will pay more than $100 per institution in tuition fees. Enter the total tuition
                fees that you will pay if you are a full-time or part-time student.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>6. Disability amount</Text>– If you will
                claim the disability amount on your income tax and benefit return by using Form
                T2201, Disability Tax Credit Certificate, enter $10,138.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  7. Spouse or common-law partner amount
                </Text>
                – Enter the difference between the amount on line 1 (line 1 plus $2,687 if your
                spouse or common-law partner is infirm) and your spouse`s or common-law partner`s
                estimated net income for the year if two of the following conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You are supporting your spouse or common-law partner who lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • Your spouse or common-law partner`s net income for the year will be less than the
                amount on line 1 (line 1 plus $2,687 if your spouse or common-law partner is infirm)
              </Text>
              <Text>
                In all cases, go to line 9 if your spouse or common-law partner is infirm and has a
                net income for the year of $28,798 or less.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  8. Amount for an eligible dependant
                </Text>
                – Enter the difference between the amount on line 1 (line 1 plus $2,687 if your
                eligible dependant is infirm) and your eligible dependant’s estimated net income for
                the year if all of the following conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You do not have a spouse or common-law partner, or you have a spouse or common-law
                partner who does not live with you and who you are not supporting or being supported
                by
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You are supporting the dependant who is related to you and lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • The dependant’s net income for the year will be less than the amount on line 1
                (line 1 plus $2,687 if your dependant is infirm)
              </Text>
              <Text>
                In all cases, go to line 9 if your dependant is 18 years or older, infirm, and has a
                net income for the year of $28,798 or less.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  9. Canada caregiver amount for eligible dependant or spouse or common-law partner
                </Text>
                – Fill out this section if, at any time in the year, you support an infirm eligible
                dependant (aged 18 or older) or an infirm spouse or common-law partner whose net
                income for the year will be $28,798 or less. To calculate this amount you may enter
                here, fill out the line 9 section of Form TD1-WS.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  10. Canada caregiver amount for dependant(s) age 18 or older
                </Text>
                – If, at any time in the year, you support an infirm dependant age 18 or older
                (other than the spouse or common-law partner or eligible dependant you claimed an
                amount on line 9 or could have claimed an amount for if their net income were under
                $18,816) whose net income for the year is $8,601, or may enter a partial amount if
                their net income for the year is between $20,197 and $28,798. To calculate a partial
                amount, fill out the line 10 section of Form TD1-WS. This worksheet may also be used
                to calculate your part of the amount if you are sharing it with another caregiver
                who supports the same dependant. You may claim this amount for more than one infirm
                dependant age 18 or older.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  11. Amounts transferred from your spouse or common-law partner
                </Text>
                – If your spouse or common-law partner will not use all of their age amount, pension
                income amount, tuition amount, or disability amount on their income tax and benefit
                return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  12. Amounts transferred from a dependant
                </Text>
                – If your dependant will not use all of their disability amount on their income tax
                and benefit return, enter the unused amount. If your or your spouse’s or common-law
                partner’s dependant child or grandchild will not use all of their tuition amount on
                their income tax and benefit return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 8.5,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>13. TOTAL CLAIM AMOUNT</Text>– Add lines
                1 to 12. Your employer or payer will use this amount to determine the amount of your
                tax deductions.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            position: 'absolute',
            bottom: 10,
            padding: '10px 25px',
            fontSize: 8.5,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text> TD1 E (25)</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text> (Ce formulaire est disponible en francais)</Text>
          </View>

          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              gap: 15,
            }}
          >
            <Text> Page 1 of 2 </Text>
            <Image src="/pdf/canada-tax-logo.png" style={{ width: 80, height: 25 }} />
          </View>
        </View>
      </Page>

      {/* Personal Tax Credits Return  Page 2*/}
      <Page size="A4" style={[styles.page, { position: 'relative' }]}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 5,
          }}
        >
          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed
            </Text>
          </View>
        </View>
        <View
          style={{
            width: '100%',
            border: '1px',
            borderColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Filling out Form TD1</Text>
              </Text>
              <Text>Fill out this form only if any of the following apply:</Text>
              <Text style={{ paddingLeft: 10 }}>
                • You have a new employer or payer, and you will receive salary, wages, commissions,
                pensions, employment insurance benefits, or any other remuneration
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You want to change the amounts you previously claimed (for example, the number of
                your eligible dependants has changed)
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You want to claim the deduction for living in a prescribed zone
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You want to increase the amount of tax deducted at source
              </Text>
              <Text>Sign and date it, and give it to your employer or payer.</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View
              style={{
                width: '100%',
              }}
            >
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  More than one employer or payer at the same time
                </Text>
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    If you have more than one employer or payer at the same time and you have
                    already claimed personal tax credit amounts on another Form TD1 for 2025, you
                    cannot claim them again. If your total income from all sources will be more than
                    the personal tax credits you claimed on another Form TD1, check this box, enter
                    “0” on Line 13 and do not fill in Lines 2 to 12.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3x 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Total income is less than the total claim amount
                </Text>
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    Tick this box if your total income for the year from all employers and payers
                    will be less than your total claim amount on line 13. Your employer or payer
                    will not deduct tax from your earnings.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  For non-resident only (Tick the box that applies to you.)
                </Text>
              </Text>
              <Text>
                As a non-resident, will 90% or more of your world income be included in determining
                your taxable income earned in Canada in 2025?
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>Yes (Fill out the previous page.)</Text>
                </View>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    No (Enter “0” on line 13, and do not fill in lines 2 to 12 as you are not
                    entitled to the personal tax credits.)
                  </Text>
                </View>
              </View>
              <Text>
                Call the international tax and non-resident enquiries line at **1-800-959-8281** if
                you are unsure of your residency status.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Provincial or territorial personal tax credits return
                </Text>
              </Text>
              <Text>
                You also have to fill out a provincial or territorial TD1 form if your claim amount
                on line 13 is more than <Text style={{ fontFamily: 'Roboto-Bold' }}>$16,129</Text>.
                Use the Form TD1 for your province or territory of employment if you are an
                employee. Use the Form TD1 for your province or territory of residence if you are a
                pensioner. Your employer or payer will use both this federal form and your most
                recent provincial or territorial Form TD1 to determine the amount of your tax
                deductions.
              </Text>
              <Text style={{ marginTop: 10 }}>
                Your employer or payer will deduct provincial or territorial taxes after allowing
                the provincial or territorial basic personal amount if you are claiming the basic
                personal amount only.
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Note:</Text> You may be able to claim
                the child amount on Form TD1SK, 2025 Saskatchewan Personal Tax Credits Return if you
                are a Saskatchewan resident supporting children under 18 at any time during 2025.
                Therefore, you may want to fill out Form TD1SK even if you are only claiming the
                basic personal amount on this form.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Deduction for living in a prescribed zone
                </Text>
              </Text>
              <Text>
                You may claim any of the following amounts if you live in the Northwest Territories,
                Nunavut, Yukon, or another prescribed{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>northern zone</Text> for more than six
                months in a row beginning or ending in 2025:
              </Text>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <View style={{ flex: 2 }}>
                  <Text style={{ paddingLeft: 10 }}>
                    • <Text style={{ fontFamily: 'Roboto-Bold' }}>$11.00</Text> for each day that
                    you live in the prescribed northern zone
                  </Text>
                  <Text style={{ paddingLeft: 10 }}>
                    • <Text style={{ fontFamily: 'Roboto-Bold' }}>$22.00</Text> for each day that
                    you live in the prescribed northern zone if, during that time, you live in a
                    dwelling that you maintain, and you are the only person living in that dwelling
                    who is claiming this deduction
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      width: '90px',
                      border: '1px',
                      borderColor: '#000',
                      padding: '5px',
                      height: '25px',
                    }}
                  >
                    <Text>$</Text>
                  </View>
                </View>
              </View>
              <Text>
                Employees living in a prescribed **intermediate zone** may claim 50% of the total of
                the above amounts.
              </Text>
              <Text>
                For more information, go to{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  canada.ca/taxes-northern-residents
                </Text>
                .
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Additional tax to be deducted</Text>
              </Text>
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <View style={{ flex: 4 }}>
                  <Text>
                    You may want to have more tax deducted from each payment if you receive other
                    income such as non-employment income from CPP or QPP benefits, or old age
                    security pension. You may have less tax to pay when you file your income tax and
                    benefit return by doing this. Enter the additional amount you want deducted from
                    each payment to choose this option. You may fill out a new Form TD1 to change
                    this deduction later.
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      width: '90px',
                      border: '1px',
                      borderColor: '#000',
                      padding: '5px',
                      height: '25px',
                    }}
                  >
                    <Text>$</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Reduction in tax deductions</Text>
              </Text>
              <Text>
                You may ask to have less tax deducted at source if you are eligible for deductions
                or non-refundable tax credits that are not listed on this form (for example,
                periodic contributions to a registered retirement savings plan (RRSP), child care or
                employment expenses, charitable donations, and tuition and education amounts carried
                forward from the previous year). To make this request, fill out Form{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>T1213</Text>, Request to Reduce Tax
                Deductions at Source, to get a letter of authority from your tax services office.
                Give the letter of authority to your employer or payer. You do not need a letter of
                authority if your employer deducts RRSP contributions from your salary.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Forms and publications</Text>
              </Text>
              <Text>
                To get our forms and publications, go to{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>canada.ca/cra-forms-publications</Text>{' '}
                or call <Text style={{ fontFamily: 'Roboto-Bold' }}>1-800-959-5525</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 8 }}>
          Personal information (including the SIN) is collected and used to administer or enforce
          the Income Tax Act and related programs and activities including administering tax,
          benefits, audit, compliance, and collection. The information collected may be disclosed to
          other federal, provincial, territorial, aboriginal or foreign government institutions to
          the extent authorized by law. Failure to provide this information may result in paying
          interest or penalties, or in other actions. Under the Privacy Act, individuals have a
          right of protection, access to and correction of their personal information, and to file a
          complaint with the Privacy Commissioner of Canada regarding the handling of their personal
          information. Refer to Personal Information Bank CRA PPU 120 on Info Source at
          <Text style={{ fontFamily: 'Roboto-Bold' }}> canada.ca/cra-info-source</Text>.
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 5,
            border: '1px',
            borderColor: '#000',
            fontSize: 9,
            width: '100%',
            padding: 5,
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Bold' }}>Certification</Text>
          <Text>I certify that the information given on this form is correct and complete.</Text>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 5,
              marginTop: 10,
            }}
          >
            <Text style={{ width: '50px' }}>Signature</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                flex: 2,
              }}
            >
              <Text style={{ borderBottom: '1px', width: '100%' }}> </Text>
              <Text style={{ width: '100%', textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
                It is a serious offence to make a false return.
              </Text>
            </View>
            <Text style={{ width: '20px' }}>Date</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}
            >
              <Text style={{ borderBottom: '1px', width: '100%' }}> </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            position: 'absolute',
            bottom: 10,
            padding: '10px 25px',
          }}
        >
          <View style={{ flex: 1, fontSize: 8, textAlign: 'left' }}>
            <Text> TD1 E (25)</Text>
          </View>

          <View style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>
            <Text>Page 2 of 2</Text>
          </View>
        </View>
      </Page>

      {/* Personal British Columbia Tax Credits Return  page 1 */}
      <Page size="A4" style={[styles.page, { position: 'relative' }]}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
            }}
          >
            <Image src="/pdf/british-columbia-logo.png" style={{ width: 100, height: 30 }} />
          </View>

          <View
            style={{
              width: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Bold', textAlign: 'center' }}>
              2025 British Columbia
            </Text>

            <Text style={{ fontSize: 11, fontFamily: 'Roboto-Bold', textAlign: 'center' }}>
              Personal Tax Credits Return
            </Text>
          </View>

          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              flex: 1,
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed
            </Text>
            <Text>TD1 </Text>
          </View>
        </View>

        <View style={{ width: '100%' }}>
          <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 9 }}>
            Read page 2 before filling out this form. Your employer or payer will use this form to
            determine the amount of your tax deductions.
          </Text>
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: 9 }}>
            Fill out this form based on the best estimate of your circumstances.
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            border: '1px',
            borderColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingBottom: '50px',
          }}
        >
          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              fontSize: 9,
              height: 25,
              borderBottom: '1px',
              borderColor: '#000',
            }}
          >
            <View style={{ borderRight: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Last name</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '100px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>First name and initial(s)</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '120px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Date of birth (YYYY/MM/DD)</Text>
            </View>
            <View style={{ width: '150px' }}>
              <Text style={{ padding: '0 5px' }}>Employee Number</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              fontSize: 9,
              height: 30,
              borderBottom: '1px',
              borderColor: '#000',
            }}
          >
            <View style={{ borderRight: '1px', borderColor: '#000', flex: 2, height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Address</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '70px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>Postal Code</Text>
            </View>
            <View
              style={{ borderRight: '1px', borderColor: '#000', width: '130px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}>For non-residents only</Text>
              <Text style={{ padding: '0 5px' }}>Country of permanent residence</Text>
            </View>
            <View style={{ width: '120px', height: '100%' }}>
              <Text style={{ padding: '0 5px' }}>Social insurance number</Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>1. Basic personal amount</Text> – Every
                person employed in British Columbia and every pensioner residing in British Columbia
                can claim this amount. If you will have more than one employer or payer at the same
                time in 2025, see “More than one employer or payer at the same time” on page 2.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>2. Age amount</Text>– If you will be 65
                or older on December 31, 2025, and your net income will be $43,169 or less, enter
                $5,799. You may enter a partial amount if your net income for the year will be
                between $43,169 and $81,829. To calculate a partial amount, fill out the line 2
                section of Form TD1BC-WS, Worksheet for the 2025 British Columbia Personal Tax
                Credits Return
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>3. Pension income amount</Text>– If you
                will receive regular pension payments from a pension plan or fund (not including
                Canada Pension Plan, Quebec Pension Plan, old age security, or guaranteed income
                supplement payments), enter whichever is less: $1,000 or your estimated annual
                pension.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  4. Tuition (full-time and part-time)
                </Text>
                – Fill out this section if you are a student at a university, college, or
                educational institution certified by Employment and Social Development Canada, and
                you will pay more than $100 per institution in tuition fees. Enter your total
                tuition fees that you will pay less your Canada Training Credit if you are a
                full-time or part-time student.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>5. Disability amount</Text>– If you will
                claim the disability amount on your income tax and benefit return by using Form
                T2201, Disability Tax Credit Certificate, enter $9,699.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  6. Spouse or common-law partner amount
                </Text>
                – Enter $11,073 if you are supporting your spouse or common-law partner and both of
                the following conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • Your spouse or common-law partner lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • Your spouse or common-law partner has a net income of $1,108 or less for the year
              </Text>
              <Text>
                You may enter a partial amount if your spouse`s or common-law partner`s net income
                for the year will be between $1,108 and $12,181. To calculate a partial amount, fill
                out the line 6 section of Form TD1BC-WS.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  7. Amount for an eligible dependant
                </Text>
                – Enter $11,073 if you are supporting an eligible dependant and all of the following
                conditions apply:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • You do not have a spouse or common-law partner, or you have a spouse or common-law
                partner who does not live with you and who you are not supporting or being supported
                by
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • The dependant is related to you and lives with you
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • The dependant has a net income of $1,108 or less for the year
              </Text>
              <Text>
                You may enter a partial amount if the eligible dependant’s net income for the year
                will be between $1,108 and $12,181. To calculate a partial amount, fill out the line
                7 section of Form TD1BC-WS.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  8. British Columbia caregiver amount
                </Text>
                – You may claim this amount if you are supporting your infirm spouse or common-law
                partner, or an infirm eligible dependant (age 18 or older) who is your or your
                spouse`s or common-law partner`s:
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • child or grandchild (including those of your spouse or common-law partner)
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • parent, grandparent, brother, sister, uncle, aunt, niece, or nephew who resides in
                Canada at any time in the year (including those of your spouse or common-law
                partner)
              </Text>
              <Text>
                The infirm person`s net income for the year must be less than $24,810. To calculate
                this amount, fill out the line 8 section of Form TD1BC-WS.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  9. Amounts transferred from your spouse or common-law partner
                </Text>
                – If your spouse or common-law partner will not use all of their age amount, pension
                income amount, tuition amount, or disability amount on their income tax and benefit
                return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  10. Amounts transferred from a dependant
                </Text>
                – If your dependant will not use all of their disability amount on their income tax
                and benefit return, enter the unused amount. If your spouse’s or common-law
                partner’s dependent child or grandchild will not use all of their tuition amount on
                their income tax and benefit return, enter the unused amount.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              fontSize: 9,
              padding: '0 5px',
              gap: 10,
            }}
          >
            <View style={{ borderBottom: '1px', borderColor: '#000', flex: 1, height: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>11. TOTAL CLAIM AMOUNT</Text>– Add lines
                1 to 10. Your employer or payer will use this amount to determine the amount of your
                provincial tax deductions.
              </Text>
            </View>
            <View
              style={{ borderBottom: '1px', borderColor: '#000', width: '80px', height: '100%' }}
            >
              <Text style={{ padding: '0 5px' }}> </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            position: 'absolute',
            bottom: 10,
            padding: '10px 25px',
          }}
        >
          <View style={{ flex: 1, fontSize: 8 }}>
            <Text> TD1 E (25)</Text>
          </View>

          <View style={{ flex: 1, fontSize: 8 }}>
            <Text> (Ce formulaire est disponible en francais)</Text>
          </View>

          <View
            style={{
              flex: 1,
              fontSize: 8,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              gap: 15,
            }}
          >
            <Text> Page 1 of 2 </Text>
            <Image src="/pdf/canada-tax-logo.png" style={{ width: 80, height: 25 }} />
          </View>
        </View>
      </Page>

      {/* Personal British Columbia Tax Credits Return  page 2 */}
      <Page size="A4" style={[styles.page, { position: 'relative' }]}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 5,
          }}
        >
          <View
            style={{
              fontSize: 9,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            <Text>
              <Text style={{ fontFamily: 'Roboto-Bold' }}>Protected B</Text> when completed
            </Text>
          </View>
        </View>
        <View
          style={{
            width: '100%',
            border: '1px',
            borderColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '10px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Filling out Form TD1BC</Text>
              </Text>
              <Text>Fill out this form only if any of the following apply:</Text>
              <Text style={{ paddingLeft: 10 }}>
                • you have a new employer or payer, and you will receive salary, wages, commissions,
                pensions, employment insurance benefits, or any other remuneration
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • you want to change the amounts you previously claimed (for example, the number of
                your eligible dependants has changed)
              </Text>
              <Text style={{ paddingLeft: 10 }}>
                • you want to increase the amount of tax deducted at source
              </Text>
              <Text>Sign and date it, and give it to your employer or payer.</Text>
              <Text>
                If you do not fill out Form TD1BC, your employer or payer will deduct taxes after
                allowing the basic personal amount only.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
            }}
          >
            <View
              style={{
                width: '100%',
              }}
            >
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  More than one employer or payer at the same time
                </Text>
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    If you have more than one employer or payer at the same time and you have
                    already claimed personal tax credit amounts on another Form TD1BC for 2025, you
                    cannot claim them again. If your total income from all sources will be more than
                    the personal tax credits you claimed on another Form TD1BC, check this box,
                    enter “0” on line 11 and do not fill in lines 2 to 10.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3x 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>
                  Total income is less than the total claim amount
                </Text>
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 5,
                  width: '100%',
                }}
              >
                <View style={{ width: '20px' }}>
                  <Checkbox />
                </View>

                <View style={{ flex: 1 }}>
                  <Text>
                    Tick this box if your total income for the year from all employers and payers
                    will be less than your total claim amount on line 11. Your employer or payer
                    will not deduct tax from your earnings.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Additional tax to be deducted</Text>
              </Text>
              <Text>
                If you want to have more tax deducted at source, fill out section{' '}
                <Text style={{ fontFamily: 'Roboto-Bold' }}>“Additional tax to be deducted”</Text>{' '}
                on the federal Form TD1.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 8,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Reduction in tax deductions</Text>
              </Text>
              <Text>
                You may ask to have less tax deducted at source if you are eligible for deductions
                or non-refundable tax credits that are not listed on this form (for example,
                periodic contributions to a registered retirement savings plan (RRSP), child care or
                employment expenses, charitable donations, and tuition and education amounts carried
                forward from the previous year). To make this request, fill out Form T1213, Request
                to Reduce Tax Deductions at Source, to get a letter of authority from your tax
                services office. Give the letter of authority to your employer or payer. You do not
                need a letter of authority if your employer deducts RRSP contributions from your
                salary.
              </Text>
            </View>
          </View>

          <View
            style={{
              width: '100%',
              fontSize: 9,
              padding: '3px 5px',
            }}
          >
            <View style={{ width: '100%' }}>
              <Text>
                <Text style={{ fontFamily: 'Roboto-Bold' }}>Forms and publications</Text>
              </Text>
              <Text>
                To get our forms and publications, go to
                <Text
                  style={{ fontFamily: 'Roboto-Bold', textDecoration: 'underline', color: 'blue' }}
                >
                  canada.ca/cra-forms-publications
                </Text>
                or call <Text style={{ fontFamily: 'Roboto-Bold' }}>1-800-959-5525</Text>
              </Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 9 }}>
          Personal information (including the SIN) is collected and used to administer or enforce
          the Income Tax Act and related programs and activities including administering tax,
          benefits, audit, compliance, and collection. The information collected may be disclosed to
          other federal, provincial, territorial, aboriginal or foreign government institutions to
          the extent authorized by law. Failure to provide this information may result in paying
          interest or penalties, or in other actions. Under the Privacy Act, individuals have a
          right of protection, access to and correction of their personal information, and to file a
          complaint with the Privacy Commissioner of Canada regarding the handling of their personal
          information. Refer to Personal Information Bank CRA PPU 120 on Info Source at
          <Text style={{ fontFamily: 'Roboto-Bold', textDecoration: 'underline', color: 'blue' }}>
            {' '}
            canada.ca/cra-info-source
          </Text>
          .
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 5,
            border: '1px',
            borderColor: '#000',
            fontSize: 9,
            width: '100%',
            padding: 5,
          }}
        >
          <Text style={{ fontFamily: 'Roboto-Bold' }}>Certification</Text>
          <Text>I certify that the information given on this form is correct and complete.</Text>

          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 5,
              marginTop: 10,
            }}
          >
            <Text style={{ width: '50px' }}>Signature</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                flex: 2,
              }}
            >
              <Text style={{ borderBottom: '1px', width: '100%' }}> </Text>
              <Text style={{ width: '100%', textAlign: 'center', fontFamily: 'Roboto-Bold' }}>
                It is a serious offence to make a false return.
              </Text>
            </View>
            <Text style={{ width: '20px' }}>Date</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}
            >
              <Text style={{ borderBottom: '1px', width: '100%' }}> </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            width: '100%',
            position: 'absolute',
            bottom: 10,
            padding: '10px 25px',
          }}
        >
          <View style={{ flex: 1, fontSize: 8, textAlign: 'left' }}>
            <Text> TD1 E (25)</Text>
          </View>

          <View style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>
            <Text>Page 2 of 2</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
