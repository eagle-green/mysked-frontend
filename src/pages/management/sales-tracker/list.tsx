import { CONFIG } from 'src/global-config';
import { SalesTrackerListView } from 'src/sections/management/sales-tracker/view/sales-tracker-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Sales Tracker | ${CONFIG.appName}` };

export default function SalesTrackerListPage() {
  return <SalesTrackerListView />;
}

SalesTrackerListPage.metadata = metadata;
