import type { NewHire } from 'src/types/new-hire';

import dayjs from 'dayjs';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { formatPositionDisplay } from 'src/utils/format-role';

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
  data: NewHire;
};
export function CelebrateDivesityEagleGreenLPPPage({ data }: Props) {
  const currentDate = dayjs();
  const { contract_detail, celebrate_diversity_consent } = data;
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
  return (
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
          <Text style={[{ fontSize: 12 }]}>
            DATE: <Text style={styles.bold}> {currentDate.format('MM/DD/YYYY')}</Text>
          </Text>
          <Text style={[{ fontSize: 12 }]}>
            POSITION:{' '}
            <Text style={styles.bold}>
              {formatPositionDisplay(String(contract_detail.position ?? ''))}
            </Text>
          </Text>
          <Text style={[{ fontSize: 12 }]}>
            AREA: <Text style={styles.bold}> {contract_detail.area} </Text>
          </Text>
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
          <Checkbox checked={celebrate_diversity_consent} />
          <Text style={[{ fontSize: 14, fontFamily: 'Roboto-Regular' }]}>
            I have reviewed the content of the Employment Equity Survey and do not wish to
            participate.
          </Text>
        </View>
      </Page>
  );
}
