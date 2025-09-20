import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobMultiCreateForm } from '../open-job-create-form';

// ----------------------------------------------------------------------

export function MultiCreateJobView() {
  const searchParams = useSearchParams();
  const [duplicateJob, setDuplicateJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're duplicating a job
  const duplicateJobId = searchParams.get('duplicate');

  // Fetch user list for employee options
  const { data: userListData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'job-creation'],
    queryFn: async () => {
      const response = await fetcher(`${endpoints.management.user}/job-creation`);
      return response.data.users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    const fetchDuplicateJob = async () => {
      if (!duplicateJobId) return;

      setIsLoading(true);
      try {
        const response = await fetcher(`${endpoints.work.job}/${duplicateJobId}`);
        setDuplicateJob(response.data);
      } catch (error) {
        console.error('Failed to fetch job for duplication:', error);
        // Continue without the duplicate data
      } finally {
        setIsLoading(false);
      }
    };

    fetchDuplicateJob();
  }, [duplicateJobId]);

  if (isLoading || isLoadingUsers) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={duplicateJobId ? 'Duplicate Job' : 'Create Job'}
        links={[
          { name: 'Work Management' },
          { name: 'Job' },
          { name: duplicateJobId ? 'Duplicate Job' : 'Create Job' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <JobMultiCreateForm currentJob={duplicateJob} userList={userListData} />
      {/* Debug info */}
      {duplicateJob && (
        <div style={{ display: 'none' }}>
          Debug: duplicateJob is set with client: {duplicateJob.client?.name}, site:{' '}
          {duplicateJob.site?.name}
        </div>
      )}
    </DashboardContent>
  );
}
