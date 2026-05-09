import type { Activity, ActivitySource } from "./types";

export type SignalType = "source" | "organizer" | "venue" | "history" | "social" | "risk" | "content";
export type RecommendationLevel = "strong" | "good" | "caution" | "blocked";
export type ConfidenceLevel = "high" | "medium" | "low";
export type AudienceFitLevel = "recommended" | "possible" | "not_applicable" | "blocked";

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
  generatedAt: string;
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

export type CalibrationNote = {
  id: string;
  activityId: string;
  action: CalibrationAction;
  note: string;
  createdAt: string;
};

export type CandidateStatus = "draft" | "evaluated" | "published" | "rejected" | "cancelled";

export type CandidateActivity = Activity & {
  candidateStatus: CandidateStatus;
  evaluation?: ActivityEvaluation;
  submittedActivityId?: string;
  collectedFromSourceId?: string;
  duplicateOf?: string;
  createdAt: string;
  updatedAt: string;
};
