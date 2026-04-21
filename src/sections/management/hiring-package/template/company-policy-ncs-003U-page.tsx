import type { NewHire } from 'src/types/new-hire';

import { TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { hasPdfImageSrc } from 'src/utils/safe-pdf-image-src';
import { employeePolicySignature } from 'src/utils/policy-agreement-signature';
import {
  formatDateUsSlash,
  formatPolicyAcknowledgementEmployeeName,
} from 'src/utils/format-pdf-display';

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
  bold: {
    fontFamily: 'Roboto-Bold',
  },
  bulletPoint: {
    fontSize: 22,
    width: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
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
});

type Props = {
  data: NewHire;
};

type PolicyHeaderType = {
  PolicyNo: string;
  title: string;
  subjectArea: string;
  RevNo: string;
  pageNumber: number;
  pages?: number;
};

export function CompanyPolicyNCS003UPage({ data }: Props) {
  const dateNow = formatDateUsSlash();
  const employeeSigNcs003u = employeePolicySignature(data, 'company_fleet_policies_ncs_003u');
  const employeeNameLine = formatPolicyAcknowledgementEmployeeName(
    data.employee.first_name,
    data.employee.last_name
  );

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
          <TD
            weighting={0.2}
            style={{
              padding: '5px',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }} wrap={false}>
              Policy No:
            </Text>
          </TD>
          <TD
            weighting={0.45}
            style={{
              padding: '5px',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }} wrap>
              {PolicyNo}
            </Text>
          </TD>
          <TD
            weighting={0.35}
            style={{
              padding: '5px',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>
              Originated By: Employee Services
            </Text>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>Date:</Text>
          </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { minHeight: 36, fontSize: 10 }]}>
          <TD
            weighting={0.2}
            style={{
              padding: '5px',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }} wrap={false}>
              TITLE:
            </Text>
          </TD>
          <TD
            weighting={0.42}
            style={{
              padding: '5px',
              paddingLeft: 22,
              paddingRight: 6,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <View style={{ width: '100%', paddingLeft: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }} wrap>
                {title}
              </Text>
            </View>
          </TD>
          <TD weighting={0.38} style={{ padding: '5px' }}>
            <Text> </Text>
          </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { minHeight: 44, fontSize: 10 }]}>
          <TD
            weighting={0.24}
            style={{
              padding: '5px',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }} wrap={false}>
              Subject Area:
            </Text>
          </TD>
          <TD
            weighting={0.28}
            style={{
              padding: '5px',
              paddingLeft: 22,
              paddingRight: 6,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <View style={{ width: '100%', paddingLeft: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }} wrap>
                {subjectArea}
              </Text>
            </View>
          </TD>
          <TD
            weighting={0.48}
            style={{
              padding: '5px',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>
              Reviewed By: Senior Leadership Operations Date: Jan 1, 2023
            </Text>
          </TD>
        </TH>
        <TH style={[styles.tableHeader, styles.bold, { minHeight: 36, fontSize: 10 }]}>
          <TD
            weighting={0.14}
            style={{
              padding: '5px',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }} wrap={false}>
              Rev. No:
            </Text>
          </TD>
          <TD
            weighting={0.12}
            style={{
              padding: '5px',
              paddingLeft: 8,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }}>{RevNo}</Text>
          </TD>
          <TD
            weighting={0.12}
            style={{
              padding: '5px',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }} wrap={false}>
              DATE:
            </Text>
          </TD>
          <TD
            weighting={0.14}
            style={{
              padding: '5px',
              paddingLeft: 8,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 9 }}> </Text>
          </TD>
          <TD
            weighting={0.48}
            style={{
              padding: '5px',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>National Safety Code</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Roboto-Regular' }}>Requirement</Text>
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

  return (
    <>
      {/*  Policy EG-PO-FL-NCS-003U 1 out 4*/}
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

      {/*  Policy EG-PO-FL-NCS-003U 2 out 4*/}
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

      {/*  Policy EG-PO-FL-NCS-003U 3 out 4*/}
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

      {/*  Policy EG-PO-FL-NCS-003U 4 out 4*/}
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
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 20,
          }}
        >
          <View
            style={{
              width: '250px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                borderBottom: '1px',
                padding: '5px 15px',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'red',
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>{employeeNameLine}</Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold', color: 'red' }}>
              EMPLOYEE’S NAME
            </Text>
          </View>

          <View
            style={{
              width: '250px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                borderBottom: '1px',
                padding: '5px 15px',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'red',
              }}
            >
              {hasPdfImageSrc(employeeSigNcs003u) ? (
                <Image
                  src={employeeSigNcs003u}
                  style={{
                    maxWidth: 70,
                    maxHeight: 70,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <View style={{ minHeight: 28, width: '100%' }} />
              )}
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold', color: 'red' }}>
              EMPLOYEE’S SIGNATURE
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
            marginTop: 30,
          }}
        >
          <View
            style={{
              width: '250px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                borderBottom: '1px',
                padding: '5px 15px',
                width: '250px',
                display: 'flex',
                alignItems: 'center',
                borderColor: 'red',
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>{dateNow}</Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold', color: 'red' }}>DATE</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
