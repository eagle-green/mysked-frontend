import type { NewHire, ManagementAgreement } from 'src/types/new-hire';

import dayjs from 'dayjs';
import { Text, View, Image } from '@react-pdf/renderer';

import { hasPdfImageSrc } from 'src/utils/safe-pdf-image-src';
import {
  formatPersonNameTitleCase,
  hiringManagerSignatureLineName,
} from 'src/utils/format-pdf-display';

function formatPdfSignedDate(iso?: string | null): string {
  const s = iso?.trim();
  if (!s) return '';
  const d = dayjs(s);
  return d.isValid() ? d.format('MM/DD/YYYY') : '';
}

type Props = {
  data: NewHire;
  /** Policy row shared by employee acknowledgement and hiring-manager signing. */
  policyKey: keyof ManagementAgreement;
};

/**
 * Employee + hiring manager signature images, printed names, and signed dates for EG policy PDFs.
 */
export function PolicySignatureFooterPdf({ data, policyKey }: Props) {
  const employeeName = formatPersonNameTitleCase(
    data.employee.first_name,
    data.employee.last_name,
    data.employee.middle_initial
  );
  const hiringManagerName = hiringManagerSignatureLineName(data, policyKey);

  const empAgreed = data.policy_agreement[policyKey];
  const hmAgreed = data.supervisor_agreement[policyKey];

  const empSig = (data.policy_agreement_signatures?.[policyKey] ?? '').trim();
  const hmSig = (data.supervisor_agreement_signatures?.[policyKey] ?? '').trim();

  const empDate = formatPdfSignedDate(data.policy_agreement_signed_at?.[policyKey]);
  const hmDate = formatPdfSignedDate(data.supervisor_agreement_signed_at?.[policyKey]);

  const column = (opts: {
    agreed: boolean;
    sig: string;
    name: string;
    date: string;
    label: string;
  }) => (
    <View
      style={{
        width: '46%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          height: 52,
          width: '100%',
          borderBottomWidth: 1,
          borderBottomColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {opts.agreed && hasPdfImageSrc(opts.sig) ? (
          <Image src={opts.sig} style={{ width: 130, height: 46 }} />
        ) : null}
      </View>
      <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold', marginTop: 4 }}>
        {opts.agreed ? opts.name : ''}
      </Text>
      <Text style={{ fontSize: 9, fontFamily: 'Roboto-Regular', marginTop: 2 }}>
        {opts.agreed ? opts.date : ''}
      </Text>
      <Text style={{ fontSize: 10, fontFamily: 'Roboto-Bold', marginTop: 4 }}>{opts.label}</Text>
    </View>
  );

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 16,
      }}
    >
      {column({
        agreed: !!empAgreed,
        sig: empSig,
        name: employeeName,
        date: empDate,
        label: 'EMPLOYEE',
      })}
      {column({
        agreed: !!hmAgreed,
        sig: hmSig,
        name: hiringManagerName,
        date: hmDate,
        label: 'HIRING MANAGER',
      })}
    </View>
  );
}
