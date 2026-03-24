import dayjs from 'dayjs';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { EmployeeInformation } from 'src/types/new-hire';

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
});
type Props = {
  employee: EmployeeInformation;
};
export function MotiveCameraPage({ employee }: Props) {
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
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 10,
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
              }}
            >
              <Text
                style={{ fontSize: 10, fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}
              >{`${employee.last_name}, ${employee.first_name}`}</Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>EMPLOYEE</Text>
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
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}>
                {' '}
              </Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>SUPERVISOR</Text>
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
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}> </Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>SAFETY MANAGER</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
