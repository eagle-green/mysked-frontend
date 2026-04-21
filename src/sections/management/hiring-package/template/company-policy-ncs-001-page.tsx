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

export function CompanyPolicyNCS001Page({ data }: Props) {
  const dateNow = formatDateUsSlash();
  const employeeSigNcs001 = employeePolicySignature(data, 'company_fleet_policies_ncs_001');
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
              {hasPdfImageSrc(employeeSigNcs001) ? (
                <Image
                  src={employeeSigNcs001}
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
