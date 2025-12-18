import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { IMemo } from 'src/types/memo';

import { EditCompanyWideMemoForm } from '../memo-edit-form';

//-------------------------------------------------------------------------------

const CURRENT_MEMO_TEST: IMemo = {
  id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
  assignee_id: 'd66da964-5f11-48ac-98c9-45fa87c04aa9',
  memo_title: 'Sample Wide Memo Title',
  memo_content:
    'Desing & Implement create page completed. But need for some enahance for the layout and still working on it, Desing & Implement create page completed. But need for some enahance for the layout and still working on it, Desing & Implement create page completed. But need for some enahance for the layout and still working on it.',
  pendingMemos: [
    { pendingMemo: 'Implement table view for company wide memo', status: 'done' },
    { pendingMemo: 'Create company wide memo creation page', status: 'done' },
    { pendingMemo: 'Create company wide memo edit page', status: 'pending' },
  ],
  memo_visibility: true,
  company: {
    id: 'd66da964-5f11-48ac-98c9-45fa87c04aa9',
    region: 'Metro Vancouver',
    name: 'EAGLEGREEN',
    logo_url: null,
    email: 'eaglegreen@company.com',
    contact_number: '',
    unit_number: '',
    street_number: '',
    street_name: '',
    city: '',
    province: 'British Columbia',
    postal_code: '',
    country: '',
    status: 'active',
    fullAddress: 'BC',
    phoneNumber: '',
  },
  client: {
    id: 'cff721e9-0638-440f-8a39-2942fcf21147',
    region: 'Vancouver Island',
    name: 'Adam Worden AFL',
    logo_url: null,
    email: 'adam.worden@aflglobal.com',
    contact_number: '+12506680846',
    unit_number: '',
    street_number: '',
    street_name: '',
    city: '',
    province: '',
    postal_code: '',
    country: '',
    status: 'active',
    fullAddress: '',
    phoneNumber: '+12506680846',
  },
  site: {
    id: 'facfdcd8-be3e-4de9-8329-4ee039fb88af',
    company_id: '',
    name: 'EAGLEGREEN',
    email: '',
    contact_number: '',
    unit_number: '',
    street_number: '',
    street_name: '',
    city: 'Silay City',
    province: 'British Columbia',
    postal_code: 'C2C 1D2',
    country: '',
    status: 'active',
    fullAddress: '123123 1312312 123123\nSilay City BC C2C 1D2',
    phoneNumber: '',
  },
  published_by: {
    logo_url: null,
    name: 'Kiwoon Jung',
  },
  published_date: new Date(),
  assigned_by: {
    logo_url: null,
    name: 'Jerwin Fortillano',
  },
  activity_feed: [
    {
      id: 'facfdcd8-be3e-4de9-8329-4ee039fb88ad',
      user: {
        id: 'facfdcd8-be3e-4de9-8329-4ee039fb88ad',
        name: 'Kiwoon Jung',
        logo: null,
      },
      feed_posted:
        'Desing & Implement create page completed. But need for some enahance for the layout and still working on it',
      posted_date: new Date(),
    },
    {
      id: 'facfdcd8-be3e-4de9-8329-4ee039fb88ad',
      user: {
        id: '79979cdd-18c0-4072-a5da-caf8a74f3147',
        name: 'Jerwin Fortillano',
        logo: null,
      },
      feed_posted:
        'Desing & Implement create page completed. But need for some enahance for the layout and still working on it',
      posted_date: new Date(),
    },
    {
      id: 'facfdcd8-be3e-4de9-8329-4ee039fb88ad',
      user: {
        id: 'facfdcd8-be3e-4de9-8329-4ee039fb88ad',
        name: 'Kiwoon Jung',
        logo: null,
      },
      feed_posted:
        'Desing & Implement create page completed. But need for some enahance for the layout and still working on it',
      posted_date: new Date(),
    },
  ],
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
