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
  };

  const PolicyHeader = ({ pageNumber, PolicyNo, title, subjectArea, RevNo }: PolicyHeaderType) => (
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
          <TD style={[{ flex: 1, padding: '5px' }]}> {pageNumber} of 6</TD>
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

      {/* Police  EG-PO-HR-703 1 out of 6*/}
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

      {/* Police  EG-PO-HR-703 2 out of 6*/}
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

      {/* Police  EG-PO-HR-703 2 out of 6*/}
      <Page size="A4" style={styles.page}>
        <PolicyHeader
          pageNumber={3}
          PolicyNo="EG-PO-HR-703"
          subjectArea="Human Resources"
          title="Drugs and Alcohol"
          RevNo="A"
        />
      </Page>
    </Document>
  );
}
