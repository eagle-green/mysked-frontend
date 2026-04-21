import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { NewHireEmployeeInformationForm } from 'src/sections/management/onboarding/new-hire-employee/new-hire-employee-form';

const JWT_KEY = 'hiring_package_candidate_jwt';

// ----------------------------------------------------------------------

export default function OnboardingCandidateFormPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem(JWT_KEY);
    if (!t) {
      navigate(paths.onboardingCandidate, { replace: true });
      return;
    }
    setToken(t);
  }, [navigate]);

  if (!token) {
    return (
      <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <NewHireEmployeeInformationForm hiringPackageAccessToken={token} />
    </Container>
  );
}
