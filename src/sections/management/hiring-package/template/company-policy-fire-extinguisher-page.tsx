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

export function CompanyPolicyFireExtinguisherPage({ data }: Props) {
  const dateNow = dayjs().format('MM/DD/YYYY');

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
      {/*  Fire Extinguisher Page 1 out of 2 */}
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
            <Text style={[styles.textHeader, { fontSize: 26 }]}>FIRE</Text>
            <Text style={[styles.textHeader, { fontSize: 26 }]}>EXTINGUISHER</Text>
          </View>
        </View>

        <View
          style={{
            width: '95%',
            fontSize: 12,
            fontFamily: 'Roboto-Regular',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 20,
          }}
        >
          <Text>
            It is essential to periodically check your fire extinguisher because it is an essential
            item to have in your home. There are numerous things you may do to avoid being reactive
            and instead be proactive.
          </Text>

          <Text>
            You can do the following to make sure your fire extinguisher is still functional:
          </Text>
        </View>

        <View
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '95%' }}
        >
          <BulletList content={<Text>Always verify the expiration date.</Text>} />
          <BulletList content={<Text>Look at the pressure gauge.</Text>} />
          <BulletList content={<Text>Call the manufacturer to inquire</Text>} />
          <BulletList
            content={<Text>Look for dents or other damage on the fire extinguisher.</Text>}
          />
          <BulletList
            content={<Text>Check the rubber fire extinguisher hose for fractures or tears.</Text>}
          />
          <BulletList content={<Text>Look for any missing pieces.</Text>} />
          <BulletList
            content={
              <Text>Your fire extinguisher`s manufacturing date can be found at the bottom.</Text>
            }
          />
          <BulletList content={<Text>Get a professional to inspect the fire extinguisher.</Text>} />
          <BulletList
            content={<Text>Recharge your fire extinguisher if it is one that can.</Text>}
          />
        </View>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            width: '95%',
          }}
        >
          <View
            style={{
              fontSize: 11,
              fontFamily: 'Roboto-Regular',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
              flex: 1,
            }}
          >
            <Text style={{ lineHeight: 0.8 }}>
              Check the expiration date frequently. The simplest thing you can do is to check the
              expiration date. Every fire extinguisher ought to carry an expiration date so that you
              know when to discard it. Like most objects, the chemicals inside have an expiration
              date.
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              Along with the usage instructions, the expiration date ought to be printed on the
              bottle`s side. If the item does not have an expiration date, there may be a tag that
              indicates when it was last serviced. You will need to either get a new one or have it
              serviced if it hasn`t been maintained in the last ten years
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              On occasion, the bottom of the bottle will reveal the year it was made. There may even
              be a recommendation for when you should replace it in the instructions. For
              instructions, always read the directions
            </Text>

            <Text style={{ lineHeight: 0.8 }}>
              Manufacturers claim that their extinguishers last anywhere from 5 to 15 years, or on
              average 12 years, if there is no expiration date.
            </Text>
          </View>

          <View style={{ flex: 1, padding: 10 }}>
            <Image src="/pdf/fire-extinguisher-guide.png" />
          </View>
        </View>
      </Page>

      {/*  Fire Extinguisher Page 2 out of 2 */}
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
            <Text style={[styles.textHeader, { fontSize: 26 }]}>FIRE</Text>
            <Text style={[styles.textHeader, { fontSize: 26 }]}>EXTINGUISHER</Text>
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
              gap: 15,
            }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold' }}>Verify the pressure gauge.</Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 200, lineHeight: 0.8 }}>
              If your fire extinguisher needs servicing, the pressure gauge can let you know. You
              can proceed if the arrow is in green.
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 215, lineHeight: 0.8 }}>
              If it is empty, you might wish to have another fire extinguisher available or get it
              filled. You might not have enough depending on the size to put out a bigger fire.
              Always err on the side of caution.
            </Text>
            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 230, lineHeight: 0.8 }}>
              It`s time to get the pressure gauge filled with air or to replace it when it reads red
              or zero. No pressure might mean several things:
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 250, lineHeight: 0.8 }}>
              The bottle is empty of any additional dry chemicals.
            </Text>

            <Text style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: 300, lineHeight: 0.8 }}>
              If there are any chemicals, they cannot be sprayed. a broken bottle.
            </Text>

            <Text
              style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: '100%', lineHeight: 0.8 }}
            >
              Make careful to replace this right away in case of an emergency.
            </Text>

            <Text
              style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: '100%', lineHeight: 0.8 }}
            >
              Get the fire extinguisher serviced or replaced if you have any reason to believe the
              pressure gauge is damaged.
            </Text>

            <Text
              style={{ fontFamily: 'Roboto-Regular', zIndex: 2, width: '100%', lineHeight: 0.8 }}
            >
              Replace the bottle if the meter`s glass is cracked. An inaccurate pressure gauge might
              cause significant problems.
            </Text>
          </View>

          <View style={{ flex: 1, padding: 10, position: 'relative', zIndex: 1 }}>
            <Image
              src="/pdf/fire-extinguisher-guide-2.png"
              style={{
                width: 275,
                height: 300,
                position: 'absolute',
                right: 0,
                top: -50,
              }}
            />
          </View>
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
              }}
            >
              <Text
                style={{ fontSize: 10, fontFamily: 'Roboto-Bold', textTransform: 'uppercase' }}
              >{`${data.employee.first_name} ${data.employee.last_name}`}</Text>
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
                {data.supervisor.display_name}
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
              <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>{dateNow}</Text>
            </View>

            <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold' }}>DATE</Text>
          </View>
        </View>
      </Page>
    </>
  );
}
