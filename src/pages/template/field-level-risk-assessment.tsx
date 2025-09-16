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
    padding: '0 30px',
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
    padding: '0 2px',
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
  noBorderTableHead: {
    border: '0 solid #fff',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    fontSize: 10,
    paddingLeft: 5,
    paddingBottom: 2,
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
    width: 100,
    height: 50,
    marginLeft: 10,
  },
});

const Banner = () => (
  <View style={{ position: 'relative', top: 0 }}>
    <Image src="/pdf/banner.png" style={[styles.container]} fixed />
  </View>
);

const FooterBanner = () => (
  <View style={{ position: 'relative', bottom: 0, width: '100%' }}>
    <Text
      style={{ width: '480px', fontSize: '8px', textAlign: 'right', marginBottom: 2 }}
      render={({ pageNumber, totalPages, subPageNumber, subPageTotalPages }) =>
        `Page ${pageNumber} out of ${totalPages}`
      }
      fixed
    />
    <Image src="/pdf/banner-footer.png" style={[styles.container]} fixed />
  </View>
);

const Check = () => (
  <Svg width="12" height="12" viewBox="0 0 12 12">
    <Path d="M3,6 L5,8 L9,4" fill="none" stroke="black" strokeWidth="1" />
  </Svg>
);

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
      <Image style={styles.header.logo} src="/logo/eaglegreen-single.png" />{' '}
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
    road: string;
    distance: string;
    weather: string;
  };
  scopeOfWork: {
    roadType: string[];
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
  };
  trafficControlPlans: [
    {
      hazard_risk_assessment: string;
      control_measure: string;
    },
  ];
  updates: [
    {
      date_time_updates: string;
      changes: string;
      additional_control: string;
      initial: string;
    },
  ];
  responsibilities: [
    {
      role: string;
      serialNumber: string;
      responsibility: string;
      initial: string;
    },
  ];
  authorizations: [
    {
      fullName: string;
      company: string;
      date_time: string;
    },
  ];
  supervisionLevels: {
    communicationMode: boolean;
    pictureSubmission: boolean;
    supervisorPresence: boolean;
  };
  signature: string | null;
};

type FlraContentProps = {
  data: FieldLevelRiskAssessmentType;
};
const AssessmentDetailSection = ({ data }: FlraContentProps) => (
  <Table style={[styles.table, styles.container]}>
    <TH style={[styles.tableHeader, styles.textBold]}>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>NAME : {data.full_name}</Text>
      </TD>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>DATE : {data.date}</Text>
      </TD>
    </TH>
    <TH style={[styles.tableHeader, styles.textBold]}>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>SITE FOREMAN NAME : {data.site_foreman_name}</Text>
      </TD>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>CONTACT NUMBER : {data.contact_number}</Text>
      </TD>
    </TH>
    <TH style={[styles.tableHeader, styles.textBold]}>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>COMPANY CONTRACTED TO : {data.company_contract}</Text>
      </TD>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>CLOSEST HOSPITAL : {data.closest_hospital}</Text>
      </TD>
    </TH>
    <TH style={[styles.tableHeader, styles.textBold]}>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>SITE LOCATION : {data.site_location}</Text>
      </TD>
      <TD
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '1px 2px',
        }}
      >
        <Text style={[{ flex: 1 }, styles.textUpperCase]}>START TIME: {data.start_time}</Text>
        <Text style={[{ flex: 1 }, styles.textUpperCase]}>END TIME: {data.end_time}</Text>
      </TD>
    </TH>
    <TH style={[styles.tableHeader, styles.textBold]}>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>FIRST AID ON SITE : {data.first_aid_on_site}</Text>
      </TD>
      <TD style={styles.th}>
        <Text style={styles.textUpperCase}>FIRST AID KIT : {data.first_aid_kit}</Text>
      </TD>
    </TH>
  </Table>
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
      {label} {underline && <>__________________________</>}{' '}
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
  <View style={[styles.row, { gap: 10, marginHorizontal: 5 }]}>
    {label && (
      <View style={{ width: labelContainerWidth ? labelContainerWidth : 70 }}>
        <Text style={[{ fontSize: labelFontSize ? labelFontSize : 10 }, styles.textBold]}>
          {label}
        </Text>
      </View>
    )}
    <View style={styles.checkboxContainer}>
      {items.map((item, index) => (
        <View key={index} style={{ width: item.size }}>
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
  const { road, distance, weather } = data.descriptionOfWork;
  const normalizedValues = {
    road: road?.toLowerCase(),
    distance: distance?.toLowerCase(),
    weather: weather?.toLowerCase(),
  };

  const createCheckboxItems = (field: keyof typeof normalizedValues, options: Array<any>) =>
    options.map(({ label, size, underlined = false, matchValue }) => ({
      label,
      size,
      underlined,
      isChecked: normalizedValues[field] === matchValue.toLowerCase(),
    }));

  const checkboxItems = [
    {
      label: 'Road',
      items: createCheckboxItems('road', [
        { label: 'City', size: 50, matchValue: 'city' },
        { label: 'Rural', size: 50, matchValue: 'rural' },
        { label: 'HWY', size: 60, matchValue: 'hwy' },
        { label: 'Other', size: 150, underlined: true, matchValue: 'other' },
      ]),
    },
    {
      label: 'Sight Distance',
      items: createCheckboxItems('distance', [
        { label: 'Hill', size: 50, matchValue: 'hill' },
        { label: 'Curve', size: 50, matchValue: 'curve' },
        { label: 'Obstacle', size: 60, matchValue: 'obstacle' },
        { label: 'Other', size: 150, underlined: true, matchValue: 'other' },
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
            margin: '5px 0',
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
  const { roadType, contractToolBox } = data.scopeOfWork;
  const createCheckboxItems = (options: Array<any>, checkValues: string[]) =>
    options.map(({ label, size, underlined = false, matchValue }) => ({
      label,
      size,
      underlined,
      isChecked: checkValues.some((val) => roadType.includes(val) && val === matchValue),
    }));

  const checkboxItems = [
    {
      label: '',
      items: createCheckboxItems(
        [
          { label: 'Single Lane Alternating', size: 120, matchValue: 'alternating' },
          { label: 'Lane Closure', size: 100, matchValue: 'closure' },
          { label: 'Road Closed', size: 80, matchValue: 'close' },
          { label: 'Other', size: 80, matchValue: 'other' },
        ],
        ['alternating', 'closure', 'close', 'other']
      ),
    },
    {
      label: '',
      items: createCheckboxItems(
        [
          { label: 'Shoulder Work', size: 120, matchValue: 'work' },
          { label: 'Turn Lane Closure', size: 100, matchValue: 'turn' },
          { label: 'Showing Traffic', size: 85, matchValue: 'traffic' },
        ],
        ['work', 'turn', 'traffic']
      ),
    },
  ];

  return (
    <View style={[styles.container]}>
      <Text
        style={[
          {
            margin: '5px 0',
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
                marginBottom: 10,
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

  const renderCheckBox = (value: string) => ({
    low: value === 'low' ? <Check /> : '',
    med: value === 'medium' ? <Check /> : '',
    high: value === 'high' ? <Check /> : '',
  });

  const rows = riskFactors.map(({ key, desc }) => ({
    desc,
    ...renderCheckBox(assessment[key]),
  }));
  return (
    <View style={{ width: 250 }}>
      <Table style={[styles.table, styles.container, { width: '100%' }]}>
        <TH style={[styles.tableHeader, styles.textBold]}>
          <TD style={[{ flex: 4 }, styles.noBorderTableHead]}>RISK ASSESSMENT</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>LOW</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>MED</TD>
          <TD style={[{ flex: 1 }, styles.noBorderTableHead]}>HIGH</TD>
        </TH>
        {rows.map((row) => (
          <TR>
            <TD style={[styles.td, { flex: 4 }]}> {row.desc}</TD>
            <TD style={[styles.td, { flex: 1 }]}>{row.low}</TD>
            <TD style={[styles.td, { flex: 1 }]}>{row.med}</TD>
            <TD style={[styles.td, { flex: 1 }]}>{row.high}</TD>
          </TR>
        ))}
        <TH style={[styles.tableHeader, styles.textBold]}>
          <TD style={[{ textDecoration: 'underline', flex: 4, padding: '0 2px' }, styles.textBold]}>
            <Text style={{ fontSize: 12 }}>OVERALL RISK</Text>
          </TD>
          <TD style={[{ flex: 1, textDecoration: 'underline', padding: '0 2px' }, styles.textBold]}>
            LOW
          </TD>
          <TD style={[{ flex: 1, textDecoration: 'underline', padding: '0 2px' }, styles.textBold]}>
            MED
          </TD>
          <TD style={[{ flex: 1, textDecoration: 'underline', padding: '0 2px' }, styles.textBold]}>
            HIGH
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
      label: 'Is the escape route identified ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: createCheckboxItems('identified', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
    {
      label: 'Does the speed need to be reduced ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: createCheckboxItems('reduce', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
    {
      label: 'New LCT/TCP (Less than 2 years of exp) ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: createCheckboxItems('experienced', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
    {
      label: 'Do you need to complete a Young/New Worker Form ?',
      labelContainerWidth: 120,
      labelFontSize: 7,
      items: createCheckboxItems('complete', [
        { label: 'Yes', size: 40, matchValue: 'yes' },
        { label: 'No', size: 40, matchValue: 'no' },
      ]),
    },
  ];
  return (
    <View style={{ width: 220 }}>
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
              gap: 10,
              alignItems: 'center',
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
      width: 220,
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
        {data?.signature ? (
          <Image source={{ uri: data.signature }} style={styles.signatureImage} />
        ) : (
          <Text>No signature available</Text>
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
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>
                {item.hazard_risk_assessment}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {item.control_measure !== '' ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{item.control_measure}</TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
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
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>DATE AND TIME</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>CHANGES</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>
            ADDITIONAL CONTROL
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>INITIAL</TD>
        </TH>
        {changes.map((change, index) => (
          <TR key={index}>
            {change.date_time_updates ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>
                {change.date_time_updates}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {change.changes ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>{change.changes}</TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {change.additional_control ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>
                {change.additional_control}
              </TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {change.initial ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{change.initial}</TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            )}
          </TR>
        ))}
      </Table>
      <Table style={{ width: '100%', marginTop: 20 }}>
        <TH style={[styles.tableHeaderColored, styles.textBold]}>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>ROLES</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 2 }}>SN #</TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 3 }}>
            RESPONSIBILITIES
          </TD>
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>INITIAL</TD>
        </TH>
        {roles.map((item, index) => (
          <TR key={index}>
            {item.role ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{item.role}</TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {item.serialNumber ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>{item.serialNumber}</TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {item.responisibility ? (
              <TD style={[styles.td, { flex: 3, padding: '4px 2px' }]}>{item.responsibility}</TD>
            ) : (
              <TD style={[styles.td, { flex: 3, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {item.initial ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{item.initial}</TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
            )}
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
            <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{level.content}</TD>
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
          <TD style={{ justifyContent: 'center', padding: '4px 2px', flex: 1 }}>DATE AND TIME</TD>
        </TH>
        {items.map((item, index) => (
          <TR key={index}>
            {item.fullName ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>{item.fullName}</TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {item.company ? (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>{item.company}</TD>
            ) : (
              <TD style={[styles.td, { flex: 2, padding: '4px 2px' }]}>&nbsp;</TD>
            )}

            {item.date_time ? (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>{item.date_time}</TD>
            ) : (
              <TD style={[styles.td, { flex: 1, padding: '4px 2px' }]}>&nbsp;</TD>
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
    date: toDayjs(assessment.date).format('DD/MM/YYYY'),
    start_time: toDayjs(assessment.start_time).format('hh:mm A'),
    end_time: toDayjs(assessment.end_time).format('hh:mm A'),
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
          <AssessmentDetailSection data={data} />
        </View>
        <View fixed>
          <DescriptionOfWorkSection data={data} />
        </View>
        <View fixed>
          <ScopeOfWorkSection data={data} />
        </View>
        <View style={[{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]} fixed>
          <RiskAssessmentSection data={data} />
          <View style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TcpLctPresentSection data={data} />
            <SignatureSection data={data} />
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
          <TrafficControlPlanSection data={data} />
        </View>
        <View>
          <UpdatesTableSection data={data} />
        </View>
        <View>
          <LevelOfSupervisionSection data={data} />
        </View>
        <View>
          <AuthorizationSection data={data} />
        </View>
        <View style={[{ justifyContent: 'flex-end' }, styles.container]}>
          <Text style={[{ fontSize: 8 }, styles.textBold]}>
            Please note that you all have the right to refuse unsafe work!
          </Text>
        </View>
        <View style={{ position: 'absolute', bottom: 0 }}>
          <FooterBanner />
        </View>
      </Page>
    </Document>
  );
}
