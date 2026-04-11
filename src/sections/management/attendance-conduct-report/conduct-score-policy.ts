/**
 * Conduct score deductions for Attendance & Conduct reports (admin create flow).
 * Aligned with internal policy (point-system recommendations).
 */

export const CONDUCT_REPORT_SCORE = {
  noShowUnpaid: 30,
  unauthorizedDriving: 30,
  drivingInfractionMinor: 15,
  drivingInfractionMajor: 30,
  sentHomeNoPpe: 20,
  leftEarlyNoNotice: 20,
  lateOnSiteTier1: 5,
  lateOnSiteTier2: 10,
  lateOnSiteTier3: 15,
  unapprovedDaysOffShortNotice: 10,
  verbalWarning: 5,
  writtenWarning: 10,
  /** Called in sick: notice relative to scheduled shift start (see sick-call policy). */
  calledInSickOver8Hours: 0,
  calledInSick4to8Hours: 2,
  calledInSickUnder4Hours: 5,
  calledInSickWithDocumentation: 0,
  /** Refusal of shift: notice before scheduled shift start (policy tiers). */
  refusalOfShiftUnder24h: 25,
  refusalOfShift24to72h: 15,
  refusalOfShiftOver72h: 5,
} as const;

/** Allowed deductions for admin reject-on-behalf (job worker pending → rejected). */
export const REFUSAL_OF_SHIFT_SCORES = [
  CONDUCT_REPORT_SCORE.refusalOfShiftUnder24h,
  CONDUCT_REPORT_SCORE.refusalOfShift24to72h,
  CONDUCT_REPORT_SCORE.refusalOfShiftOver72h,
] as const;

/** Tier keys for refusal-of-shift notice (vs scheduled shift start). */
export type RefusalOfShiftTier = '' | 'under24' | '24to72' | 'over72' | 'unknown';

/** Maps UI tier to stored conduct score (positive = points deducted). `unknown` uses worst tier. */
export function resolveRefusalOfShiftScore(tier: RefusalOfShiftTier): number {
  switch (tier) {
    case 'under24':
      return CONDUCT_REPORT_SCORE.refusalOfShiftUnder24h;
    case '24to72':
      return CONDUCT_REPORT_SCORE.refusalOfShift24to72h;
    case 'over72':
      return CONDUCT_REPORT_SCORE.refusalOfShiftOver72h;
    case 'unknown':
      return CONDUCT_REPORT_SCORE.refusalOfShiftUnder24h;
    default:
      return NaN;
  }
}

/** Allowed numeric score values stored on each report (positive = points deducted). */
export const ALLOWED_CONDUCT_REPORT_SCORES_BY_CATEGORY: Record<string, readonly number[]> = {
  noShowUnpaid: [CONDUCT_REPORT_SCORE.noShowUnpaid],
  calledInSick: [
    CONDUCT_REPORT_SCORE.calledInSickWithDocumentation,
    CONDUCT_REPORT_SCORE.calledInSickOver8Hours,
    CONDUCT_REPORT_SCORE.calledInSick4to8Hours,
    CONDUCT_REPORT_SCORE.calledInSickUnder4Hours,
  ],
  sentHomeNoPpe: [CONDUCT_REPORT_SCORE.sentHomeNoPpe],
  leftEarlyNoNotice: [CONDUCT_REPORT_SCORE.leftEarlyNoNotice],
  lateOnSite: [
    CONDUCT_REPORT_SCORE.lateOnSiteTier1,
    CONDUCT_REPORT_SCORE.lateOnSiteTier2,
    CONDUCT_REPORT_SCORE.lateOnSiteTier3,
  ],
  unapprovedDaysOffShortNotice: [CONDUCT_REPORT_SCORE.unapprovedDaysOffShortNotice],
  unauthorizedDriving: [CONDUCT_REPORT_SCORE.unauthorizedDriving],
  drivingInfractions: [CONDUCT_REPORT_SCORE.drivingInfractionMinor, CONDUCT_REPORT_SCORE.drivingInfractionMajor],
  verbalWarningsWriteUp: [CONDUCT_REPORT_SCORE.verbalWarning, CONDUCT_REPORT_SCORE.writtenWarning],
};

export type LateOnSiteTier = 'tier1' | 'tier2' | 'tier3' | '';
export type DrivingInfractionTier = 'minor' | 'major' | '';
export type WriteUpScoreType = 'verbal' | 'written' | '';

/** Notice timing for sick call (when no doctor's note). */
export type CalledInSickNotice = '' | 'over8' | '4to8' | 'under4';

export type ConductReportScoreResolutionOpts = {
  lateOnSiteTier: LateOnSiteTier;
  drivingInfractionTier: DrivingInfractionTier;
  writeUpScoreType: WriteUpScoreType;
  calledInSickHasDocumentation: boolean;
  calledInSickNotice: CalledInSickNotice;
};

/** Resolves UI selections to the `reportScore` string sent to the API. */
export function resolveConductReportScore(
  category: string,
  opts: ConductReportScoreResolutionOpts
): string {
  switch (category) {
    case 'noShowUnpaid':
      return String(CONDUCT_REPORT_SCORE.noShowUnpaid);
    case 'sentHomeNoPpe':
      return String(CONDUCT_REPORT_SCORE.sentHomeNoPpe);
    case 'leftEarlyNoNotice':
      return String(CONDUCT_REPORT_SCORE.leftEarlyNoNotice);
    case 'unapprovedDaysOffShortNotice':
      return String(CONDUCT_REPORT_SCORE.unapprovedDaysOffShortNotice);
    case 'unauthorizedDriving':
      return String(CONDUCT_REPORT_SCORE.unauthorizedDriving);
    case 'drivingInfractions':
      if (opts.drivingInfractionTier === 'minor') return String(CONDUCT_REPORT_SCORE.drivingInfractionMinor);
      if (opts.drivingInfractionTier === 'major') return String(CONDUCT_REPORT_SCORE.drivingInfractionMajor);
      return '';
    case 'lateOnSite':
      if (opts.lateOnSiteTier === 'tier1') return String(CONDUCT_REPORT_SCORE.lateOnSiteTier1);
      if (opts.lateOnSiteTier === 'tier2') return String(CONDUCT_REPORT_SCORE.lateOnSiteTier2);
      if (opts.lateOnSiteTier === 'tier3') return String(CONDUCT_REPORT_SCORE.lateOnSiteTier3);
      return '';
    case 'calledInSick':
      if (opts.calledInSickHasDocumentation) {
        return String(CONDUCT_REPORT_SCORE.calledInSickWithDocumentation);
      }
      switch (opts.calledInSickNotice) {
        case 'over8':
          return String(CONDUCT_REPORT_SCORE.calledInSickOver8Hours);
        case '4to8':
          return String(CONDUCT_REPORT_SCORE.calledInSick4to8Hours);
        case 'under4':
          return String(CONDUCT_REPORT_SCORE.calledInSickUnder4Hours);
        default:
          return '';
      }
    case 'verbalWarningsWriteUp':
      if (opts.writeUpScoreType === 'verbal') return String(CONDUCT_REPORT_SCORE.verbalWarning);
      if (opts.writeUpScoreType === 'written') return String(CONDUCT_REPORT_SCORE.writtenWarning);
      return '';
    default:
      return '';
  }
}

export function isAllowedConductReportScore(category: string, score: number): boolean {
  const allowed = ALLOWED_CONDUCT_REPORT_SCORES_BY_CATEGORY[category];
  if (!allowed) return false;
  return allowed.includes(score);
}

// ---------------------------------------------------------------------------
// Earn-Back System
// ---------------------------------------------------------------------------

export type EarnBackCategory = {
  value: string;
  label: string;
  points: number;
  /** Short description shown in the award dialog. */
  description: string;
};

/**
 * Manual earn-back award categories — granted by an admin to recognise
 * specific achievements that require human judgment.
 * Automated bonuses (streaks, clean periods, attendance) are computed live
 * by the backend and never stored here.
 */
export const EARN_BACK_CATEGORIES: EarnBackCategory[] = [
  {
    value: 'clientCallback',
    label: 'Client Callback (Documented)',
    points: 8,
    description: 'Client specifically requested this worker back (documented).',
  },
  {
    value: 'positiveFeedback',
    label: 'Positive Client Feedback (Written)',
    points: 10,
    description: 'Received written positive feedback from a client.',
  },
  {
    value: 'supervisorPraise',
    label: 'Field Supervisor Praise',
    points: 5,
    description: 'Recognized by field supervisor for quality work.',
  },
  {
    value: 'mentoringNewWorker',
    label: 'Mentoring New Worker',
    points: 5,
    description: 'Actively mentored a new team member.',
  },
  {
    value: 'workerOfMonth',
    label: 'Worker of the Month',
    points: 15,
    description: 'Selected as Worker of the Month.',
  },
  {
    value: 'mostImproved',
    label: 'Most Improved',
    points: 10,
    description: 'Recognized as most improved worker this month.',
  },
];

/** Returns the EarnBackCategory for a given value key, or undefined. */
export function getEarnBackCategory(value: string): EarnBackCategory | undefined {
  return EARN_BACK_CATEGORIES.find((c) => c.value === value);
}

// ---------------------------------------------------------------------------
// Automated bonus metadata (display only — values computed by backend)
// ---------------------------------------------------------------------------

export type AutoBonusDisplay = {
  key: string;
  label: string;
  maxPoints: number;
  description: string;
};

/** Reference list for displaying automated bonus info in the UI. */
export const AUTO_BONUS_DISPLAY: AutoBonusDisplay[] = [
  {
    key: 'consecutiveJobs',
    label: 'Consecutive Jobs (No Issues)',
    maxPoints: 10,
    description: '≥10 clean jobs in a row → +5 pts | ≥25 → +10 pts',
  },
  {
    key: 'cleanMonth',
    label: 'Clean Month',
    maxPoints: 3,
    description: 'No incidents since start of current month (requires ≥1 shift)',
  },
  {
    key: 'cleanQuarter',
    label: 'Clean Quarter',
    maxPoints: 5,
    description: 'No incidents since start of current quarter (requires ≥1 shift)',
  },
  {
    key: 'cleanWeeks',
    label: '2-4 Weeks Clean',
    maxPoints: 5,
    description: '2 consecutive clean weeks (≥3 shifts/week) → +3 | 4 weeks → +5',
  },
  {
    key: 'perfectAttendance',
    label: 'Perfect Attendance (30 Days)',
    maxPoints: 5,
    description: 'No no-shows or sick calls in the last 30 days (requires ≥1 shift)',
  },
  {
    key: 'safetyRecognition',
    label: 'Safety Recognition (90 Days)',
    maxPoints: 10,
    description: 'No conduct incidents in the last 90 days (requires ≥1 shift)',
  },
];
