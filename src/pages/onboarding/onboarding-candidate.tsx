import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/lib/axios';
import { CONFIG } from 'src/global-config';

const STORAGE_INVITE = 'hiring_package_invite_token';

// ----------------------------------------------------------------------

export default function OnboardingCandidatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const rawInviteToken =
    tokenFromUrl || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_INVITE) : null);

  useEffect(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem(STORAGE_INVITE, tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validate = useCallback(async () => {
    if (!rawInviteToken) {
      setInviteError('This link is missing a token. Open the link from your invitation email.');
      setValidating(false);
      return;
    }

    try {
      const res = await fetch(
        `${CONFIG.serverUrl}${endpoints.hiringPackages.publicValidate}?token=${encodeURIComponent(rawInviteToken)}`
      );
      const json = await res.json().catch(() => ({}));

      if (res.status === 410) {
        setInviteError(json.error || 'This invite has expired. Ask HR for a new link.');
        setValidating(false);
        return;
      }

      if (!res.ok) {
        setInviteError(json.error || 'Invalid or expired invite.');
        setValidating(false);
        return;
      }

      if (json.data?.masked_email) {
        setMaskedEmail(json.data.masked_email);
      }
    } catch {
      setInviteError('Could not verify the invite. Check your connection and try again.');
    } finally {
      setValidating(false);
    }
  }, [rawInviteToken]);

  useEffect(() => {
    validate();
  }, [validate]);

  const handleRequestOtp = async () => {
    if (!rawInviteToken) return;
    setRequestError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${CONFIG.serverUrl}${endpoints.hiringPackages.publicRequestOtp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawInviteToken, email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(json.error || 'Could not send code');
        return;
      }
      setStep('code');
    } catch {
      setRequestError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!rawInviteToken) return;
    setRequestError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${CONFIG.serverUrl}${endpoints.hiringPackages.publicVerifyOtp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawInviteToken,
          email: email.trim(),
          code: code.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(json.error || 'Verification failed');
        return;
      }

      const accessToken = json.data?.access_token as string | undefined;
      if (!accessToken) {
        setRequestError('Unexpected response from server');
        return;
      }

      sessionStorage.setItem('hiring_package_candidate_jwt', accessToken);
      sessionStorage.removeItem(STORAGE_INVITE);
      navigate(paths.onboardingCandidateForm);
    } catch {
      setRequestError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (inviteError) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Card sx={{ p: 4, maxWidth: 480 }}>
          <Typography variant="h6" gutterBottom>
            Cannot open hiring package
          </Typography>
          <Typography color="text.secondary">{inviteError}</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ p: 4, maxWidth: 480, width: 1 }}>
        <Typography variant="h5" gutterBottom>
          Verify your email
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter the same email HR used for this invite
          {maskedEmail ? ` (hint: ${maskedEmail})` : ''}. We will send a one-time code to that inbox.
        </Typography>

        {step === 'email' ? (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {requestError ? (
              <Typography color="error" variant="body2">
                {requestError}
              </Typography>
            ) : null}
            <Button
              variant="contained"
              size="large"
              disabled={submitting || !email.trim()}
              onClick={handleRequestOtp}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send verification code'}
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
            />
            {requestError ? (
              <Typography color="error" variant="body2">
                {requestError}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setStep('email')} disabled={submitting}>
                Back
              </Button>
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting || code.length < 6}
                onClick={handleVerify}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
