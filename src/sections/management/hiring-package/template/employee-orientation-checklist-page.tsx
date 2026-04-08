import dayjs from 'dayjs';
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
});
type Props = {
  data: NewHire;
};
export function EmployeeOrientationCheckList({ data }: Props) {
  const currentDate = dayjs();
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
        gap: 10,
        width: '100%',
      }}
    >
      <View style={[styles.circle, isShaded ? styles.filledCircle : styles.emptyCircle]} />
      <View style={{ fontSize: 12, width: '100%', padding: '0 5px' }}>
        {customText ? customText : <Text> {content}</Text>}
      </View>
    </View>
  );

  return (
    <>
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
          <Text style={[{ fontSize: 12 }]}>
            EMPLOYEE NAME:{' '}
            <Text style={{ textTransform: 'uppercase', fontFamily: 'Roboto-Bold' }}>
              {`${data.employee.first_name} ${data.employee.last_name}`}
            </Text>
          </Text>
          <Text style={[{ fontSize: 12 }]}>
            DATE:{' '}
            <Text style={{ fontFamily: 'Roboto-Bold' }}>{currentDate.format('DD/MM/YYYY')}</Text>
          </Text>
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
    </>
  );
}
