import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const metadata = { title: `Pre Trip Vehicle Inspection Create | My Schedule - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
    </>
  );
}
