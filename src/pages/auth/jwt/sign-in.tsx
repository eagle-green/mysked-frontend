import { CONFIG } from 'src/global-config';

import { CenteredSignInView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `Sign in | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CenteredSignInView />
    </>
  );
}
