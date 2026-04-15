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

export function CompanyPolicyGen002Page({ data }: Props) {
  const dateNow = dayjs().format('MM/DD/YYYY');

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
          pageNumber={2}
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
                >{`${data.employee.first_name} ${data.employee.last_name}`}</Text>
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
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
            }}
          >
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12, flex: 1 }}>
              {data.fuel_card.company_name}
            </Text>
            <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 12, flex: 1 }}>
              {data.fuel_card.card_number}
            </Text>
          </View>
        </View>
      </Page>
    </>
  );
}
