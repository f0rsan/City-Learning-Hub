import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CANDIDATE_DRAFT_TTL_MS,
  CANDIDATE_PENDING_TTL_MS,
  createCandidateFromSubmission,
  getCandidateActivities,
  getPublicEvaluatedActivities,
  replaceCandidateActivities,
  reevaluateCandidatesForRuleVersionChange,
  resetCandidateData,
  saveCandidateActivity,
  updateCandidateStatus
} from "../../src/domain/candidateStore";
import { addSubmittedActivity, resetLocalHubData } from "../../src/domain/localStore";
import { EVALUATION_RULE_VERSION, evaluateActivity } from "../../src/domain/evaluationRules";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import { sampleActivities } from "../fixtures/sampleData";

describe("candidateStore", () => {
  const liveSeedActivity = liveCollectedActivities[0];

  beforeEach(() => {
    resetLocalHubData();
    resetCandidateData();
  });

  it("merges seed activities and local candidates", () => {
    saveCandidateActivity({
      ...sampleActivities[0],
      id: "local-candidate",
      slug: "local-candidate",
      title: "本地候选活动",
      officialUrl: "https://example.com/local-candidate",
      candidateStatus: "draft",
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    const candidates = getCandidateActivities();

    expect(candidates.some((candidate) => candidate.slug === liveSeedActivity.slug)).toBe(true);
    expect(candidates.some((candidate) => candidate.slug === "local-candidate")).toBe(true);
  });

  it("uses only real collected activities for the production seed", () => {
    const candidates = getCandidateActivities();

    expect(candidates.some((candidate) => candidate.officialUrl.includes("example.com"))).toBe(false);
    expect(candidates.some((candidate) => candidate.title === "南山 AI 互动体验日")).toBe(false);
    expect(getPublicEvaluatedActivities().some((activity) => activity.officialUrl.includes("example.com"))).toBe(false);
  });

  it("detects duplicate slug or official URL", () => {
    const saved = saveCandidateActivity({
      ...liveSeedActivity,
      id: "duplicate-candidate",
      candidateStatus: "draft",
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    expect(saved.duplicateOf).toBe(liveSeedActivity.id);
  });

  it("creates a candidate draft from a submission", () => {
    const submission = addSubmittedActivity({
      title: "深圳机器人开放课",
      category: "亲子科技",
      audience: ["family"],
      dateText: "2026-05-20 10:00",
      district: "南山",
      venue: "深圳湾",
      officialUrl: "https://example.com/robot-open",
      contact: "robot@example.com",
      note: "有动手体验"
    });

    const candidate = createCandidateFromSubmission(submission.id);

    expect(candidate?.candidateStatus).toBe("draft");
    expect(candidate?.submittedActivityId).toBe(submission.id);
  });

  it("publishes candidates only after they have an evaluation", () => {
    const draft = saveCandidateActivity({
      ...sampleActivities[0],
      id: "unevaluated-public",
      slug: "unevaluated-public",
      officialUrl: "https://example.com/unevaluated-public",
      candidateStatus: "published",
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    expect(getPublicEvaluatedActivities().some((activity) => activity.id === draft.id)).toBe(false);

    updateCandidateStatus(draft.id, "evaluated");

    expect(getPublicEvaluatedActivities().some((activity) => activity.id === draft.id)).toBe(true);
  });

  it("re-evaluates outdated rule-version candidates and tracks rule-update changes", () => {
    const baseline = evaluateActivity(sampleActivities[0]);
    saveCandidateActivity({
      ...sampleActivities[0],
      id: "rule-version-candidate",
      slug: "rule-version-candidate",
      officialUrl: "https://example.com/rule-version-candidate",
      candidateStatus: "evaluated",
      evaluation: {
        ...baseline,
        ruleVersion: "evaluation-rules-v0",
        totalScore: baseline.totalScore - 20,
        recommendationLevel: "caution",
        confidenceLevel: "low"
      },
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    const result = reevaluateCandidatesForRuleVersionChange();
    const updatedCandidate = result.find((candidate) => candidate.id === "rule-version-candidate");

    expect(updatedCandidate?.evaluation?.ruleVersion).toBe(EVALUATION_RULE_VERSION);
    expect(updatedCandidate?.evaluationChange?.changedBy).toBe("rule_version_update");
    expect(updatedCandidate?.evaluationChange?.previous.ruleVersion).toBe("evaluation-rules-v0");
    expect(updatedCandidate?.evaluationChange?.previous.recommendationLevel).toBe("caution");
    expect(updatedCandidate?.evaluationChange?.previous.confidenceLevel).toBe("low");
    expect(updatedCandidate?.evaluationChange?.previous.totalScore).toBe(baseline.totalScore - 20);
  });

  it("re-evaluates stale local candidates through public read path without admin page", () => {
    const baseline = evaluateActivity(sampleActivities[0]);
    saveCandidateActivity({
      ...sampleActivities[0],
      id: "public-read-rule-update",
      slug: "public-read-rule-update",
      officialUrl: "https://example.com/public-read-rule-update",
      status: "published",
      candidateStatus: "published",
      evaluation: {
        ...baseline,
        ruleVersion: "evaluation-rules-v0",
        totalScore: baseline.totalScore - 20,
        recommendationLevel: "caution",
        confidenceLevel: "low"
      },
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    const publicActivities = getPublicEvaluatedActivities();
    const updatedCandidate = publicActivities.find((candidate) => candidate.id === "public-read-rule-update");

    expect(updatedCandidate?.evaluation?.ruleVersion).toBe(EVALUATION_RULE_VERSION);
    expect(updatedCandidate?.evaluationChange?.changedBy).toBe("rule_version_update");
  });

  it("does not write local storage when no rule-version update is needed", () => {
    const baseline = evaluateActivity(sampleActivities[0]);
    saveCandidateActivity({
      ...sampleActivities[0],
      id: "up-to-date-rule-version",
      slug: "up-to-date-rule-version",
      officialUrl: "https://example.com/up-to-date-rule-version",
      candidateStatus: "evaluated",
      evaluation: baseline,
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    setItemSpy.mockClear();

    reevaluateCandidatesForRuleVersionChange();

    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it("auto-archives stale draft candidates during shared read path", () => {
    const staleDraftTime = new Date(Date.now() - CANDIDATE_DRAFT_TTL_MS - 60_000).toISOString();

    replaceCandidateActivities([
      {
        ...sampleActivities[0],
        id: "stale-draft-candidate",
        slug: "stale-draft-candidate",
        officialUrl: "https://example.com/stale-draft-candidate",
        candidateStatus: "draft",
        createdAt: staleDraftTime,
        updatedAt: staleDraftTime
      }
    ]);

    const candidates = getCandidateActivities();
    const archived = candidates.find((candidate) => candidate.id === "stale-draft-candidate");

    expect(archived?.candidateStatus).toBe("archived");
    expect(archived?.archiveReason).toBe("draft_ttl_expired");
    expect(archived?.archivedAt).toBeTruthy();
    expect(archived?.status).toBe("expired");
  });

  it("auto-archives stale pending candidates during shared read path", () => {
    const stalePendingTime = new Date(Date.now() - CANDIDATE_PENDING_TTL_MS - 60_000).toISOString();

    replaceCandidateActivities([
      {
        ...sampleActivities[1],
        id: "stale-pending-candidate",
        slug: "stale-pending-candidate",
        officialUrl: "https://example.com/stale-pending-candidate",
        candidateStatus: "pending",
        createdAt: stalePendingTime,
        updatedAt: stalePendingTime
      }
    ]);

    const candidates = getCandidateActivities();
    const archived = candidates.find((candidate) => candidate.id === "stale-pending-candidate");

    expect(archived?.candidateStatus).toBe("archived");
    expect(archived?.archiveReason).toBe("pending_ttl_expired");
    expect(archived?.archivedAt).toBeTruthy();
  });

  it("keeps candidates active when age equals TTL boundary", () => {
    vi.useFakeTimers();
    try {
      const now = new Date("2026-05-10T00:00:00.000Z");
      vi.setSystemTime(now);
      const draftBoundaryTime = new Date(now.getTime() - CANDIDATE_DRAFT_TTL_MS).toISOString();

      replaceCandidateActivities([
        {
          ...sampleActivities[0],
          id: "boundary-draft-candidate",
          slug: "boundary-draft-candidate",
          officialUrl: "https://example.com/boundary-draft-candidate",
          candidateStatus: "draft",
          createdAt: draftBoundaryTime,
          updatedAt: draftBoundaryTime
        }
      ]);

      const candidates = getCandidateActivities();
      const boundaryCandidate = candidates.find((candidate) => candidate.id === "boundary-draft-candidate");

      expect(boundaryCandidate?.candidateStatus).toBe("draft");
      expect(boundaryCandidate?.archiveReason).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to createdAt when updatedAt is invalid, and keeps epoch timestamps valid", () => {
    vi.useFakeTimers();
    try {
      const now = new Date("2026-05-10T00:00:00.000Z");
      vi.setSystemTime(now);

      replaceCandidateActivities([
        {
          ...sampleActivities[0],
          id: "invalid-updated-at-candidate",
          slug: "invalid-updated-at-candidate",
          officialUrl: "https://example.com/invalid-updated-at-candidate",
          candidateStatus: "draft",
          createdAt: new Date(now.getTime() - CANDIDATE_DRAFT_TTL_MS - 60_000).toISOString(),
          updatedAt: "invalid-date"
        },
        {
          ...sampleActivities[1],
          id: "epoch-updated-at-candidate",
          slug: "epoch-updated-at-candidate",
          officialUrl: "https://example.com/epoch-updated-at-candidate",
          candidateStatus: "pending",
          createdAt: now.toISOString(),
          updatedAt: "1970-01-01T00:00:00.000Z"
        }
      ]);

      const candidates = getCandidateActivities();
      const fallbackArchived = candidates.find((candidate) => candidate.id === "invalid-updated-at-candidate");
      const epochArchived = candidates.find((candidate) => candidate.id === "epoch-updated-at-candidate");

      expect(fallbackArchived?.candidateStatus).toBe("archived");
      expect(epochArchived?.candidateStatus).toBe("archived");
    } finally {
      vi.useRealTimers();
    }
  });
});
