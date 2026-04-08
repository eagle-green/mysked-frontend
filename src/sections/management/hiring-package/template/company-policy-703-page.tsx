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

export function CompanyPolicy703Page({ data }: Props) {
  const dateNow = dayjs().format('DD/MM/YYYY');
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
              >{`${data.employee.last_name}, ${data.employee.first_name}`}</Text>
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
      </Page>
    </>
  );
}
