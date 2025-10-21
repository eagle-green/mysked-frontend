import { useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { LandingView } from 'src/sections/home/landing-view';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function LandingPage() {
  const router = useRouter();
  const { authenticated, loading } = useAuthContext();

  useEffect(() => {
    // If user is authenticated, redirect to their dashboard
    if (authenticated && !loading) {
      router.replace('/schedules/work/list?page=1&rowsPerPage=25&orderBy=start_time&order=asc&dense=true');
    }
  }, [authenticated, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return null; // or a loading spinner
  }

  // If authenticated, don't render landing page (redirect will happen)
  if (authenticated) {
    return null;
  }

  // Show landing page for unauthenticated users
  return <LandingView />;
}

