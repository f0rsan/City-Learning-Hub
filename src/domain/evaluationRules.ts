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
      label: "来源可信度",
      score: 0,
      maxScore: 18,
      detail: "没有匹配到稳定来源，需人工确认来源可靠性。"
    };
  }

  const scoreByTrust = {
    high: 18,
    medium: 11,
    unverified: 4
  };

  return {
    type: "source",
    label: "来源可信度",
    score: scoreByTrust[source.trustLevel],
    maxScore: 18,
    detail: `${source.name} 为${source.trustLevel === "high" ? "高可信" : source.trustLevel === "medium" ? "中等可信" : "待验证"}来源，最后检查 ${source.lastChecked}。`
  };
}

export function scoreOrganizerSignal(activity: Activity, organizerHistory?: OrganizerHistory): EvidenceSignal {
  if (!organizerHistory) {
    return {
      type: "organizer",
      label: "组织方信号",
      score: 8,
      maxScore: 16,
      detail: "暂无明确组织方历史，先按中性信号处理。"
    };
  }

  const base = organizerHistory.completedEvents > 0 ? 8 : 5;
  const positive = Math.min(organizerHistory.positiveSignals * 2, 6);
  const corrections = Math.min(organizerHistory.correctionCount * 3, 8);

  return {
    type: "organizer",
    label: "组织方信号",
    score: clamp(base + positive - corrections, 16),
    maxScore: 16,
    detail:
      organizerHistory.completedEvents > 0
        ? `${organizerHistory.organizerName} 有 ${organizerHistory.completedEvents} 次历史活动记录。`
        : `${organizerHistory.organizerName} 是新组织方，需要保留信心折扣。`
  };
}

export function scoreVenueSignal(activity: Activity, venueHistory?: VenueHistory): EvidenceSignal {
  if (!venueHistory) {
    const stableVenue = ["科技馆", "书城", "会展中心", "创业广场", "创新中心"].some((word) =>
      activity.venue.includes(word)
    );

    return {
      type: "venue",
      label: "场地信号",
      score: stableVenue ? 12 : 8,
      maxScore: 14,
      detail: stableVenue ? "场地类型清晰，适合公开学习活动。" : "场地信息可用，但缺少历史稳定性数据。"
    };
  }

  return {
    type: "venue",
    label: "场地信号",
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
    label: "活动本身质量",
    score: clamp(score, 28),
    maxScore: 28,
    detail: hasRecommendation ? activity.recommendation : "活动介绍过薄，系统无法充分判断学习价值。"
  };
}

function scoreSocialSignal(activity: Activity, socialSignal?: SocialSignal): EvidenceSignal {
  if (!socialSignal) {
    return {
      type: "social",
      label: "公开反馈信号",
      score: 3,
      maxScore: 8,
      detail: "暂无明显公开反馈，社媒不参与主导判断。"
    };
  }

  const sentimentScore = socialSignal.sentiment === "positive" ? 5 : socialSignal.sentiment === "mixed" ? 3 : 0;
  const volumeScore = Math.min(Math.floor(socialSignal.mentionCount / 100), 3);

  return {
    type: "social",
    label: "公开反馈信号",
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
    reasons.push("亲子安全信息不足");
  }

  if (!activity.officialUrl.startsWith("https://")) {
    risk += 8;
    reasons.push("官方链接可信度不足");
  }

  const correctionRisk = (context.correctionImpacts ?? [])
    .filter((impact) => impact.activitySlug === activity.slug)
    .reduce((total, impact) => total + impact.riskDelta, 0);

  risk += correctionRisk;

  return {
    type: "risk",
    label: "风险识别",
    score: clamp(20 - risk, 20),
    maxScore: 20,
    detail: reasons.length ? reasons.join("；") : "未发现明显阻断风险，仍需以官方临时变更为准。"
  };
}

function buildAudienceFit(activity: Activity): { family: AudienceFit; adult: AudienceFit } {
  const familyIncluded = activity.audience.includes("family");
  const adultIncluded = activity.audience.includes("adult");

  return {
    family: !familyIncluded
      ? { level: "not_applicable", reasons: ["活动不是亲子入口优先内容。"] }
      : !activity.childSafetyComplete
        ? { level: "blocked", reasons: ["亲子安全信息不足，不能高信心推荐给家庭。"] }
        : { level: "recommended", reasons: [activity.ageBand ? `适龄范围：${activity.ageBand}` : "适合亲子同行。"] },
    adult: adultIncluded
      ? { level: "recommended", reasons: ["适合成人学习、交流或行业连接。"] }
      : { level: "not_applicable", reasons: ["活动主要面向亲子场景。"] }
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

export function deriveConfidenceLevel(evaluation: Pick<ActivityEvaluation, "totalScore" | "riskReasons" | "evidenceSignals">) {
  const missingSource = evaluation.evidenceSignals.find((signal) => signal.type === "source")?.score === 0;
  const hasNewOrganizer = evaluation.evidenceSignals.some(
    (signal) => signal.type === "organizer" && signal.detail.includes("新组织方")
  );
  const hasChildRisk = evaluation.riskReasons.some((reason) => reason.includes("亲子安全信息不足"));
  const hasCorrectionRisk = evaluation.riskReasons.some((reason) => reason.includes("纠错"));

  if (evaluation.totalScore >= 72 && !missingSource && !hasNewOrganizer && !hasChildRisk && !hasCorrectionRisk) {
    return "high";
  }

  if (evaluation.totalScore >= 45 && !hasChildRisk) {
    return "medium";
  }

  return "low";
}

function riskReasons(activity: Activity, riskSignal: EvidenceSignal, context: EvaluationContext) {
  const reasons = activity.cautions.length ? [...activity.cautions] : ["暂无明确注意事项，出行前仍需复核官方页面。"];

  if (riskSignal.detail !== "未发现明显阻断风险，仍需以官方临时变更为准。") {
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
  const partial: ActivityEvaluation = {
    activityId: activity.id,
    recommendationLevel: "caution",
    confidenceLevel: "low",
    totalScore,
    valueReasons: [
      activity.recommendation || scoreContentSignal(activity).detail,
      source ? `来源来自 ${source.name}，可追溯。` : "来源需要补充确认。",
      activity.bestFor || "适合人群仍需补充。"
    ],
    riskReasons: risks,
    evidenceSignals: signals,
    audienceFit: buildAudienceFit(activity),
    generatedAt: new Date().toISOString()
  };

  return {
    ...partial,
    recommendationLevel: deriveRecommendationLevel(partial),
    confidenceLevel: deriveConfidenceLevel(partial)
  };
}
