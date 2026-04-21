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

export function CompanyPolicy704Page({ data }: Props) {
  const dateNow = formatDateUsSlash();
  const employeeSig704 = employeePolicySignature(data, 'company_hr_policies_704');
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
              {hasPdfImageSrc(employeeSig704) ? (
                <Image
                  src={employeeSig704}
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
