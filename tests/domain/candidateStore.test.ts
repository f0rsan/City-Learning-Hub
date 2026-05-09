import { beforeEach, describe, expect, it } from "vitest";
import {
  createCandidateFromSubmission,
  getCandidateActivities,
  getPublicEvaluatedActivities,
  resetCandidateData,
  saveCandidateActivity,
  updateCandidateStatus
} from "../../src/domain/candidateStore";
import { addSubmittedActivity, resetLocalHubData } from "../../src/domain/localStore";
import { sampleActivities } from "../../src/domain/sampleData";

describe("candidateStore", () => {
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

    expect(candidates.some((candidate) => candidate.slug === sampleActivities[0].slug)).toBe(true);
    expect(candidates.some((candidate) => candidate.slug === "local-candidate")).toBe(true);
  });

  it("detects duplicate slug or official URL", () => {
    const saved = saveCandidateActivity({
      ...sampleActivities[0],
      id: "duplicate-candidate",
      candidateStatus: "draft",
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    expect(saved.duplicateOf).toBe(sampleActivities[0].id);
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
});
