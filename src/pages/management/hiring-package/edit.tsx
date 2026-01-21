import { CONFIG } from 'src/global-config';
// ----------------------------------------------------------------------

const metadata = { title: `Hiring Package | Edit - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
    </>
  );
}
