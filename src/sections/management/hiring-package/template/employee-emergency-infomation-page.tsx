import type { NewHire } from 'src/types/new-hire';

import dayjs from 'dayjs';
import { TH, TD, Table } from '@ag-media/react-pdf-table';
import { Page, Text, View, Font, Image, StyleSheet } from '@react-pdf/renderer';

import { hasPdfImageSrc } from 'src/utils/safe-pdf-image-src';
import { formatSingleNameField } from 'src/utils/format-pdf-display';
import { formatNanpPhoneDisplay } from 'src/utils/format-phone-nanp';

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
  tdColumn: {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
});

type Props = {
  data: NewHire;
};

/** YES column — boolean from the form, or legacy string/number from stored JSON */
function consentAffirmative(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  if (typeof v === 'number') return v === 1;
  return false;
}

export function EmployeeEmergencyInformationPage({ data }: Props) {
  const { emergency_contact, employee, information_consent, birth_date_recognition_consent } = data;
  const informationConsentYes = consentAffirmative(information_consent);
  const birthDateRecognitionYes = consentAffirmative(birth_date_recognition_consent);
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
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>LAST NAME:</Text>
                <Text>{formatSingleNameField(employee.last_name)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>FIRST NAME:</Text>
                <Text>{formatSingleNameField(employee.first_name)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>MIDDLE INITIAL:</Text>
                <Text>{employee.middle_initial}</Text>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>HOME PHONE #:</Text>
                <Text>{formatNanpPhoneDisplay(employee.home_phone_no)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>CELLPHONE #:</Text>
                <Text>{formatNanpPhoneDisplay(employee.cell_no)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>PERSONAL EMAIL ADDRESS:</Text>
                <Text>{employee.email_address}</Text>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>DATE OF BIRTH:</Text>
                <Text>{dayjs(employee.date_of_birth as string).format('MM/DD/YYYY')}</Text>
              </TD>
              <TD style={[{ flex: 2 }, styles.td, styles.tdColumn]}>
                <Text>ALLERGIES OR MEDICAL ALERTS:</Text>
                <Text>{employee.medical_allergies}</Text>
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
            marginTop: '25px',
          }}
        >
          <Text style={[styles.bold, { fontSize: 16 }]}>EMERGENCY CONTACT INFORMATION</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Table style={[styles.table, { width: '100%' }]}>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>LAST NAME:</Text>
                <Text>{formatSingleNameField(emergency_contact.last_name)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>FIRST NAME:</Text>
                <Text>{formatSingleNameField(emergency_contact.first_name)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>MIDDLE INITIAL:</Text>
                <Text>{emergency_contact.middle_initial}</Text>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1.4 }, styles.td, styles.tdColumn]}>
                <Text>ADDRESS:</Text>
                <Text>{emergency_contact.address}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>CITY:</Text>
                <Text>{formatSingleNameField(emergency_contact.city)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>PROVINCE:</Text>
                <Text>{formatSingleNameField(emergency_contact.province)}</Text>
              </TD>
              <TD style={[{ flex: 0.65 }, styles.td, styles.tdColumn]}>
                <Text>POSTAL CODE:</Text>
                <Text>{emergency_contact.postal_code}</Text>
              </TD>
            </TH>
            <TH style={[styles.tableHeader, styles.bold]}>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>HOME PHONE #:</Text>
                <Text>{formatNanpPhoneDisplay(emergency_contact.phone_no)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>CELL PHONE #:</Text>
                <Text>{formatNanpPhoneDisplay(emergency_contact.cell_no)}</Text>
              </TD>
              <TD style={[{ flex: 1 }, styles.td, styles.tdColumn]}>
                <Text>RELATIONSHIP:</Text>
                <Text>{emergency_contact.relationship}</Text>
              </TD>
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
            <Checkbox checked={informationConsentYes} />
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
            <Checkbox checked={!informationConsentYes} />
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
            <Checkbox checked={birthDateRecognitionYes} />
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
            <Checkbox checked={!birthDateRecognitionYes} />
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

          {hasPdfImageSrc(employee.signature) ? (
            <Image src={employee.signature as string} style={{ width: 120, height: 90 }} />
          ) : (
            <View style={{ width: 120, height: 40 }} />
          )}
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
          <Text style={[styles.bold, { fontSize: 12 }]}>Date: {dayjs().format('MM/DD/YYYY')}</Text>
        </View>
      </Page>
  );
}
