import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const JOB_ENDPOINT = endpoints.work.job;

// ----------------------------------------------------------------------

export function useGetUserJobDates() {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['user-job-dates'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetcher(`${JOB_ENDPOINT}/user-dates`);
      
      // Handle both response.data and direct response
      const responseData = response.data || response;
      return responseData.jobDates || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Hook to invalidate user job dates when jobs are updated
export function useInvalidateUserJobDates() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => 
      // This is just a placeholder - the actual invalidation happens in onSuccess
       Promise.resolve()
    ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-job-dates'] });
    },
  });
} 
 