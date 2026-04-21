import type { NewHire } from 'src/types/new-hire';

import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { PolicySignatureFooterPdf } from './policy-signature-footer-pdf';

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
export function CompanyRulesPage({ data }: Props) {
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
            <Text style={[styles.textHeader, { fontSize: 26 }]}>COMPANY RULES</Text>
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
            marginTop: 15,
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
            <Text style={{ fontFamily: 'Roboto-Bold', lineHeight: 0.8 }}>
              Eaglegreen employees are required to familiarize themselves with the Health and Safety
              rules and Company rules and procedures.
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
                    Employees working on the road must ensure PPE (personal protective equipment) is
                    worn at all times. Failure to do so will result in a verbal written warning.
                  </Text>
                }
              />
              <BulletList gap={2} content={<Text>PPE consists of</Text>} />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  paddingLeft: 15,
                  gap: 0,
                }}
              >
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Hard Hat (Orange/Yellow)
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Ankle Bands
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Wrist Bands
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Vest
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Paddle
                    </Text>
                  }
                />
                <BulletList
                  gap={1}
                  bulletSize={16}
                  content={
                    <Text
                      style={{
                        fontSize: 10,
                      }}
                    >
                      Safety Steel Boots
                    </Text>
                  }
                />
              </View>

              <BulletList
                gap={2}
                content={
                  <Text>Bullying and Harassment are strongly prohibited at Eaglegreen.</Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    Employees are not permitted to use any electronic devices or headsets while
                    working on the road. In cases of emergency, speak to LCT & Foremen and step
                    aside, where you or others are not in danger.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={<Text>LCTs are responsible for the tidiness of their trucks</Text>}
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    Any unauthorized driving and fuel charges are subject to verbal warnings and
                    deductions.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    LCTs are to understand other Eaglegreen employees may use their company trucks
                    for breaks or a place to store personal belongings in times where needed.
                    Working on the road has its challenges and working together, and ensuring each
                    other`s wellbeing is important.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    LCTs need to ensure all set-ups are as per MOT Manual set-ups as it`s a
                    government requirement.
                  </Text>
                }
              />
              <BulletList
                gap={2}
                content={
                  <Text>
                    Employees are responsible for reporting all incidents or near-miss incidents to
                    the office and supervisors.
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Keep their work areas clean and tidy, free of hazards that could cause slips,
                    trips, or falls.
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Co-operate fully with any investigations regarding Health & Safety carried out
                    by EG
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Immediately address all identified or potential hazards. Where this is not
                    possible, they must report the situation to their field supervisor or dispatch.
                  </Text>
                }
              />

              <BulletList
                gap={2}
                content={
                  <Text>
                    Right to refuse work - stop any work activity where an unsafe working condition
                    is identified and ensure that this is corrected before work is allowed to
                    restart. Any such action shall be reported to the office and supervisors.
                  </Text>
                }
              />
            </View>
          </View>
        </View>

        <PolicySignatureFooterPdf data={data} policyKey="company_rules" />
      </Page>
  );
}
