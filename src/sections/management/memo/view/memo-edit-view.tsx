import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { EditCompanyWideMemoForm } from '../memo-edit-form';

//-------------------------------------------------------------------------------

const CURRENT_MEMO_TEST = {
  id: 'd66da964-5f11-48ac-98c9-45fa87c04aa8',
  memo_title: 'Implement Company Wide Memo Features',
  memo_content:
    "This memo serves as a reminder for today's traffic control duties. Key areas requiring attention include ongoing construction zones and planned detours, particularly around 123 Bonifacio Bacolod, NCR 6000, 6000, where congestion is expected. Ensure traffic is rerouted smoothly and safely, following all safety protocols, with a focus on visible, operational signal equipment. Be prepared to respond quickly to any incidents or accidents and notify dispatch for additional support if necessary. Keep communication lines open, and if issues arise, report them immediately. At the end of your shift, please submit your report, detailing any unusual occurrences or challenges encountered. Thank you for your cooperation in ensuring a safe and efficient operation today.",
  published_date: new Date(),
  published_by: {
    first_name: 'Kiwoon Jung',
    client_logo_url: null,
    client_name: null,
  },
  assigned_by: {
    first_name: 'Jerwin Fortillano',
    client_logo_url: null,
    client_name: null,
  },
  status: 'in_progress',
  pendingItemDone: 2,
  pendingItemCounts: 5,
  client: {
    name: 'Eagle Green',
    client_logo_url: null,
    client_name: null,
  },
  pendingMemos: [{ pendingMemo: '', status: 'pending' }],
};

export function EditCompanyWideMemoView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['company-wide-memo', id],
    queryFn: async () => {
      if (!id) return null;
      //TODO:: create endpoints for incident report
      //const response = await fetcher(``);
      return CURRENT_MEMO_TEST;
    },
    enabled: !!id,
  });

  if (!data) return null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Company Wide Memo"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'Edit Memo' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EditCompanyWideMemoForm data={data} />
    </DashboardContent>
  );
}
