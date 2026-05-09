import type { Activity, ActivitySource } from "./types";

export type SignalType = "source" | "organizer" | "venue" | "history" | "social" | "risk" | "content";
export type RecommendationLevel = "strong" | "good" | "caution" | "blocked";
export type ConfidenceLevel = "high" | "medium" | "low";
export type AudienceFitLevel = "recommended" | "possible" | "not_applicable" | "blocked";
export type EvaluationRuleVersion = `evaluation-rules-v${number}`;
export const EVALUATION_RULE_VERSION: EvaluationRuleVersion = "evaluation-rules-v2";
export const CONFIDENCE_SCORE_THRESHOLDS = {
  high: 72,
  medium: 45
} as const;

export type SignalScore = {
  score: number;
  maxScore: number;
};

export type EvidenceSignal = SignalScore & {
  type: SignalType;
  label: string;
  detail: string;
};

export type AudienceFit = {
  level: AudienceFitLevel;
  reasons: string[];
};

export type ActivityEvaluation = {
  activityId: string;
  ruleVersion: EvaluationRuleVersion;
  recommendationLevel: RecommendationLevel;
  confidenceLevel: ConfidenceLevel;
  totalScore: number;
  valueReasons: string[];
  riskReasons: string[];
  evidenceSignals: EvidenceSignal[];
  audienceFit: {
    family?: AudienceFit;
    adult?: AudienceFit;
  };
  evaluatedAt: string;
  generatedAt: string;
};

export type EvaluationChangeSnapshot = Pick<
  ActivityEvaluation,
  "ruleVersion" | "recommendationLevel" | "confidenceLevel" | "totalScore" | "evaluatedAt"
>;

export type EvaluationChange = {
  changedBy: "rule_version_update";
  reason: string;
  changedAt: string;
  previous: EvaluationChangeSnapshot;
};

export type OrganizerHistory = {
  organizerName: string;
  completedEvents: number;
  positiveSignals: number;
  correctionCount: number;
};

export type VenueHistory = {
  venueName: string;
  completedEvents: number;
  accessibilityScore: number;
  correctionCount: number;
};

export type SocialSignal = {
  mentionCount: number;
  sentiment: "positive" | "mixed" | "negative";
  summary: string;
};

export type CorrectionImpact = {
  activitySlug: string;
  issueType: string;
  isResolved: boolean;
  riskDelta: number;
  confidenceDelta: number;
  reason: string;
};

export type EvaluationContext = {
  sources?: ActivitySource[];
  organizerHistory?: Record<string, OrganizerHistory>;
  venueHistory?: Record<string, VenueHistory>;
  socialSignals?: Record<string, SocialSignal>;
  correctionImpacts?: CorrectionImpact[];
};

export type CalibrationAction = "confirm" | "lower_confidence" | "reject" | "send_to_calibration";
export type CalibrationReasonType = "evidence_gap" | "risk_update" | "audience_mismatch" | "rule_exception" | "other";
export type CalibrationAudience = "family" | "adult" | "both" | "unknown";

export type CalibrationNote = {
  id: string;
  activityId: string;
  action: CalibrationAction;
  note: string;
  reasonType: CalibrationReasonType;
  audience: CalibrationAudience;
  ruleTag?: string;
  createdAt: string;
};

export type CandidateStatus = "draft" | "pending" | "evaluated" | "published" | "rejected" | "cancelled" | "archived";
export type CandidateArchiveReason = "draft_ttl_expired" | "pending_ttl_expired";

export type CandidateActivity = Activity & {
  candidateStatus: CandidateStatus;
  evaluation?: ActivityEvaluation;
  evaluationChange?: EvaluationChange;
  submittedActivityId?: string;
  collectedFromSourceId?: string;
  duplicateOf?: string;
  archivedAt?: string;
  archiveReason?: CandidateArchiveReason;
  createdAt: string;
  updatedAt: string;
};
