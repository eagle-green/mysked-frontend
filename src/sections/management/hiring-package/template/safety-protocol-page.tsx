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
});
type Props = {
  data: NewHire;
};
export function SafetyProtocolPage({ data }: Props) {
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
              I, {`${data.employee.first_name} ${data.employee.last_name}`}, acknowledge receipt of
              the following package provided by Eagle Green to ensure that safe work practices are
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
                {data.policy_agreement.motive_cameras
                  ? `${data.employee.first_name}, ${data.employee.last_name}`
                  : ''}
              </Text>
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
                {data.supervisor_agreement.motive_cameras ? `${data.supervisor.display_name}` : ''}
              </Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>SUPERVISOR</Text>
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
                {data.safety_manager_agreement.motive_cameras
                  ? `${data.safety_manager.display_name}`
                  : ''}
              </Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>SUPERVISOR</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
