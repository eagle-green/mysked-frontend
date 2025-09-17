import { CONFIG } from 'src/global-config';

import { FieldLevelRiskAssessmentFormView } from 'src/sections/schedule/flra/view';

//---------------------------------------------------------------------------------

const metadata = { title: `Field Level Risk Assessment - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FieldLevelRiskAssessmentFormView />
    </>
  );
}
