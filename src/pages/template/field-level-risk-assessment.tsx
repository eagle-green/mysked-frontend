import dayjs from 'dayjs';
import { TR, TH, TD, Table } from '@ag-media/react-pdf-table';
import {
  Svg,
  Page,
  Text,
  View,
  Font,
  Path,
  Image,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';

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
    padding: '0 30px 80px 30px',
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#ffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
  },
  textBold: {
    fontFamily: 'Roboto-Bold',
  },
  textUpperCase: {
    textTransform: 'uppercase',
  },
  container: {
    width: 480,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    logo: {
      width: 95,
      hieght: 95,
    },
    title: {
      fontSize: '26px',
      letterSpacing: 2,
    },
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
    fontFamily: 'Roboto-Regular',
    fontSize: 9,
    padding: '2px 3px',
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
  riskLabel: {
    fontFamily: 'Roboto-Bold',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  riskContent: {
    fontFamily: 'Roboto-Regular',
    fontSize: 8,
    color: '#333',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBorderTableHead: {
    border: '0 solid #fff',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    fontSize: 10,
    paddingLeft: 5,
    paddingBottom: 2,
  },
  assessmentLabel: {
    fontFamily: 'Roboto-Bold',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  assessmentValue: {
    fontFamily: 'Roboto-Regular',
    fontSize: 9,
    color: '#333',
    marginLeft: 5,
  },
  contentCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    border: '1px solid #000',
    padding: 5,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
  },
  checkboxContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    width: 380,
  },
  signatureImage: {
    width: 160,
    height: 80,
    marginLeft: 10,
    objectFit: 'contain',
  },
});

const Banner = () => (
  <View
    style={{
      position: 'relative',
      top: 0,
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    <Image src="/pdf/banner.png" style={{ width: 480, height: 'auto' }} fixed />
  </View>
);

const FooterBanner = () => (
  <View
    style={{
      position: 'absolute',
      bottom: 10,
      left: 0,
      right: 0,
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }}
  >
    <View style={{ flex: 1 }} />
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <View style={{ width: 480, display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
        <Text
          style={{
            fontSize: '8px',
            textAlign: 'right',
          }}
          render={({ pageNumber, totalPages, subPageNumber, subPageTotalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </View>
      <Image src="/pdf/banner-footer.png" style={{ width: 480, height: 'auto', maxHeight: 100 }} />
    </View>
    <View style={{ flex: 1 }} />
  </View>
);

const Check = () => (
  <Svg width="14" height="14" viewBox="0 0 14 14">
    <Path d="M3,7 L6,10 L11,4" fill="none" stroke="black" strokeWidth="2" />
  </Svg>
);

// Format phone number to display as 778-873-3171
const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    // Handle +1 country code: remove the leading 1 and format as 123-123-1234
    const withoutCountryCode = digits.slice(1);
    return `${withoutCountryCode.slice(0, 3)}-${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  } else if (digits.length === 10) {
    // Handle 10-digit numbers: format as 123-123-1234
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phoneNumber; // Return original if not 10 or 11 digits
};

// Format address to display on 2 lines
const formatAddress = (address: string) => {
  if (!address) return '';

  // Split address by commas and clean up
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part);

  if (parts.length <= 2) {
    // If 2 or fewer parts, return as is
    return address;
  }

  // Try to split at a logical point (usually after the first 2-3 parts)
  const firstLine = parts.slice(0, 2).join(', ');
  const secondLine = parts.slice(2).join(', ');

  return `${firstLine},\n${secondLine}`;
};

const CheckedBox = () => (
  <Svg width="12" height="12" viewBox="0 0 12 12">
    <Path d="M1,1 L1,11 L11,11 L11,1 L1,1" fill="none" stroke="black" strokeWidth="1" />
    <Path d="M3,6 L5,8 L9,4" fill="none" stroke="black" strokeWidth="1" />
  </Svg>
);

const EmptyCheckBox = () => (
  <Svg width="12" height="12" viewBox="0 0 12 12">
    <Path d="M1,1 L1,11 L11,11 L11,1 L1,1" fill="none" stroke="black" strokeWidth="1" />
  </Svg>
);

const Header = () => (
  <View style={[styles.header, styles.container]}>
    <View>
      <Image style={styles.header.logo} src="/logo/eaglegreen-single.png" />
    </View>
    <View>
      <Text style={[styles.header.title, styles.textUpperCase, styles.textBold]}>
        Field level risk
      </Text>
      <Text style={[styles.header.title, styles.textUpperCase, styles.textBold]}>
        assessment (FLRA)
      </Text>
    </View>
  </View>
);
export type FieldLevelRiskAssessmentType = {
  full_name: string;
  date: string;
  site_foreman_name: string;
  contact_number: string;
  site_location: string;
  company_contract: string;
  closest_hospital: string;
  start_time: string;
  end_time: string;
  first_aid_on_site: string;
  first_aid_kit: string;
  descriptionOfWork: {
    road: {
      city: boolean;
      rural: boolean;
      hwy: boolean;
      other: boolean;
    };
    distance: {
      hill: boolean;
      curve: boolean;
      obstacle: boolean;
      other: boolean;
    };
    weather: {
      sunny: boolean;
      cloudy: boolean;
      snow: boolean;
      fog: boolean;
      windy: boolean;
      hot: boolean;
      cold: boolean;
    };
    roadOther: string;
    distanceOther: string;
  };
  scopeOfWork: {
    roadType: {
      single_lane_alternating: boolean;
      lane_closure: boolean;
      road_closed: boolean;
      shoulder_work: boolean;
      turn_lane_closure: boolean;
      showing_traffic: boolean;
      other: boolean;
    };
    otherDescription: string;
    contractToolBox: string;
  };
  present: {
    identified: string;
    reduce: string;
    experienced: string;
    complete: string;
  };
  riskAssessment: {
    visibility: string;
    lineOfSight: string;
    slipAndStrip: string;
    holes: string;
    weather: string;
    dust: string;
    fumes: string;
    noise: string;
    blindSpot: string;
    overHeadLines: string;
    workingAlone: string;
    mobileEquipment: string;
    trafficVolume: string;
    conditions: string;
    utilities: string;
    fatigue: string;
    controlMeasure: string;
    other: string;
    otherDescription: string;
  };
  trafficControlPlans: [
    {
      hazard_risk_assessment: string;
      control_measure: string;
    },
  ];
  updates?: Array<{
    date_time_updates: string;
    changes: string;
    additional_control: string;
    initial: string;
  }>;
  responsibilities: Array<{
    name: string;
    role: string;
    serialNumber: string;
    responsibility: string;
    initial: string;
  }>;
  authorizations?: {
    fullName: string;
    company: string;
    date_time: string;
  }[];
  supervisionLevels: {
    communicationMode: boolean;
    pictureSubmission: boolean;
    supervisorPresence: boolean;
  };
  supervisionLevel?: 'low' | 'medium' | 'high';
  signature: string | null;
  flraDiagram: string | null;
};

type FlraContentProps = {
  data: FieldLevelRiskAssessmentType;
};
const AssessmentDetailSection = ({ data }: FlraContentProps) => (
  <View style={[styles.table, styles.container]}>
    <View
      style={[
        styles.textBold,
        { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
      ]}
    >
      <View
        style={[
          styles.th,
          { height: 30, minHeight: 30, maxHeight: 30, flex: 1, borderRight: '1px solid #000' },
        ]}
      >
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>NAME : </Text>
          <Text style={styles.assessmentValue}>{data.full_name}</Text>
        </Text>
      </View>
      <View style={[styles.th, { height: 30, minHeight: 30, maxHeight: 30, flex: 1 }]}>
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>DATE : </Text>
          <Text style={styles.assessmentValue}>{data.date}</Text>
        </Text>
      </View>
    </View>
    <View
      style={[
        styles.textBold,
        { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
      ]}
    >
      <View
        style={[
          styles.th,
          { height: 30, minHeight: 30, maxHeight: 30, flex: 1, borderRight: '1px solid #000' },
        ]}
      >
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>SITE FOREMAN NAME : </Text>
          <Text style={styles.assessmentValue}>{data.site_foreman_name}</Text>
        </Text>
      </View>
      <View style={[styles.th, { height: 30, minHeight: 30, maxHeight: 30, flex: 1 }]}>
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>CONTACT NUMBER : </Text>
          <Text style={styles.assessmentValue}>{data.contact_number}</Text>
        </Text>
      </View>
    </View>
    <View
      style={[
        styles.textBold,
        { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
      ]}
    >
      <View
        style={[
          styles.th,
          { height: 30, minHeight: 30, maxHeight: 30, flex: 1, borderRight: '1px solid #000' },
        ]}
      >
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>
            COMPANY CONTRACTED TO :{' '}
          </Text>
          <Text style={styles.assessmentValue}>{data.company_contract}</Text>
        </Text>
      </View>
      <View style={[styles.th, { height: 30, minHeight: 30, maxHeight: 30, flex: 1 }]}>
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>CLOSEST HOSPITAL : </Text>
          <Text style={styles.assessmentValue}>{data.closest_hospital}</Text>
        </Text>
      </View>
    </View>
    <View
      style={[
        styles.textBold,
        { display: 'flex', flexDirection: 'row', borderBottom: '1px solid #000' },
      ]}
    >
      <View
        style={[
          styles.th,
          { height: 30, minHeight: 30, maxHeight: 30, flex: 1, borderRight: '1px solid #000' },
        ]}
      >
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>SITE LOCATION : </Text>
          <Text style={styles.assessmentValue}>{data.site_location}</Text>
        </Text>
      </View>
      <View
        style={[
          styles.th,
          {
            height: 30,
            minHeight: 30,
            maxHeight: 30,
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '1px 2px',
          },
        ]}
      >
        <Text style={{ flex: 1 }}>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>START TIME: </Text>
          <Text style={styles.assessmentValue}>{data.start_time}</Text>
        </Text>
        <Text style={{ flex: 1 }}>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>END TIME: </Text>
          <Text style={styles.assessmentValue}>{data.end_time}</Text>
        </Text>
      </View>
    </View>
    <View style={[styles.textBold, { display: 'flex', flexDirection: 'row' }]}>
      <View
        style={[
          styles.th,
          { height: 30, minHeight: 30, maxHeight: 30, flex: 1, borderRight: '1px solid #000' },
        ]}
      >
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>FIRST AID ON SITE : </Text>
          <Text style={styles.assessmentValue}>{data.first_aid_on_site}</Text>
        </Text>
      </View>
      <View style={[styles.th, { height: 30, minHeight: 30, maxHeight: 30, flex: 1 }]}>
        <Text>
          <Text style={[styles.assessmentLabel, styles.textUpperCase]}>FIRST AID KIT : </Text>
          <Text style={styles.assessmentValue}>{data.first_aid_kit}</Text>
        </Text>
      </View>
    </View>
  </View>
);

type BoxProps = {
  label: string;
  underline?: boolean;
  isChecked?: boolean;
};

const CheckBox = ({ label, underline = false, isChecked = false }: BoxProps) => (
  <View
    style={{
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 2,
      fontSize: 9,
    }}
  >
    {isChecked ? <CheckedBox /> : <EmptyCheckBox />}
    <Text>
      {label} {underline && <>__________________________</>}
    </Text>
  </View>
);

type CheckBoxContentProps = {
  label: string;
  items: Array<{
    label: string;
    size: number;
    underlined?: boolean;
    isChecked?: boolean;
  }>;
  labelContainerWidth?: number;
  labelFontSize?: number;
};

const CheckBoxContent = ({
  items,
  label,
  labelContainerWidth = 0,
  labelFontSize,
}: CheckBoxContentProps) => (
  <View style={[styles.row, { gap: 10, marginHorizontal: 5, alignItems: 'flex-start' }]}>
    {label && (
      <View style={{ width: labelContainerWidth ? labelContainerWidth : 70, flexShrink: 0 }}>
        <Text style={[{ fontSize: labelFontSize ? labelFontSize : 10 }, styles.textBold]}>
          {label}
        </Text>
      </View>
    )}
    <View style={[styles.checkboxContainer, { alignItems: 'center', flexWrap: 'nowrap' }]}>
      {items.map((item, index) => (
        <View key={index} style={{ width: item.size, display: 'flex', alignItems: 'center' }}>
          <CheckBox label={item.label} underline={item.underlined} isChecked={item.isChecked} />
        </View>
      ))}
    </View>
  </View>
);

type DescriptionOfWorkProps = {
  data: FieldLevelRiskAssessmentType;
};

const DescriptionOfWorkSection = ({ data }: DescriptionOfWorkProps) => {
  const { road, distance, weather, roadOther, distanceOther } = data.descriptionOfWork || {};

  const createCheckboxItems = (field: 'road' | 'distance' | 'weather', options: Array<any>) =>
    options.map(({ label, size, underlined = false, matchValue }) => {
      // Check if the field is checked (now always objects)
      let isChecked = false;

      if (field === 'road' && road) {
        isChecked = road[matchValue as keyof typeof road] === true;
      } else if (field === 'distance' && distance) {
        isChecked = distance[matchValue as keyof typeof distance] === true;
      } else if (field === 'weather' && weather) {
        isChecked = weather[matchValue as keyof typeof weather] === true;
      }

      // For "Other" options, include the content if it exists
      const displayLabel =
        matchValue === 'other' &&
        isChecked &&
        ((field === 'road' && roadOther) || (field === 'distance' && distanceOther))
          ? `${label}: ${field === 'road' ? roadOther : distanceOther}`
          : label;

      return {
        label: displayLabel,
        size,
        underlined,
        isChecked,
      };
    });

  const checkboxItems = [
    {
      label: 'Road',
      items: createCheckboxItems('road', [
        { label: 'City', size: 50, matchValue: 'city' },
        { label: 'Rural', size: 50, matchValue: 'rural' },
        { label: 'HWY', size: 60, matchValue: 'hwy' },
        { label: 'Other', size: 150, underlined: false, matchValue: 'other' },
      ]),
    },
    {
      label: 'Sight Distance',
      items: createCheckboxItems('distance', [
        { label: 'Hill', size: 50, matchValue: 'hill' },
        { label: 'Curve', size: 50, matchValue: 'curve' },
        { label: 'Obstacle', size: 60, matchValue: 'obstacle' },
        { label: 'Other', size: 150, underlined: false, matchValue: 'other' },
      ]),
    },
    {
      label: 'Weather',
      items: createCheckboxItems('weather', [
        { label: 'Sunny', size: 50, matchValue: 'sunny' },
        { label: 'Cloudy/Rain', size: 70, matchValue: 'cloudy' },
        { label: 'Snow', size: 50, matchValue: 'snow' },
        { label: 'Fog', size: 50, matchValue: 'fog' },
        { label: 'Windy', size: 50, matchValue: 'windy' },
        { label: 'Hot', size: 50, matchValue: 'hot' },
        { label: 'Cold', size: 50, matchValue: 'cold' },
      ]),
    },
  ];
  return (
    <View style={[styles.container]}>
      <Text
        style={[
          {
            margin: '1px 0',
            fontSize: 10,
          },
          styles.textBold,
        ]}
      >
        DESCRIPTION OF WORK
      </Text>
      <View style={styles.box}>
        <Text
          style={[
            {
              fontSize: 9,
              textDecoration: 'underline',
              backgroundColor: '#edede3',
              width: '90px',
            },
            styles.textBold,
          ]}
        >
          ROAD CONDITIONS:
        </Text>
        <View
          style={[
            {
              padding: 5,
              gap: 5,
            },
            styles.column,
          ]}
        >
          {checkboxItems.map((cb, index) => (
            <CheckBoxContent key={index} items={cb.items} label={cb.label} />
          ))}
        </View>
      </View>
    </View>
  );
};

//------------------------------------------------------------------------------------------------
type ScopeOfWorkProps = {
  data: FieldLevelRiskAssessmentType;
};

const ScopeOfWorkSection = ({ data }: ScopeOfWorkProps) => {
  const { roadType, contractToolBox, otherDescription } = data.scopeOfWork;

  const createCheckboxItems = (options: Array<any>) =>
    options.map(({ label, size, underlined = false, matchValue }) => {
      const isChecked = roadType && roadType[matchValue as keyof typeof roadType] === true;
      // For "Other" option, include the content if it exists
      const displayLabel =
        matchValue === 'other' && isChecked && otherDescription
          ? `Other: ${otherDescription}`
          : label;

      return {
        label: displayLabel,
        size,
        underlined,
        isChecked,
      };
    });

  const checkboxItems = [
    {
      label: '',
      items: createCheckboxItems([
        { label: 'Single Lane Alternating', size: 150, matchValue: 'single_lane_alternating' },
        { label: 'Lane Closure', size: 120, matchValue: 'lane_closure' },
        { label: 'Road Closed', size: 100, matchValue: 'road_closed' },
        { label: 'Shoulder Work', size: 120, matchValue: 'shoulder_work' },
      ]),
    },
    {
      label: '',
      items: createCheckboxItems([
        { label: 'Turn Lane Closure', size: 96, matchValue: 'turn_lane_closure' },
        { label: 'Slowing Traffic', size: 143, matchValue: 'showing_traffic' },
        { label: 'Other', size: 140, matchValue: 'other' },
      ]),
    },
  ];

  return (
    <View style={[styles.container]}>
      <Text
        style={[
          {
            margin: '1px 0',
            fontSize: 10,
          },
          styles.textBold,
        ]}
      >
        TCP/LCP SCOPE OF WORK
      </Text>
      <View style={styles.box}>
        <View
          style={[
            {
              padding: 5,
              gap: 5,
            },
            styles.column,
          ]}
        >
          {checkboxItems.map((cb, index) => (
            <CheckBoxContent key={index} items={cb.items} label={cb.label} />
          ))}
        </View>
        <View>
          <Text
            style={[
              {
                fontSize: 9,
                textDecoration: 'underline',
                backgroundColor: '#edede3',
                marginBottom: 2,
                width: '180px',
              },
              styles.textBold,
            ]}
          >
            SCOPE OF WORK/CONTRACTOR TOOLBOX:
          </Text>
        </View>
        <View>
          <Text style={[styles.textUpperCase, { fontSize: 10 }]}>{contractToolBox}</Text>
        </View>
      </View>
    </View>
  );
};
type RiskAssessmentProps = {
  data: FieldLevelRiskAssessmentType;
};
const RiskAssessmentSection = ({ data }: RiskAssessmentProps) => {
  const assessment: any = data.riskAssessment;
  const riskFactors = [
    { key: 'visibility', desc: 'VISIBILITY' },
    { key: 'lineOfSight', desc: 'LINE OF SIGHT' },
    { key: 'slipAndStrip', desc: 'SLIPS AND TRIPS' },
    { key: 'holes', desc: 'FALL/OPEN HOLES' },
    { key: 'weather', desc: 'WEATHER' },
    { key: 'dust', desc: 'DUST' },
    { key: 'fumes', desc: 'FUMES' },
    { key: 'noise', desc: 'EXCESSIVE NOISE' },
    { key: 'blindSpot', desc: 'BLIND SPOTS' },
    { key: 'overHeadLines', desc: 'OVERHEAD LINES' },
    { key: 'workingAlone', desc: 'WORKING ALONE' },
    { key: 'mobileEquipment', desc: 'MOBILE EQUIPEMENT' },
    { key: 'trafficVolume', desc: 'TRAFFIC VOLUMES' },
    { key: 'conditions', desc: 'LIGHTING CONDITIONS' },
    { key: 'utilities', desc: 'UNDERGROUND UTILITIES' },
    { key: 'fatigue', desc: 'FATIGUE' },
    { key: 'controlMeasure', desc: 'CONTROL MEASURE' },
    { key: 'other', desc: 'OTHER' },
  ];

  // Calculate overall risk
  const calculateOverallRisk = () => {
    const riskValues = riskFactors.map((factor) => assessment[factor.key]).filter((value) => value);
    if (riskValues.length === 0) return 'low';

    const highCount = riskValues.filter((value) => value === 'high').length;
    const mediumCount = riskValues.filter((value) => value === 'medium').length;

    if (highCount > 0) return 'high';
    if (mediumCount > 0) return 'medium';
    return 'low';
  };

  const overallRisk = calculateOverallRisk();

  const renderCheckBox = (value: string) => ({
    low: value === 'low' ? <Check /> : '',
    med: value === 'medium' ? <Check /> : '',
    high: value === 'high' ? <Check /> : '',
  });

  const rows = riskFactors.map(({ key, desc }) => {
    // For the "other" field, include the content if it exists
    const displayDesc =
      key === 'other' && assessment.otherDescription
        ? `${desc}: ${assessment.otherDescription}`
        : desc;

    return {
      desc: displayDesc,
      ...renderCheckBox(assessment[key]),
    };
  });
  return (
    <View style={{ width: 240 }}>
      <Table style={[styles.table, { width: '100%' }]}>
        <TH style={[styles.tableHeader, styles.textBold]}>
          <TD style={[{ flex: 4 }, styles.noBorderTableHead]}>RISK ASSESSMENT</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>LOW</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>MED</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>HIGH</TD>
        </TH>
        {rows.map((row) => (
          <TR>
            <TD style={[styles.td, { flex: 4, padding: '1px 2px' }]}>
              <Text style={styles.riskLabel}>{row.desc}</Text>
            </TD>
            <TD style={[styles.td, { flex: 1, padding: '1px 2px' }]}>
              <View style={styles.riskContent}>{row.low}</View>
            </TD>
            <TD style={[styles.td, { flex: 1, padding: '1px 2px' }]}>
              <View style={styles.riskContent}>{row.med}</View>
            </TD>
            <TD style={[styles.td, { flex: 1, padding: '1px 2px' }]}>
              <View style={styles.riskContent}>{row.high}</View>
            </TD>
          </TR>
        ))}
        <TH style={[styles.tableHeader, styles.textBold]}>
          <TD
            style={[{ textDecoration: 'underline', flex: 4, padding: '1px 2px' }, styles.textBold]}
          >
            <Text style={{ fontSize: 12 }}>OVERALL RISK</Text>
          </TD>
          <TD
            style={[{ flex: 1, textDecoration: 'underline', padding: '1px 2px' }, styles.textBold]}
          >
            <View style={styles.riskContent}>{overallRisk === 'low' ? <Check /> : ''}</View>
          </TD>
          <TD
            style={[{ flex: 1, textDecoration: 'underline', padding: '1px 2px' }, styles.textBold]}
          >
            <View style={styles.riskContent}>{overallRisk === 'medium' ? <Check /> : ''}</View>
          </TD>
          <TD
            style={[{ flex: 1, textDecoration: 'underline', padding: '1px 2px' }, styles.textBold]}
          >
            <View style={styles.riskContent}>{overallRisk === 'high' ? <Check /> : ''}</View>
          </TD>
        </TH>
      </Table>
    </View>
  );
};
type TcpLctPresentProps = {
  data: FieldLevelRiskAssessmentType;
};
const TcpLctPresentSection = ({ data }: TcpLctPresentProps) => {
  const { identified, reduce, complete, experienced } = data.present;

  const normalizedValues = {
    identified: identified?.toLowerCase(),
    reduce: reduce?.toLowerCase(),
    complete: complete?.toLowerCase(),
    experienced: experienced?.toLowerCase(),
  };

  const createCheckboxItems = (field: keyof typeof normalizedValues, options: Array<any>) =>
    options.map(({ label, size, underlined = false, matchValue }) => ({
      label,
      size,
      underlined,
      isChecked: normalizedValues[field] === matchValue.toLowerCase(),
    }));

  const content = [
    {
      label: 'Is the escape route identified?',
      labelContainerWidth: 120,
      labelFontSize: 9,
      items: createCheckboxItems('identified', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
    {
      label: 'Does the speed need to be reduced?',
      labelContainerWidth: 120,
      labelFontSize: 9,
      items: createCheckboxItems('reduce', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
    {
      label: 'New LCT/TCP (Less than 2 years of exp)?',
      labelContainerWidth: 120,
      labelFontSize: 9,
      items: createCheckboxItems('experienced', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
    {
      label: 'Do you need to complete a Young/New Worker Form?',
      labelContainerWidth: 120,
      labelFontSize: 9,
      items: createCheckboxItems('complete', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
  ];
  return (
    <View style={{ width: 225 }}>
      <Text style={[{ fontSize: 10 }, styles.textBold]}>TCPs/LCTs PRESENT</Text>
      <View
        style={{
          border: '1px solid #000',
          width: '100%',
        }}
      >
        <View
          style={[
            {
              padding: 5,
              gap: 8,
              alignItems: 'flex-start',
            },
            styles.column,
          ]}
        >
          {content.map((c, index) => (
            <CheckBoxContent
              key={index}
              label={c.label}
              items={c.items}
              labelContainerWidth={c.labelContainerWidth}
              labelFontSize={c.labelFontSize}
            />
          ))}
        </View>
      </View>
    </View>
  );
};
type SinatureProps = {
  data: FieldLevelRiskAssessmentType;
};
const SignatureSection = ({ data }: SinatureProps) => (
  <View
    style={{
      border: '1px solid #000',
      width: 225,
    }}
  >
    <View
      style={[
        {
          padding: '8px 12px',
          justifyContent: 'space-between',
          height: 130,
          display: 'flex',
          flexDirection: 'column',
        },
      ]}
    >
      <Text style={[{ fontSize: 10 }, styles.textBold]} fixed>
        I hereby this hazard assessment is mandatory as per company policy and worksafe BC and all
        information on this form is accurate to the best of my knowledge.
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[{ fontSize: 12 }, styles.textBold]}>Signature:</Text>
        {data?.signature && (
          <Image source={{ uri: data.signature }} style={styles.signatureImage} />
        )}
      </View>
    </View>
  </View>
);

const TrafficControlPlanSection = ({ data }: { data: FieldLevelRiskAssessmentType }) => {
  const trafficControlPlans = data.trafficControlPlans ?? [];
  const filledPlans = [
    ...trafficControlPlans,
    ...Array(3 - trafficControlPlans.length).fill({
      hazard_risk_assessment: '',
      control_measure: '',
    }),
  ];
  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>
        TRAFFIC CONTROL PLAN
      </Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px' }}>
            HAZARD IDENTIFIED IN RISK ASSESSMENT
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px' }}>CONTROL MEASURES</TD>
        </TH>
        {filledPlans.map((item, index) => (
          <TR key={index}>
            {item.hazard_risk_assessment ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.hazard_risk_assessment}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {item.control_measure !== '' ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.control_measure}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}
          </TR>
        ))}
      </Table>
    </View>
  );
};

const UpdatesTableSection = ({ data }: { data: FieldLevelRiskAssessmentType }) => {
  const updates = data.updates ?? [];
  const responsibilities = data.responsibilities ?? [];

  const changes = [
    ...updates,
    ...Array(2 - updates.length).fill({
      date_time_updates: '',
      changes: '',
      additional_control: '',
      initial: '',
    }),
  ];

  const roles = [
    ...responsibilities,
    ...Array(4 - responsibilities.length).fill({
      name: '',
      role: '',
      serialNumber: '',
      responsibility: '',
      initial: '',
    }),
  ];

  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>UPDATES</Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 2px',
              flex: 1.5,
            }}
          >
            <Text>DATE AND TIME</Text>
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>CHANGES</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>
            ADDITIONAL CONTROL
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>INITIAL</TD>
        </TH>
        {changes.map((change, index) => (
          <TR key={index}>
            {change.date_time_updates ? (
              <TD
                style={[
                  styles.td,
                  {
                    flex: 1.5,
                    padding: '4px 2px',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text>{change.date_time_updates}</Text>
              </TD>
            ) : (
              <TD
                style={[
                  styles.td,
                  {
                    flex: 1.5,
                    padding: '4px 2px',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text>&nbsp;</Text>
              </TD>
            )}

            {change.changes ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                {change.changes}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {change.additional_control ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                {change.additional_control}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            <TD
              style={[
                styles.td,
                { flex: 1, padding: '2px', justifyContent: 'center', alignItems: 'center' },
              ]}
            >
              {change.initial ? (
                <Image
                  source={{ uri: change.initial }}
                  style={{
                    width: 30,
                    height: 12,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Text>&nbsp;</Text>
              )}
            </TD>
          </TR>
        ))}
      </Table>
      <Table style={{ width: '100%', marginTop: 20 }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>NAME</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>ROLES</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>SN #</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>
            RESPONSIBILITIES
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>INITIAL</TD>
        </TH>
        {roles.map((item, index) => (
          <TR key={index}>
            {item.name ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.name}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {item.role ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.role}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {item.serialNumber ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.serialNumber}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {item.responsibility ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.responsibility}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            <TD
              style={[
                styles.td,
                { flex: 1, padding: '2px', justifyContent: 'center', alignItems: 'center' },
              ]}
            >
              {item.initial ? (
                <Image
                  source={{ uri: item.initial }}
                  style={{
                    width: 30,
                    height: 12,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Text>&nbsp;</Text>
              )}
            </TD>
          </TR>
        ))}
      </Table>
    </View>
  );
};

const LevelOfSupervisionSection = ({ data }: { data: FieldLevelRiskAssessmentType }) => {
  const { supervisionLevels } = data;
  const levels = [
    {
      label: 'LOW RISK',
      checkbox: supervisionLevels.communicationMode ? <CheckedBox /> : <EmptyCheckBox />,
      content: 'Text or phone call to supervisor',
    },
    {
      label: 'MODERATE RISK',
      checkbox: supervisionLevels.pictureSubmission ? <CheckedBox /> : <EmptyCheckBox />,
      content: 'Send pictures of set up to supervisor',
    },
    {
      label: 'HIGH RISK',
      checkbox: supervisionLevels.supervisorPresence ? <CheckedBox /> : <EmptyCheckBox />,
      content: 'Supervisor must be present when setting up',
    },
  ];
  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>
        LEVEL OF SUPERVISION
      </Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>RISK LEVEL</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>
            SUPERVISION REQUIRED
          </TD>
        </TH>
        {levels.map((level, index) => (
          <TR key={index}>
            <TD
              style={[styles.td, { flex: 1, justifyContent: 'space-around', padding: '4px 2px' }]}
            >
              <Text style={{ textAlign: 'left', width: 90 }}>{level.label}</Text>
              {level.checkbox}
            </TD>
            <TD style={[styles.td, { flex: 1, padding: '4px 2px', justifyContent: 'center' }]}>
              {level.content}
            </TD>
          </TR>
        ))}
      </Table>
    </View>
  );
};

const AuthorizationSection = ({ data }: { data: FieldLevelRiskAssessmentType }) => {
  const authorize = data.authorizations ?? [];

  const items = [
    ...authorize,
    ...Array(3 - authorize.length).fill({
      fullName: '',
      company: '',
      date_time: '',
    }),
  ];

  return (
    <View style={styles.container}>
      <Text style={[{ padding: '5px 0', fontSize: 12 }, styles.textBold]}>
        SING OFF BY (included project supervisor, TC supervisor)
      </Text>
      <Table style={{ width: '100%' }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>NAME</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>COMPANY</TD>
          <TD
            style={{ justifyContent: 'center', alignItems: 'center', padding: '4px 2px', flex: 1 }}
          >
            <Text>DATE AND TIME</Text>
          </TD>
        </TH>
        {items.map((item, index) => (
          <TR key={index}>
            {item.fullName ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.fullName}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {item.company ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                {item.company}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px', justifyContent: 'center' }]}>
                <Text>&nbsp;</Text>
              </TD>
            )}

            {item.date_time ? (
              <TD
                style={[
                  styles.td,
                  { flex: 1, padding: '4px 2px', justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <Text>{item.date_time}</Text>
              </TD>
            ) : (
              <TD
                style={[
                  styles.td,
                  { flex: 1, padding: '4px 2px', justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <Text>&nbsp;</Text>
              </TD>
            )}
          </TR>
        ))}
      </Table>
    </View>
  );
};

//-----------------------------------------------------------------------------
type Props = {
  assessment: FieldLevelRiskAssessmentType;
};

export default function FieldLevelRiskAssessmentPdf({ assessment }: Props) {
  const toDayjs = (value?: string | Date | null) => dayjs(value);
  const data = {
    ...assessment,
    date: toDayjs(assessment.date).format('MM/DD/YYYY'),
    start_time: toDayjs(assessment.start_time).format('hh:mm A'),
    end_time: toDayjs(assessment.end_time).format('hh:mm A'),
    contact_number: formatPhoneNumber(assessment.contact_number),
    site_location: formatAddress(assessment.site_location),
    // Fix date and time formatting for updates and authorizations
    updates:
      assessment.updates?.map((update) => ({
        ...update,
        date_time_updates: update.date_time_updates
          ? `${toDayjs(update.date_time_updates).format('YYYY-MM-DD')} ${toDayjs(update.date_time_updates).format('hh:mm A')}`
          : '',
      })) || [],
    authorizations:
      assessment.authorizations?.map((auth) => ({
        ...auth,
        date_time: auth.date_time
          ? `${toDayjs(auth.date_time).format('YYYY-MM-DD')} ${toDayjs(auth.date_time).format('hh:mm A')}`
          : '',
      })) || [],
  };

  return (
    <Document>
      {/* First Page  */}
      <Page size="A4" style={styles.page}>
        <View style={{ position: 'relative', top: 0 }}>
          <Banner />
        </View>
        <View fixed>
          <Header />
        </View>
        <View fixed>
          <AssessmentDetailSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View fixed>
          <DescriptionOfWorkSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View fixed>
          <ScopeOfWorkSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View style={[{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]} fixed>
          <RiskAssessmentSection data={data as FieldLevelRiskAssessmentType} />
          <View style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TcpLctPresentSection data={data as FieldLevelRiskAssessmentType} />
            <SignatureSection data={data as FieldLevelRiskAssessmentType} />
          </View>
        </View>
        <View style={{ position: 'absolute', bottom: 0 }} fixed>
          <FooterBanner />
        </View>
      </Page>

      {/* Second Page  */}
      <Page size="A4" style={[styles.page]}>
        <View style={{ position: 'relative', top: 0 }}>
          <Banner />
        </View>
        <View>
          <Header />
        </View>
        <View>
          <TrafficControlPlanSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View>
          <UpdatesTableSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View>
          <LevelOfSupervisionSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View>
          <AuthorizationSection data={data as FieldLevelRiskAssessmentType} />
        </View>
        <View style={[{ justifyContent: 'flex-end' }, styles.container]}>
          <Text style={[{ fontSize: 8 }, styles.textBold]}>
            Please note that you all have the right to refuse unsafe work!
          </Text>
        </View>
        <View style={{ position: 'absolute', bottom: 0 }} fixed>
          <FooterBanner />
        </View>
      </Page>

      {/* FLRA Diagram Pages - One page per image */}
      {(() => {
        if (!data.flraDiagram || data.flraDiagram.trim() === '') return null;

        // Try to parse as JSON array (new format)
        try {
          const images = JSON.parse(data.flraDiagram);
          if (Array.isArray(images) && images.length > 0) {
            return images.map((image: string, index: number) => (
              <Page key={`diagram-${index}`} size="A4" style={[styles.page]}>
                <View style={{ position: 'relative', top: 0 }}>
                  <Banner />
                </View>
                <View>
                  <Header />
                </View>
                <View style={styles.container}>
                  <Text style={[{ padding: '10px 0', fontSize: 16 }, styles.textBold]}>
                    FLRA DIAGRAM {images.length > 1 ? `(${index + 1} of ${images.length})` : ''}
                  </Text>
                  <View
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 20,
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      padding: 22,
                      height: 520,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={image}
                      style={{
                        maxWidth: 476,
                        maxHeight: 476,
                        objectFit: 'contain',
                      }}
                    />
                  </View>
                </View>
                <View style={{ position: 'absolute', bottom: 0 }} fixed>
                  <FooterBanner />
                </View>
              </Page>
            ));
          }
        } catch {
          // If parsing fails, treat as single image (old format)
          return (
            <Page size="A4" style={[styles.page]}>
              <View style={{ position: 'relative', top: 0 }}>
                <Banner />
              </View>
              <View>
                <Header />
              </View>
              <View style={styles.container}>
                <Text style={[{ padding: '10px 0', fontSize: 16 }, styles.textBold]}>
                  FLRA DIAGRAM
                </Text>
                <View
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20,
                    border: '1px solid #ccc',
                    borderRadius: 8,
                    padding: 22,
                    height: 520,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={data.flraDiagram}
                    style={{
                      maxWidth: 476,
                      maxHeight: 476,
                      objectFit: 'contain',
                    }}
                  />
                </View>
              </View>
              <View style={{ position: 'absolute', bottom: 0 }} fixed>
                <FooterBanner />
              </View>
            </Page>
          );
        }
        return null;
      })()}
    </Document>
  );
}
