import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import axiosInstance, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify/iconify';

import {
  SalaryType,
  EmployeeType,
  HRSP_P_OPTIONS,
  RadioButtonValues,
  WORK_SCHEDULE_OPTIONS,
  ONBOARDING_INVITE_POSITION_OPTIONS,
} from 'src/types/new-hire';

// ----------------------------------------------------------------------

const LAST_INVITE_STORAGE_KEY = 'mysked:hiringInvite:lastCreate';

type StoredInvite = {
  packageId: string;
  inviteUrl: string;
  invitedEmail: string;
  inviteEmailSent: boolean;
};

function readStoredInvite(): StoredInvite | null {
  try {
    const raw = sessionStorage.getItem(LAST_INVITE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredInvite;
    if (!p?.packageId || !p?.inviteUrl) return null;
    return p;
  } catch {
    return null;
  }
}

function writeStoredInvite(data: StoredInvite) {
  try {
    sessionStorage.setItem(LAST_INVITE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

function clearStoredInvite() {
  try {
    sessionStorage.removeItem(LAST_INVITE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onCreated: VoidFunction;
};

/** Allow only digits and one `.` (e.g. `21.5`). */
function sanitizeHourlyRateInput(raw: string): string {
  const noLetters = raw.replace(/[^\d.]/g, '');
  const dot = noLetters.indexOf('.');
  if (dot === -1) return noLetters;
  return noLetters.slice(0, dot + 1) + noLetters.slice(dot + 1).replace(/\./g, '');
}

function parseHourlyRate(raw: string): number | null {
  const t = raw.trim();
  if (t === '' || t === '.') return null;
  const n = Number(t);
  if (Number.isNaN(n)) return null;
  return n;
}

export function HiringPackageInviteDialog({ open, onClose, onCreated }: Props) {
  const [invitedEmail, setInvitedEmail] = useState('');
  const [position, setPosition] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [workSchedule, setWorkSchedule] = useState('');
  const [hrsp, setHrsp] = useState('');
  const [isReferred, setIsReferred] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  /** Whether the server emailed the link (false = show copy fallback). */
  const [inviteEmailSent, setInviteEmailSent] = useState<boolean | null>(null);

  const reset = useCallback(() => {
    setInvitedEmail('');
    setPosition('');
    setHourlyRate('');
    setWorkSchedule('');
    setHrsp('');
    setIsReferred('');
    setReferredBy('');
    setInviteUrl(null);
    setInviteEmailSent(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  /** Restore last invite link when reopening this dialog (same browser tab/session). */
  useEffect(() => {
    if (!open) return;
    const saved = readStoredInvite();
    if (!saved) return;
    setInviteUrl(saved.inviteUrl);
    setInviteEmailSent(saved.inviteEmailSent);
    setInvitedEmail(saved.invitedEmail);
  }, [open]);

  const handleStartNewInvite = useCallback(() => {
    clearStoredInvite();
    reset();
  }, [reset]);

  /** Avoid closing on backdrop click so partial form data is not lost; Cancel/Close still runs `handleClose`. */
  const handleDialogClose = useCallback(
    (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (reason === 'backdropClick') return;
      handleClose();
    },
    [handleClose]
  );

  const handleSubmit = async () => {
    const email = invitedEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    const rate = parseHourlyRate(hourlyRate);
    if (rate === null) {
      toast.error('Enter a valid hourly rate');
      return;
    }
    if (rate < 0) {
      toast.error('Hourly rate must be 0 or greater');
      return;
    }
    if (!position) {
      toast.error('Select position');
      return;
    }
    if (!workSchedule) {
      toast.error('Select work schedule');
      return;
    }
    if (!hrsp) {
      toast.error('Select HRS P');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosInstance.post(endpoints.hiringPackages.create, {
        invited_email: email,
        hire_type: position,
        form_data: {
          contract_detail: {
            position,
            is_union: EmployeeType.NON_UNION,
            work_schedule: workSchedule,
            hrsp,
            salary_wage: SalaryType.WK,
            rate,
            is_refered: isReferred,
            refered_by: isReferred === RadioButtonValues.YES ? referredBy.trim() : '',
          },
        },
      });
      const data = res.data?.data as {
        id?: string;
        invite_url?: string;
        invite_email_sent?: boolean;
        invited_email?: string;
      };
      const url = data?.invite_url;
      if (!url) {
        toast.error('Unexpected response from server');
        return;
      }
      setInviteUrl(url);
      const emailed = data?.invite_email_sent === true;
      setInviteEmailSent(emailed);
      const pid = data?.id;
      if (pid) {
        writeStoredInvite({
          packageId: String(pid),
          inviteUrl: url,
          invitedEmail: data?.invited_email ?? email,
          inviteEmailSent: emailed,
        });
      }
      onCreated();
      if (emailed) {
        toast.success(`Invite created — we emailed the link to ${data?.invited_email ?? email}`);
      } else {
        toast.warning('Invite created — email could not be sent. Copy the link below.');
      }
    } catch (err: any) {
      const msg = err?.error || err?.message || 'Failed to create invite';
      toast.error(typeof msg === 'string' ? msg : 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const rateOk = parseHourlyRate(hourlyRate);
  const referredOk =
    isReferred === RadioButtonValues.NO ||
    (isReferred === RadioButtonValues.YES && referredBy.trim().length > 0);

  const canSubmit =
    rateOk !== null &&
    rateOk >= 0 &&
    position &&
    workSchedule &&
    hrsp &&
    isReferred &&
    referredOk &&
    !inviteUrl;

  const scheduleLabel = (value: string) => {
    const opt = WORK_SCHEDULE_OPTIONS.find((o) => o.value === value);
    return opt?.label ?? value;
  };

  const hrspLabel = (value: string) => {
    const opt = HRSP_P_OPTIONS.find((o) => o.value === value);
    return opt?.label ?? value;
  };

  const positionLabel = (value: string) => {
    const opt = ONBOARDING_INVITE_POSITION_OPTIONS.find((o) => o.value === value);
    return opt?.label ?? value;
  };

  const selectPlaceholderSx = { color: 'text.disabled' };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleDialogClose}>
      <DialogTitle>Create hiring invite</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            required
            fullWidth
            label="Candidate work email"
            type="email"
            value={invitedEmail}
            onChange={(e) => setInvitedEmail(e.target.value)}
            disabled={!!inviteUrl}
            helperText="Must match the email the candidate will enter when opening the link."
          />

          <TextField
            select
            required
            fullWidth
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={!!inviteUrl}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '') {
                  return (
                    <Box component="span" sx={selectPlaceholderSx}>
                      Select position
                    </Box>
                  );
                }
                return positionLabel(String(selected));
              },
            }}
          >
            <MenuItem value="" sx={{ display: 'none' }}>
              &nbsp;
            </MenuItem>
            {ONBOARDING_INVITE_POSITION_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            required
            fullWidth
            label="Hourly rate"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(sanitizeHourlyRateInput(e.target.value))}
            disabled={!!inviteUrl}
            helperText="Dollar amount per hour; decimals allowed."
            slotProps={{
              htmlInput: {
                inputMode: 'decimal',
                pattern: '[0-9]*\\.?[0-9]*',
                autoComplete: 'off',
              },
            }}
          />

          <TextField
            select
            required
            fullWidth
            label="Work schedule"
            value={workSchedule}
            onChange={(e) => setWorkSchedule(e.target.value)}
            disabled={!!inviteUrl}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '') {
                  return (
                    <Box component="span" sx={selectPlaceholderSx}>
                      Select work schedule
                    </Box>
                  );
                }
                return scheduleLabel(String(selected));
              },
            }}
          >
            <MenuItem value="" sx={{ display: 'none' }}>
              &nbsp;
            </MenuItem>
            {WORK_SCHEDULE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            fullWidth
            label="HRS P"
            value={hrsp}
            onChange={(e) => setHrsp(e.target.value)}
            disabled={!!inviteUrl}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '') {
                  return (
                    <Box component="span" sx={selectPlaceholderSx}>
                      Select HRS P
                    </Box>
                  );
                }
                return hrspLabel(String(selected));
              },
            }}
          >
            <MenuItem value="" sx={{ display: 'none' }}>
              &nbsp;
            </MenuItem>
            {HRSP_P_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            fullWidth
            label="Was new hire referred?"
            value={isReferred}
            onChange={(e) => {
              const v = e.target.value;
              setIsReferred(v);
              if (v !== RadioButtonValues.YES) setReferredBy('');
            }}
            disabled={!!inviteUrl}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '') {
                  return (
                    <Box component="span" sx={selectPlaceholderSx}>
                      Select yes or no
                    </Box>
                  );
                }
                return selected === RadioButtonValues.YES ? 'Yes' : 'No';
              },
            }}
          >
            <MenuItem value="" sx={{ display: 'none' }}>
              &nbsp;
            </MenuItem>
            <MenuItem value={RadioButtonValues.YES}>Yes</MenuItem>
            <MenuItem value={RadioButtonValues.NO}>No</MenuItem>
          </TextField>

          {isReferred === RadioButtonValues.YES ? (
            <TextField
              required
              fullWidth
              label="Referred by"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              disabled={!!inviteUrl}
              helperText="Name of the person who referred this candidate."
            />
          ) : null}

          {inviteUrl ? (
            <>
              <Alert severity="info" sx={{ mb: 0 }}>
                If you close this window, open <strong>Create invite</strong> again on this device -
                the link stays available here until you start a new invite. From the hiring packages
                list you can also use <strong>Resend invite</strong> (sends a new link by email; the
                old link stops working).
              </Alert>
              {inviteEmailSent === true ? (
                <Alert severity="success">
                  We sent this link to the candidate&apos;s email. They can open it on a phone or
                  computer. After opening, they enter the same email and a one-time code - that
                  helps make sure only they can access the form.
                </Alert>
              ) : inviteEmailSent === false ? (
                <Alert severity="warning">
                  We couldn&apos;t send email automatically. Copy the link and send it to the
                  candidate (text, personal email, etc.).
                </Alert>
              ) : null}
              <TextField
                fullWidth
                label="Invite link (copy if needed)"
                value={inviteUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={copyUrl}
                        startIcon={<Iconify icon="solar:copy-bold" />}
                      >
                        Copy
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        {inviteUrl ? (
          <Button color="inherit" onClick={handleStartNewInvite}>
            Start new invite
          </Button>
        ) : (
          <span />
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button color="inherit" onClick={handleClose}>
            {inviteUrl ? 'Close' : 'Cancel'}
          </Button>
          {!inviteUrl ? (
            <Button variant="contained" onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? 'Creating…' : 'Create invite'}
            </Button>
          ) : null}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
