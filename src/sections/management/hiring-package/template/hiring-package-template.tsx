import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

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

export default function HiringPackagePdfTemplate() {
  const defaultBooleanValue = true;
  const Description = ({
    header,
    content,
    additionalContent,
  }: {
    header: string;
    content: string;
    additionalContent?: string;
  }) => (
    <View style={styles.content}>
      <Text style={styles.bold}>{header}</Text>
      <Text>{content}</Text>
      {additionalContent && <Text style={{ marginTop: 10 }}>{additionalContent}</Text>}
    </View>
  );

  const Signature = ({ position }: { position: string }) => (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
      }}
    >
      <View
        style={{
          borderTop: '1px',
          padding: '5px 15px',
          width: '250px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 10 }}>Printed Name of {position}</Text>
      </View>

      <View
        style={{
          borderTop: '1px',
          padding: '5px 15px',
          width: '250px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 10 }}>Signature of {position}</Text>
      </View>
    </View>
  );

  const Circle = ({ content, isShaded = false }: { content: string; isShaded?: boolean }) => (
    <View
      style={{
        marginTop: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <View style={[styles.circle, isShaded ? styles.filledCircle : styles.emptyCircle]} />
      <Text style={{ fontSize: 12 }}> {content}</Text>
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

  const BulletList = ({ content }: { content: React.ReactNode }) => (
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
      <Text style={[styles.bulletText, { fontSize: 11 }]}>{content}</Text>
    </View>
  );

  return (
    <Document>
      {/* Contract Detail Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={styles.header.detail}>
            <Text style={styles.textHeader}>Date: </Text>
            <Text style={styles.textHeader}>Name of Employee:</Text>
            <Text style={styles.textHeader}>
              Re:
              <Text style={styles.textNormal}> Offer of Employment with Eagle Green LLP</Text>{' '}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.textNormal}>
            We are pleased to offer you a position with Eagle Green as
          </Text>
        </View>

        <Description
          header="START DATE AND HOURS OF WORK."
          content="Your start date is _______________. The average work week is up to 50 hours per week, Monday to Friday. We also work some
          Saturdays during peak season (generally April to September). You agree that you will attempt to make yourself available to
          work on weekends. Please note we follow all applicable provincial legislation on pay for overtime work."
        />

        <Description
          header="PAY AND BENEFITS."
          content="Your hourly rate will be $__________ per hour, paid bi-weekly via direct deposit into your bank account. 
          Vacation: Your vacation pay is accrued as follows: for B.C. – 4%, for A.B. and S.K. 6% 
          Benefits: You are entitled to benefits once you have successfully completed 350 hours of work."
        />

        <Description
          header="PROBATIONARY PERIOD."
          content="Your first 180 working days are considered a probationary period. A written performance evaluation will be given to you after
          150 working days. This probation period is used to assess new employees and to determine suitability for long-term
          employment. Once you have passed probation, you will be considered a permanent member of Eagle Green LLP."
        />

        <Description
          header="TERMINATION OF EMPLOYMENT."
          content="If it is determined a fit does not exist for any reason during your probationary period, your employment may be terminated
          immediately by the company. After completion of your probationary period, both the employee and the Company must give
          notice in accordance with Provincial Employment Standards Legislation."
        />

        <Description
          header="PERSONAL INFORMATION."
          content="You consent to the Company or its agents collecting, using, disclosing, and retaining your personal information, including
          health information, for the purpose of managing and administering the employment relationship."
        />

        <Description
          header="POLICIES."
          content="As an employee of Eagle GreenLLP, you agree to abide by its values, policies, and guidelines both verbal and in documented
          form. If the policy is not clear, it is your responsibility to ask your supervisor for more information on clarification."
          additionalContent="All vehicles must be returned with all assigned equipment to the yard location designated by dispatch in clean working
          condition with all equipment. Vehicle Subject to cleaning fee and Pick up fee if not returned to the yard location provided or
          returned in a dirty manner. The cleaning Fee of $125 and the pick-up fee of $125 will be deducted from final pay. Other Fees
          regarding lost items are as follows: Key - $250 and Gas Card - $25"
        />

        <Description
          header="DRIVERS LICENSE."
          content="You agree to hold and maintain a valid driver's license for the duration of your employment and to produce an abstract when
          requested. You will agree to allow the company to acquire an abstract on your behalf, at its sole discretion."
        />

        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: '10' }}>
            Congratulations on your new role and thank you for investing your career with us.
          </Text>
          <Text style={{ fontSize: '10' }}>
            We look forward to a long and healthy working relationship with you.
          </Text>
          <Text style={[styles.bold, { fontSize: 10 }]}>Eagle Green LLP</Text>
        </View>

        <Signature position="Hiring Manager" />

        <Description
          header=""
          content="I hereby understand and accept the Company’s offer of employment and agree to the terms and conditions set out in this
          agreement."
        />

        <Signature position="Employee" />

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={[styles.bold, { fontSize: 10 }]}>
            Keep one copy for your own records and return the original to your supervisor.
          </Text>
        </View>
      </Page>

      {/* ADMIN PRE-HIRE & ONBOARDING DOCUMENTATION PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={styles.textHeader}>ADMIN PRE-HIRE & ONBOARDING</Text>
            <Text style={styles.textHeader}>DOCUMENTATION FOR BRITISH COLUMBIA</Text>
          </View>
        </View>

        <View style={{ display: 'flex', alignItems: 'flex-start', width: '90%' }}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              marginTop: 15,
            }}
          >
            <Text style={{ flex: 1, fontSize: 14 }}>Name:</Text>
            <Text style={{ flex: 1, fontSize: 14 }}>Position:</Text>
          </View>

          <View style={{ marginTop: 15 }}>
            <Circle
              content="Pre-Access Drug & Alcohol Test Completed and Passed"
              isShaded={defaultBooleanValue}
            />
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 15,
            }}
          >
            <Text style={[styles.bold, { fontSize: 12 }]}>Admin Onboard Documentation</Text>
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              marginTop: 15,
            }}
          >
            <Text style={[styles.textNormal, { fontSize: 12 }]}>
              All new hires must complete the following forms:
            </Text>
          </View>

          <View style={{ marginTop: 15 }}>
            <Circle content="Offer of Employment – Hiring Manager to complete" />
            <Circle content="Offer Letter – Non Union" />
            <Circle content="New Hire – Rehire Employee Form" />
            <Circle content="Employee Emergency/Consent Information Sheet" />
            <Circle content="Equipment Form" />
            <Circle content="Direct Deposit Authorization" />
            <Circle content="Federal TD1" />
            <Circle content="Provincial TD1" />
            <Circle content="Social Fund" />
            <Circle content="EG Health and Safety Manual" />
            <Circle content="Celebrate Diversity at - EG" />
            <Circle content="Vacation – Non-Union – Employee to Keep" />
            <Circle content="Handbook – Acknowledgment of Receipt" />
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 30,
            }}
          >
            <Text style={[styles.bold, { fontSize: 12 }]}>Admin Onboard Documentation</Text>
          </View>

          <Circle
            content="Fleet Forms – See requiredfleet documentation checklist"
            isShaded={defaultBooleanValue}
          />

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 10,
            }}
          >
            <Text style={[styles.bold, { fontSize: 12, color: 'red' }]}>
              Only To Be Completed If Employee Is Required To Use Company Vehicle
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: 30,
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
              <Text style={{ fontSize: 10 }}>Employee’s Signature</Text>
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
              <Text style={{ fontSize: 10 }}>Hiring Manager’s Signature</Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: 10,
            }}
          >
            <Text style={[styles.bold, { fontSize: 12, color: 'red' }]}>
              Please Complete & Submit with Complete Hire Package to Payroll
            </Text>
          </View>
        </View>
      </Page>

      {/* EMPLOYEE FORM PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>EMPLOYEE HIRE FORM</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                marginTop: 10,
              }}
            >
              <View
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Checkbox />
                <Text style={styles.textHeader}>NEW HIRE</Text>
              </View>
              <View
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Checkbox checked={defaultBooleanValue} />
                <Text style={styles.textHeader}>RE-HIRE</Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE PERSONAL INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>LAST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>FIRST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>MIDDLE INITIAL:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>SIN:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>BIRTHDATE (MM/DD/YY) </TD>
              <TD style={[{ flex: 1 }, styles.td]}>GENDER:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>ADDRESS:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>TOWN/CITY:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>PROVINCE:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>POSTAL CODE:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>HOME PHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>CELLPHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>PERSONAL EMAIL ADDRESS:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 2 }, styles.td]}>EMPLOYEE SIGNATURE:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>DATE:</TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE PERSONAL INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>DEPARTMENT:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>HOME COST CENTRE:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>JOB NUMBER:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '30px', padding: '5px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox />
                    <Text style={[styles.bold, { fontSize: 10 }]}>UNION</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={defaultBooleanValue} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>NON-UNION</Text>
                  </View>
                </View>
              </TD>
              <TD style={[{ flex: 2, height: '30px', padding: '5px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox />
                    <Text style={[styles.bold, { fontSize: 10 }]}>ER WK</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={defaultBooleanValue} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Full Time</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={defaultBooleanValue} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Part Time</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={defaultBooleanValue} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Casual</Text>
                  </View>
                  <View
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Checkbox checked={defaultBooleanValue} />
                    <Text style={[styles.bold, { fontSize: 10 }]}>Seasonal</Text>
                  </View>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[styles.td, { flex: 1, height: '50px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <Text>$ SALARY/WAGE: HR/WK</Text>
                  <Text>DIRECT LABOR: (UNION)</Text>
                </View>
              </TD>
              <TD style={[styles.td, { flex: 1, height: '50px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <View>
                    <Text>HRS P</Text>
                  </View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Checkbox />
                      <Text style={[styles.bold, { fontSize: 10 }]}>UNION</Text>
                    </View>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Checkbox checked={defaultBooleanValue} />
                      <Text style={[styles.bold, { fontSize: 10 }]}>NON-UNION</Text>
                    </View>
                  </View>
                </View>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, padding: '5px', height: '30px' }]}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Text>WAS THE NEW HIRED REFERRED?</Text>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Checkbox />
                    <Text>YES</Text>
                  </View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Checkbox checked={defaultBooleanValue} />
                    <Text>NO</Text>
                  </View>
                  <Text>REFERRED BY:</Text>
                </View>
              </TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>
            COMPLETE THIS SECTION FOR ADDITIONAL INFORMATION
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <View
            style={{
              borderBottom: '1px',
              padding: '15px 5px',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 10 }}>HIRING MGR/HR COMMENTS:</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>APPROVALS</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 15,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>SUPERINTENDENT </Text>
            <Text style={{ fontSize: 10 }}>(Signature Over Printed Name) - Date </Text>
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>AREA MANAGER </Text>
            <Text style={{ fontSize: 10 }}>(Signature Over Printed Name) - Date </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 15,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
              VP OPERATIONS/PRESIDENT{' '}
            </Text>
            <Text style={{ fontSize: 10 }}>(Signature Over Printed Name) - Date </Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>PAYROLL USE ONLY</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            fontSize: 10,
            width: '100%',
          }}
        >
          <Text>EMPLOYEE NUMBER:</Text>

          <Text>TAX SLIPS ON</Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Text>SOCIAL:</Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Checkbox />
              <Text>YES</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Checkbox checked={defaultBooleanValue} />
              <Text>NO</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* EMPLOYEE EMERGENCY/CONSENT INFORMATION PAGE*/}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>EMPLOYEE EMERGENCY/CONSENT</Text>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>INFORMATION</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>LAST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>FIRST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>MIDDLE INITIAL:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>HOME PHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>CELLPHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>PERSONAL EMAIL ADDRESS:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>DATE OF BIRTH:</TD>
              <TD style={[{ flex: 2 }, styles.td]}> ALLERGIES OR MEDICAL ALERTS:</TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: '25px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMERGENCY CONTACT INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>LAST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>FIRST NAME:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>MIDDLE INITIAL:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>ADDRESS #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>CITY/PROVINCE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>POSTAL CODE:</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td]}>HOME PHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>CELL PHONE #:</TD>
              <TD style={[{ flex: 1 }, styles.td]}>RELATIONSHIP:</TD>
            </TH>
          </Table>
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
          <Text style={[styles.bold, { fontSize: 14 }]}>
            I hereby authorize Eagle Green (EG) to use my name and/or picture on EG media material,
            including the EG website, newsletter, and other media.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
            fontSize: 12,
            width: '100%',
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Checkbox />
            <Text>YES</Text>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Checkbox />
            <Text>NO</Text>
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
          <Text style={[styles.bold, { fontSize: 14 }]}>
            I authorize EG to use my birth date for recognition/celebratory reasons.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 20,
            fontSize: 12,
            width: '100%',
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Checkbox />
            <Text>YES</Text>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Checkbox />
            <Text>NO</Text>
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
          <Text style={[styles.bold, { fontSize: 12 }]}>Employee’s Signature:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '10px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 12 }]}>Date:</Text>
        </View>
      </Page>

      {/* EQUIPMENT RETURN POLICY FROM PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.header.logo}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>EQUIPMENT RETURN</Text>
            <Text style={[styles.textHeader, { fontSize: 20 }]}>POLICY FORM</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE INFORMATION</Text>
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
          <Text style={[{ fontSize: 10 }]}>DATE:</Text>
          <Text style={[{ fontSize: 10 }]}>NAME OF EMPLOYEE:</Text>
          <Text style={[{ fontSize: 10 }]}>ADDRESS:</Text>
          <Text style={[{ fontSize: 10 }]}>CITY:</Text>
          <Text style={[{ fontSize: 10 }]}>PROVINCE:</Text>
          <Text style={[{ fontSize: 10 }]}>COUNTRY:</Text>
          <Text style={[{ fontSize: 10 }]}>POSTAL CODE:</Text>
          <Text style={[{ fontSize: 10 }]}>PHONE:</Text>
          <Text style={[{ fontSize: 10 }]}>EMAIL:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>LIST OF ITEMS GIVEN TO THE EMPLOYEE:</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1, height: '20px' }]}>&nbsp;</TD>
            </TH>
          </Table>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            marginTop: '10',
            gap: 10,
          }}
        >
          <Text style={[{ fontSize: 10 }]}>
            By signing this form, you acknowledge agree to the following terms
          </Text>
          <Text style={[{ fontSize: 10 }]}>
            Price to be deducted off the first pay period as follows.
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              gap: 10,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Hard Hat:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$45.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Safety Vest:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$35.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Ankle & Wrist Bands:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$15.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Safety Paddle:</Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$60.00</Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                width: '100%',
              }}
            >
              <Text style={[{ fontSize: 10, flex: 1 }]}>Light Wand: </Text>
              <Text style={[{ fontSize: 10, flex: 2 }]}>$20.00</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            marginTop: 10,
            gap: 10,
          }}
        >
          <Text style={[{ fontSize: 10 }]}>
            If you have any question regarding this, please contact us at info@eaglegreen.ca.
          </Text>
          <Text style={[{ fontSize: 10 }]}>Dated:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 30,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S SIGNATURE </Text>
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>
              AUTHORIZED PERSON’S SIGNATURE{' '}
            </Text>
          </View>
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 10,
            width: '80%',
            marginTop: '10px',
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text style={[{ fontSize: 10, flex: 1 }]}>info@eaglegreen.ca</Text>
            <Text style={[{ fontSize: 10, flex: 1 }]}>+1 (236)591-0956</Text>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text style={[{ fontSize: 10, flex: 1 }]}>www.eaglegreen.ca</Text>
            <Text style={[{ fontSize: 10, flex: 1 }]}>955 Seaborne Avenue, Port Coquitlam, BC</Text>
          </View>
        </View>
      </Page>

      {/* PAYROLL DIRECT DEPOSIT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={[styles.header.logo]}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 5,
                width: '100px',
              }}
            >
              <Text style={[{ fontSize: 10 }]}>info@eaglegreen.ca</Text>
              <Text style={[{ fontSize: 10 }]}>+1 (236)591-0956</Text>
              <Text style={[{ fontSize: 10 }]}>www.eaglegreen.ca</Text>
              <Text style={[{ fontSize: 10 }]}>955 Seaborne Avenue, Port Coquitlam, BC</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>PAYROLL DIRECT DEPOSIT</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '40px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMPLOYEE’S NAME:</Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginTop: '40px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>***PLEASE ATTACH A VOID CHEQUE OR A</Text>
          <Text style={[styles.bold, { fontSize: 16 }]}>
            *DIRECT DEPOSIT LETTER FROM YOUR BANK***
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '40px',
          }}
        >
          <Text style={[{ fontSize: 16, fontFamily: 'Roboto-Regular' }]}>
            You must submit one of these two documents in order for your payroll to be processed.
          </Text>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 45,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S SIGNATURE </Text>
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>DATE</Text>
          </View>
        </View>
      </Page>

      {/* Employee Social Committee */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={[styles.header.logo]}>
            <Image src="/logo/eaglegreen-single.png" />
          </View>
          <View
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 5,
                width: '100px',
              }}
            >
              <Text style={[{ fontSize: 10 }]}>info@eaglegreen.ca</Text>
              <Text style={[{ fontSize: 10 }]}>+1 (236)591-0956</Text>
              <Text style={[{ fontSize: 10 }]}>www.eaglegreen.ca</Text>
              <Text style={[{ fontSize: 10 }]}>955 Seaborne Avenue, Port Coquitlam, BC</Text>
            </View>
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
            marginTop: '20px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>TO ALL EMPLOYEES:</Text>

          <Text style={[styles.bold, { fontSize: 16 }]}>Re: Employee Social Committee</Text>

          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            Welcome to Eagle Green LLP The Company has formed a committee of employees to manage
            social events that employees can enjoy throughout the year. This committee arranges and
            pays for all kinds of functions and fundraisers, such as barbeques, picnics, adopting a
            family at Christmas and the annual Christmas Party. This committee operates separately
            from the Company.
          </Text>

          <Text
            style={[{ fontSize: 14, fontFamily: 'Roboto-Regular', textDecoration: 'underline' }]}
          >
            How does it work ?
          </Text>

          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            Employees contribute $1.00 per pay period, which is deducted from their weekly
            paycheque. The Company then matches that dollar amount each pay period. The committee
            meets and decides what functions will be organized and how the money in the social fund
            will be spent.
          </Text>

          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            We always need new employees to help plan and organize events, so if you are willing to
            join the Social Committee, please let us know!
          </Text>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
              width: '100%',
            }}
          >
            <View>
              <Checkbox />
            </View>
            <View style={{ width: '100%' }}>
              <Text style={[{ fontSize: 13, fontFamily: 'Roboto-Regular' }]}>
                I would like to join the (EG) Employee Social Committee. My contact information is
                as follows: Name: ______________________________ Phone:_____________________________
              </Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
              width: '100%',
            }}
          >
            <View>
              <Checkbox />
            </View>
            <View style={{ width: '100%' }}>
              <Text style={[{ fontSize: 13, fontFamily: 'Roboto-Regular' }]}>
                I authorize a deduction of $1.00 per pay period to go towards the Social Fund and
                become a member of the Social Club.
              </Text>
            </View>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
              width: '100%',
            }}
          >
            <View>
              <Checkbox />
            </View>
            <View style={{ width: '100%' }}>
              <Text style={[{ fontSize: 13, fontFamily: 'Roboto-Regular' }]}>
                I do not agree to have money deductedfrom my paycheque and do not want to become a
                member of the Social Club.
              </Text>
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
            marginTop: 20,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S NAME </Text>
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE’S SIGNATURE</Text>
          </View>
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 20,
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
            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>DATE </Text>
          </View>
        </View>
      </Page>

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
    </Document>
  );
}
