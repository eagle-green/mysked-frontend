import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { NewHire } from 'src/types/new-hire';

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

export function CompanyPolicyGen003Page({ data }: Props) {
  const dateNow = dayjs().format('MM/DD/YYYY');

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
    <>
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
                <Text
                  style={{ fontSize: 10, fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}
                >{`${data.employee.first_name} ${data.employee.last_name}`}</Text>
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
                <Image
                  src={data.employee.signature as string}
                  style={{
                    maxWidth: 70,
                    maxHeight: 70,
                    objectFit: 'contain',
                  }}
                />
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
        </View>
      </Page>
    </>
  );
}
