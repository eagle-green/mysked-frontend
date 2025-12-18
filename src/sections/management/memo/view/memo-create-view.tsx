import { useQuery } from '@tanstack/react-query';

import { paths } from 'src/routes/paths';

import { endpoints, fetcher } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard/content';

import { LoadingScreen } from 'src/components/loading-screen/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import { CreateCompanyWideMemoForm } from '../memo-create-form';

//-------------------------------------------------------------------------------

export function CreateCompanyWideMemoView() {
  const { data: userListData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'memo-creation'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}`);
      console.log(response);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoadingUsers) {
    return <LoadingScreen />;
  }
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Company Wide Memo"
        links={[{ name: 'Management', href: paths.management.root }, { name: 'Create Memo' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CreateCompanyWideMemoForm userList={userListData} />
    </DashboardContent>
  );
}
