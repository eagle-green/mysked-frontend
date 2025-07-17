import { useState, useEffect } from 'react';

import { useSearchParams } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobMultiCreateForm } from '../job-create-form';

// ----------------------------------------------------------------------

export function MultiCreateJobView() {
  const searchParams = useSearchParams();
  const [duplicateJob, setDuplicateJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're duplicating a job
  const duplicateJobId = searchParams.get('duplicate');

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

  if (isLoading) {
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

      <JobMultiCreateForm currentJob={duplicateJob} />
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
