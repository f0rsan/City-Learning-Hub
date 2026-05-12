import type { Activity, ActivitySource } from "./types";
import type {
  ActivityEvaluation,
  AudienceFit,
  EvaluationContext,
  EvidenceSignal,
  OrganizerHistory,
  RecommendationLevel,
  SocialSignal,
  VenueHistory
} from "./evaluationTypes";
import {
  CONFIDENCE_SCORE_THRESHOLDS as EXPLICIT_CONFIDENCE_SCORE_THRESHOLDS,
  EVALUATION_RULE_VERSION as EXPLICIT_EVALUATION_RULE_VERSION
} from "./evaluationTypes";

export const EVALUATION_RULE_VERSION = EXPLICIT_EVALUATION_RULE_VERSION;
export const CONFIDENCE_SCORE_THRESHOLDS = EXPLICIT_CONFIDENCE_SCORE_THRESHOLDS;
type ConfidenceEvaluationInput = Pick<ActivityEvaluation, "totalScore" | "riskReasons" | "evidenceSignals"> & {
  correctionPenaltyScore?: number;
  hasUnresolvedCorrectionRisk?: boolean;
};

function clamp(score: number, maxScore: number) {
  return Math.max(0, Math.min(score, maxScore));
}

function findSource(activity: Activity, sources: ActivitySource[] = []) {
  return sources.find((source) => source.id === activity.sourceId);
}

export function scoreSourceSignal(activity: Activity, source?: ActivitySource): EvidenceSignal {
  if (!source) {
    return {
      type: "source",
      label: "来源",
      score: 0,
      maxScore: 18,
      detail: "还没有匹配到稳定来源，需要进一步核对。"
    };
  }

  const scoreByTrust = {
    high: 18,
    medium: 11,
    unverified: 4
  };
  const weightedScore = Math.round(scoreByTrust[source.trustLevel] * (source.signalWeight ?? 1));

  return {
    type: "source",
    label: "来源",
    score: clamp(weightedScore, 18),
    maxScore: 18,
    detail: `${source.name}：${source.trustLevel === "high" ? "较稳定" : source.trustLevel === "medium" ? "可参考" : "待验证"}，${source.lastChecked} 更新。`
  };
}

export function scoreOrganizerSignal(activity: Activity, organizerHistory?: OrganizerHistory): EvidenceSignal {
  if (!organizerHistory) {
    return {
      type: "organizer",
      label: "组织方",
      score: 8,
      maxScore: 16,
      detail: "还没有明确的组织方历史记录。"
    };
  }

  const base = organizerHistory.completedEvents > 0 ? 8 : 5;
  const positive = Math.min(organizerHistory.positiveSignals * 2, 6);
  const corrections = Math.min(organizerHistory.correctionCount * 3, 8);

  return {
    type: "organizer",
    label: "组织方",
    score: clamp(base + positive - corrections, 16),
    maxScore: 16,
    detail:
      organizerHistory.completedEvents > 0
        ? `${organizerHistory.organizerName} 有 ${organizerHistory.completedEvents} 次历史活动记录。`
        : `${organizerHistory.organizerName} 是新组织方，需要更多观察。`
  };
}

export function scoreVenueSignal(activity: Activity, venueHistory?: VenueHistory): EvidenceSignal {
  if (!venueHistory) {
    const stableVenue = ["科技馆", "书城", "会展中心", "创业广场", "创新中心"].some((word) =>
      activity.venue.includes(word)
    );

    return {
      type: "venue",
      label: "场地",
      score: stableVenue ? 12 : 8,
      maxScore: 14,
      detail: stableVenue ? "场地类型清楚，适合公开学习活动。" : "场地信息可用，但历史记录还不多。"
    };
  }

  return {
    type: "venue",
    label: "场地",
    score: clamp(venueHistory.accessibilityScore + Math.min(venueHistory.completedEvents, 4) - venueHistory.correctionCount * 2, 14),
    maxScore: 14,
    detail: `${venueHistory.venueName} 有 ${venueHistory.completedEvents} 次历史活动记录。`
  };
}

export function scoreContentSignal(activity: Activity): EvidenceSignal {
  const hasRecommendation = activity.recommendation.trim().length >= 12;
  const hasBestFor = activity.bestFor.trim().length >= 8;
  const hasTags = activity.tags.length >= 2;
  const hasClearTimePlace = Boolean(activity.startAt && activity.endAt && activity.venue && activity.district);
  const hasLearningCategory = ["亲子科技", "技术大会", "读书沙龙", "Hackathon", "电子展会", "科技展会"].includes(
    activity.category
  );

  const score =
    (hasRecommendation ? 9 : 0) +
    (hasBestFor ? 6 : 0) +
    (hasTags ? 4 : 0) +
    (hasClearTimePlace ? 5 : 0) +
    (hasLearningCategory ? 4 : 0);

  return {
    type: "content",
    label: "活动内容",
    score: clamp(score, 28),
    maxScore: 28,
    detail: hasRecommendation ? activity.recommendation : "活动介绍还不够完整，暂时难判断学习价值。"
  };
}

function scoreSocialSignal(activity: Activity, socialSignal?: SocialSignal): EvidenceSignal {
  if (!socialSignal) {
    return {
      type: "social",
      label: "公开反馈",
      score: 3,
      maxScore: 8,
      detail: "暂无明显公开反馈。"
    };
  }

  const sentimentScore = socialSignal.sentiment === "positive" ? 5 : socialSignal.sentiment === "mixed" ? 3 : 0;
  const volumeScore = Math.min(Math.floor(socialSignal.mentionCount / 100), 3);

  return {
    type: "social",
    label: "公开反馈",
    score: clamp(sentimentScore + volumeScore, 8),
    maxScore: 8,
    detail: socialSignal.summary
  };
}

export function scoreRiskSignal(activity: Activity, context: EvaluationContext = {}): EvidenceSignal {
  let risk = 0;
  const reasons: string[] = [];

  if (activity.status === "cancelled") {
    risk += 30;
    reasons.push("活动已取消");
  }

  if (activity.status === "uncertain") {
    risk += 10;
    reasons.push("信息待确认");
  }

  if (activity.audience.includes("family") && !activity.childSafetyComplete) {
    risk += 18;
    reasons.push("亲子信息不够完整");
  }

  if (!activity.officialUrl.startsWith("https://")) {
    risk += 8;
    reasons.push("活动链接需要核对");
  }

  const correctionRisk = (context.correctionImpacts ?? [])
    .filter((impact) => impact.activitySlug === activity.slug)
    .reduce((total, impact) => total + impact.riskDelta, 0);

  risk += correctionRisk;

  return {
    type: "risk",
    label: "注意事项",
    score: clamp(20 - risk, 20),
    maxScore: 20,
    detail: reasons.length ? reasons.join("；") : "暂无明显阻断问题，出发前再看活动页。"
  };
}

function buildAudienceFit(activity: Activity): { family: AudienceFit; adult: AudienceFit } {
  const familyIncluded = activity.audience.includes("family");
  const adultIncluded = activity.audience.includes("adult");

  return {
    family: !familyIncluded
      ? { level: "not_applicable", reasons: ["这场活动不优先面向亲子同行。"] }
      : !activity.childSafetyComplete
        ? { level: "blocked", reasons: ["适龄、陪同或安全信息还不够清楚。"] }
        : { level: "recommended", reasons: [activity.ageBand ? `适龄范围：${activity.ageBand}` : "适合亲子同行。"] },
    adult: adultIncluded
      ? { level: "recommended", reasons: ["适合成人学习、交流或行业连接。"] }
      : { level: "not_applicable", reasons: ["这场活动主要面向亲子场景。"] }
  };
}

export function deriveRecommendationLevel(evaluation: Pick<ActivityEvaluation, "totalScore" | "riskReasons">): RecommendationLevel {
  if (evaluation.riskReasons.some((reason) => reason.includes("活动已取消"))) {
    return "blocked";
  }

  const contentScore =
    "evidenceSignals" in evaluation
      ? (evaluation.evidenceSignals as EvidenceSignal[]).find((signal) => signal.type === "content")?.score ?? 0
      : 0;

  if (evaluation.totalScore >= 70 && contentScore >= 18) {
    return "strong";
  }

  if (evaluation.totalScore >= 52) {
    return "good";
  }

  return "caution";
}

export function deriveConfidenceLevel(evaluation: ConfidenceEvaluationInput) {
  const correctionPenaltyScore = typeof evaluation.correctionPenaltyScore === "number" ? evaluation.correctionPenaltyScore : 0;
  const effectiveScore = evaluation.totalScore + correctionPenaltyScore;
  const missingSource = evaluation.evidenceSignals.find((signal) => signal.type === "source")?.score === 0;
  const hasNewOrganizer = evaluation.evidenceSignals.some(
    (signal) => signal.type === "organizer" && signal.detail.includes("新组织方")
  );
  const hasChildRisk = evaluation.riskReasons.some((reason) => reason.includes("亲子信息不够完整"));
  const hasUnresolvedCorrectionRisk =
    evaluation.hasUnresolvedCorrectionRisk ??
    evaluation.riskReasons.some((reason) => reason.includes("纠错未解决") || reason.includes("直到纠错解决"));

  if (
    effectiveScore >= CONFIDENCE_SCORE_THRESHOLDS.high &&
    !missingSource &&
    !hasNewOrganizer &&
    !hasChildRisk &&
    !hasUnresolvedCorrectionRisk
  ) {
    return "high";
  }

  if (effectiveScore >= CONFIDENCE_SCORE_THRESHOLDS.medium && !hasChildRisk) {
    return "medium";
  }

  return "low";
}

function riskReasons(activity: Activity, riskSignal: EvidenceSignal, context: EvaluationContext) {
  const reasons = activity.cautions.length ? [...activity.cautions] : ["暂无明显注意事项，出发前再看活动页。"];

  if (riskSignal.score < riskSignal.maxScore) {
    reasons.unshift(riskSignal.detail);
  }

  for (const impact of context.correctionImpacts ?? []) {
    if (impact.activitySlug === activity.slug) {
      reasons.unshift(`纠错影响：${impact.reason}`);
    }
  }

  return Array.from(new Set(reasons));
}

export function evaluateActivity(activity: Activity, context: EvaluationContext = {}): ActivityEvaluation {
  const correctionImpacts = (context.correctionImpacts ?? []).filter((impact) => impact.activitySlug === activity.slug);
  const correctionConfidencePenalty = correctionImpacts.reduce((total, impact) => total + impact.confidenceDelta, 0);
  const hasUnresolvedCorrectionRisk = correctionImpacts.some(
    (impact) => impact.isResolved === false || impact.reason.includes("纠错未解决") || impact.reason.includes("直到纠错解决")
  );
  const source = findSource(activity, context.sources);
  const signals = [
    scoreSourceSignal(activity, source),
    scoreOrganizerSignal(activity, context.organizerHistory?.[activity.sourceId]),
    scoreVenueSignal(activity, context.venueHistory?.[activity.venue]),
    scoreContentSignal(activity),
    scoreSocialSignal(activity, context.socialSignals?.[activity.slug]),
    scoreRiskSignal(activity, context)
  ];
  const riskSignal = signals.find((signal) => signal.type === "risk")!;
  const totalScore = signals.reduce((total, signal) => total + signal.score, 0);
  const risks = riskReasons(activity, riskSignal, context);
  const evaluatedAt = new Date().toISOString();
  const partial: ActivityEvaluation = {
    activityId: activity.id,
    ruleVersion: EVALUATION_RULE_VERSION,
    recommendationLevel: "caution",
    confidenceLevel: "low",
    totalScore,
    valueReasons: [
      activity.recommendation || scoreContentSignal(activity).detail,
      activity.bestFor || "适合人群待补充。",
      `${activity.district} · ${activity.venue}，方便提前判断出行成本。`
    ],
    riskReasons: risks,
    evidenceSignals: signals,
    audienceFit: buildAudienceFit(activity),
    evaluatedAt,
    generatedAt: evaluatedAt
  };

  return {
    ...partial,
    recommendationLevel: deriveRecommendationLevel(partial),
    confidenceLevel: deriveConfidenceLevel({
      ...partial,
      correctionPenaltyScore: correctionConfidencePenalty,
      hasUnresolvedCorrectionRisk
    })
  };
}
