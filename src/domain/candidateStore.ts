import { EVALUATION_RULE_VERSION, evaluateActivity } from "./evaluationRules";
import type {
  ActivityEvaluation,
  CandidateActivity,
  CandidateArchiveReason,
  CandidateStatus,
  EvaluationChangeSnapshot
} from "./evaluationTypes";
import {
  createId,
  getCorrectionImpacts,
  getSubmittedActivities,
  readList,
  writeList
} from "./localStore";
import { sampleActivities } from "./sampleData";
import { getSourcePool } from "./sourcePool";
import type { Activity, ActivityStatus, Audience } from "./types";

const candidateActivitiesKey = "shenzhen-learning-hub:candidate-activities";
export const CANDIDATE_DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const CANDIDATE_PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const candidateTtlByStatus: Partial<Record<CandidateStatus, number>> = {
  draft: CANDIDATE_DRAFT_TTL_MS,
  pending: CANDIDATE_PENDING_TTL_MS
};

function now() {
  return new Date().toISOString();
}

function evaluationContext() {
  return { sources: getSourcePool(), correctionImpacts: getCorrectionImpacts() };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function districtFromInput(value: string): Activity["district"] {
  const districts: Activity["district"][] = ["南山", "福田", "宝安", "龙岗", "罗湖", "盐田", "光明"];
  return districts.find((district) => value.includes(district)) ?? "南山";
}

function seedCandidates(): CandidateActivity[] {
  return sampleActivities.map((activity) => {
    const evaluation = evaluateActivity(activity, evaluationContext());
    return {
      ...activity,
      evaluation,
      candidateStatus: activity.status === "cancelled" ? "cancelled" : "evaluated",
      createdAt: activity.lastConfirmedAt,
      updatedAt: activity.lastConfirmedAt
    };
  });
}

function localCandidates() {
  return readList<CandidateActivity>(candidateActivitiesKey);
}

function writeLocalCandidates(candidates: CandidateActivity[]) {
  writeList(candidateActivitiesKey, candidates);
}

function parseIsoToMs(value?: string) {
  if (!value) {
    return Number.NaN;
  }

  return Date.parse(value);
}

function resolveLastTouchedMs(candidate: Pick<CandidateActivity, "updatedAt" | "createdAt">) {
  const updatedAtMs = parseIsoToMs(candidate.updatedAt);
  if (!Number.isNaN(updatedAtMs)) {
    return updatedAtMs;
  }

  return parseIsoToMs(candidate.createdAt);
}

function getArchiveReason(status: CandidateStatus): CandidateArchiveReason | undefined {
  if (status === "draft") {
    return "draft_ttl_expired";
  }

  if (status === "pending") {
    return "pending_ttl_expired";
  }

  return undefined;
}

function autoArchiveStaleCandidates(candidates: CandidateActivity[]) {
  const referenceTime = Date.now();
  const archivedAt = now();
  let changed = false;
  const updated: CandidateActivity[] = candidates.map((candidate): CandidateActivity => {
    const ttl = candidateTtlByStatus[candidate.candidateStatus];

    if (!ttl) {
      return candidate;
    }

    const lastTouchedMs = resolveLastTouchedMs(candidate);
    if (Number.isNaN(lastTouchedMs) || referenceTime - lastTouchedMs <= ttl) {
      return candidate;
    }

    const archiveReason = getArchiveReason(candidate.candidateStatus);
    if (!archiveReason) {
      return candidate;
    }

    changed = true;

    return {
      ...candidate,
      candidateStatus: "archived",
      status: "expired",
      archivedAt,
      archiveReason,
      updatedAt: archivedAt
    };
  });

  if (changed) {
    writeLocalCandidates(updated);
  }

  return updated;
}

function findDuplicate(candidate: CandidateActivity, allCandidates: CandidateActivity[]) {
  return allCandidates.find(
    (existing) =>
      existing.id !== candidate.id &&
      (existing.slug === candidate.slug || existing.officialUrl === candidate.officialUrl)
  );
}

function toEvaluationSnapshot(evaluation: ActivityEvaluation): EvaluationChangeSnapshot {
  return {
    ruleVersion: evaluation.ruleVersion,
    recommendationLevel: evaluation.recommendationLevel,
    confidenceLevel: evaluation.confidenceLevel,
    totalScore: evaluation.totalScore,
    evaluatedAt: evaluation.evaluatedAt
  };
}

function hasRuleUpdateScoreChange(previous: ActivityEvaluation, next: ActivityEvaluation) {
  return (
    previous.totalScore !== next.totalScore ||
    previous.recommendationLevel !== next.recommendationLevel ||
    previous.confidenceLevel !== next.confidenceLevel
  );
}

function ensureEvaluation(candidate: CandidateActivity) {
  if (candidate.candidateStatus === "evaluated") {
    return {
      ...candidate,
      evaluation: evaluateActivity(candidate, evaluationContext())
    };
  }

  if (candidate.candidateStatus === "published" && candidate.evaluation) {
    return {
      ...candidate,
      evaluation: evaluateActivity(candidate, evaluationContext())
    };
  }

  return candidate;
}

function getFreshLocalCandidates() {
  const current = autoArchiveStaleCandidates(localCandidates());
  const hasOutdatedRuleVersion = current.some(
    (candidate) => candidate.evaluation && candidate.evaluation.ruleVersion !== EVALUATION_RULE_VERSION
  );

  if (!hasOutdatedRuleVersion) {
    return current.map(ensureEvaluation);
  }

  return reevaluateCandidatesForRuleVersionChange().map(ensureEvaluation);
}

export function getCandidateActivities() {
  const seeds = seedCandidates();
  const local = getFreshLocalCandidates();
  return [...local, ...seeds];
}

export function saveCandidateActivity(candidate: CandidateActivity) {
  const next = {
    ...candidate,
    updatedAt: now()
  };
  const duplicate = findDuplicate(next, getCandidateActivities());
  const withDuplicate = duplicate ? { ...next, duplicateOf: duplicate.id } : next;
  const existing = localCandidates();
  const updated = existing.some((item) => item.id === withDuplicate.id)
    ? existing.map((item) => (item.id === withDuplicate.id ? withDuplicate : item))
    : [withDuplicate, ...existing];

  writeLocalCandidates(updated);
  return withDuplicate;
}

export function createCandidateFromSubmission(submissionId: string) {
  const submission = getSubmittedActivities().find((item) => item.id === submissionId);

  if (!submission) {
    return undefined;
  }

  const candidate: CandidateActivity = {
    id: createId("candidate"),
    slug: slugify(submission.title) || createId("candidate-slug"),
    title: submission.title,
    summary: submission.note,
    category: submission.category,
    audience: submission.audience,
    tags: submission.audience.includes("family") ? ["候选", "亲子"] : ["候选", "成人"],
    district: districtFromInput(submission.district),
    venue: submission.venue,
    address: submission.venue,
    startAt: "2026-05-20T10:00:00+08:00",
    endAt: "2026-05-20T12:00:00+08:00",
    priceType: "免费",
    priceNote: "待确认",
    reservationRequired: true,
    ageBand: submission.audience.includes("family") ? "待确认" : undefined,
    difficulty: "入门",
    recommendation: submission.note,
    bestFor: submission.audience.includes("family") ? "亲子家庭，待系统补充证据。" : "成人学习交流，待系统补充证据。",
    cautions: ["候选活动，信息仍需系统评估和人工校准"],
    officialUrl: submission.officialUrl,
    sourceId: "user-submission",
    lastConfirmedAt: now().slice(0, 10),
    status: "draft" satisfies ActivityStatus,
    weeklyFeatured: false,
    childSafetyComplete: !submission.audience.includes("family"),
    candidateStatus: "draft",
    submittedActivityId: submission.id,
    createdAt: now(),
    updatedAt: now()
  };

  return saveCandidateActivity(candidate);
}

export function updateCandidateStatus(id: string, status: CandidateStatus) {
  const existing = localCandidates();
  const timestamp = now();
  const updated = existing.map((candidate) => {
    if (candidate.id !== id) {
      return candidate;
    }

    const activityStatus: ActivityStatus =
      status === "cancelled"
        ? "cancelled"
        : status === "rejected"
          ? "uncertain"
          : status === "archived"
            ? "expired"
            : status === "draft" || status === "pending"
              ? "draft"
              : "published";
    const next = {
      ...candidate,
      candidateStatus: status,
      status: activityStatus,
      archivedAt: status === "archived" ? candidate.archivedAt ?? timestamp : undefined,
      archiveReason: status === "archived" ? candidate.archiveReason : undefined,
      evaluation:
        status === "evaluated" || status === "published"
          ? evaluateActivity({ ...candidate, status: activityStatus }, evaluationContext())
          : candidate.evaluation,
      updatedAt: timestamp
    };

    return next;
  });

  writeLocalCandidates(updated);
  return updated.find((candidate) => candidate.id === id);
}

export function getPublicEvaluatedActivities() {
  return getCandidateActivities()
    .filter((candidate) => candidate.candidateStatus === "evaluated" || candidate.candidateStatus === "published")
    .filter((candidate) => Boolean(candidate.evaluation))
    .filter((candidate) => candidate.status === "published")
    .filter((candidate) => candidate.evaluation?.recommendationLevel !== "blocked")
    .map((candidate) => ({ ...candidate, evaluation: candidate.evaluation }));
}

export function replaceCandidateActivities(candidates: CandidateActivity[]) {
  writeLocalCandidates(candidates);
}

export function reevaluateCandidatesForRuleVersionChange() {
  const existing = localCandidates();
  const timestamp = now();
  let hasRuleVersionUpdates = false;
  const updated: CandidateActivity[] = existing.map((candidate): CandidateActivity => {
    if (!candidate.evaluation || candidate.evaluation.ruleVersion === EVALUATION_RULE_VERSION) {
      return candidate;
    }

    hasRuleVersionUpdates = true;
    const previousEvaluation = candidate.evaluation;
    const nextEvaluation = evaluateActivity(candidate, evaluationContext());
    const changed = hasRuleUpdateScoreChange(previousEvaluation, nextEvaluation);

    return {
      ...candidate,
      evaluation: nextEvaluation,
      evaluationChange: changed
        ? {
            changedBy: "rule_version_update",
            reason: "规则版本更新后重新评分",
            changedAt: timestamp,
            previous: toEvaluationSnapshot(previousEvaluation)
          }
        : undefined,
      updatedAt: timestamp
    };
  });

  if (!hasRuleVersionUpdates) {
    return existing;
  }

  writeLocalCandidates(updated);
  return updated;
}

export function resetCandidateData() {
  window.localStorage.removeItem(candidateActivitiesKey);
}

export function createCollectedCandidate(input: {
  title: string;
  category: Activity["category"];
  audience: Audience[];
  sourceId: string;
  officialUrl: string;
}) {
  return saveCandidateActivity({
    id: createId("candidate"),
    slug: slugify(input.title),
    title: input.title,
    summary: "自动采集候选，需要系统评估后才可公开展示。",
    category: input.category,
    audience: input.audience,
    tags: ["自动采集", "候选"],
    district: "南山",
    venue: "待确认场地",
    address: "深圳市",
    startAt: "2026-05-21T10:00:00+08:00",
    endAt: "2026-05-21T12:00:00+08:00",
    priceType: "免费",
    priceNote: "待确认",
    reservationRequired: true,
    difficulty: "入门",
    recommendation: "来源池自动发现，等待系统补全证据。",
    bestFor: "待系统判断适合人群。",
    cautions: ["自动采集候选，未完成评估前不公开推荐"],
    officialUrl: input.officialUrl,
    sourceId: input.sourceId,
    lastConfirmedAt: now().slice(0, 10),
    status: "draft",
    weeklyFeatured: false,
    childSafetyComplete: !input.audience.includes("family"),
    candidateStatus: "pending",
    collectedFromSourceId: input.sourceId,
    createdAt: now(),
    updatedAt: now()
  });
}
