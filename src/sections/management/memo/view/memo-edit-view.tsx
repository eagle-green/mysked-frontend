import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard/content';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { EditCompanyWideMemoForm } from '../memo-edit-form';

//-------------------------------------------------------------------------------

const CURRENT_MEMO_TEST = {
  id: 'd66da964-5f11-48ac-98c9-45fa87c04aa7',
  memo_title: 'Sample Memo Title',
  memo_content:
    'Desing & Implement create page completed. But need for some enahance for the layout and still working on it, Desing & Implement create page completed. But need for some enahance for the layout and still working on it, Desing & Implement create page completed. But need for some enahance for the layout and still working on it.',
  pending_items: [
    {
      memo_title: 'Implement table view for company wide memo',
      status: 'done',
      assignee_id: '79979cdd-18c0-4072-a5da-caf8a74f3147',
      user: {
        id: '79979cdd-18c0-4072-a5da-caf8a74f3147',
        name: 'Jerwin Fortillano',
        photo_logo_url: null,
      },
    },
    {
      memo_title: 'Create company wide memo creation page',
      status: 'in_progress',
      assignee_id: 'a52fba35-93af-4f3f-b6a7-d7c7efbf340f',
      user: {
        id: 'a52fba35-93af-4f3f-b6a7-d7c7efbf340f',
        name: 'Jerwin Tosil',
        photo_logo_url: null,
      },
    },
  ],
  published_by: {
    logo_url: null,
    name: 'Kiwoon Jung',
  },
  published_date: new Date(),
  activity_feed: [
    {
      id: '5949921e-4042-4c5c-be6e-b3d4f51b4b63',
      description: 'Sample note updates',
      posted_date: '2025-12-23T12:19:43.088Z',
      user: {
        id: 'a52fba35-93af-4f3f-b6a7-d7c7efbf340f',
        name: 'Jerwin Tosil',
        photo_logo_url: null,
      },
      replies: [
        {
          id: 'ad7c138c-6fa7-496b-9a34-cab3230af449',
          description: 'Sample note reply updates',
          posted_date: '2025-12-23T12:20:52.441Z',
          tag_user: 'Jerwin Tosil',
          user: {
            id: '79979cdd-18c0-4072-a5da-caf8a74f3147',
            name: 'Jerwin Fortillano',
            photo_logo_url: null,
          },
        },
      ],
    },
  ],
};

export function EditCompanyWideMemoView() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['company-wide-memo', id],
    queryFn: async () => {
      if (!id) return null;
      //TODO:: create endpoints for company memo
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
