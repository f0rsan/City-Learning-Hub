import { describe, expect, it } from "vitest";
import { evaluateActivity } from "../../src/domain/evaluationRules";
import { sampleActivities, sampleSources } from "../../src/domain/sampleData";
import type { Activity } from "../../src/domain/types";

const baseActivity = sampleActivities.find((activity) => activity.slug === "nanshan-ai-family-day")!;

describe("evaluationRules", () => {
  it("returns recommendation, confidence, reasons, evidence, and separate audience fit", () => {
    const evaluation = evaluateActivity(baseActivity, { sources: sampleSources });

    expect(evaluation.recommendationLevel).toBeDefined();
    expect(evaluation.confidenceLevel).toBeDefined();
    expect(evaluation.valueReasons.length).toBeGreaterThan(0);
    expect(evaluation.riskReasons.length).toBeGreaterThan(0);
    expect(evaluation.evidenceSignals.length).toBeGreaterThanOrEqual(5);
    expect(evaluation.audienceFit.family?.level).toBe("recommended");
    expect(evaluation.audienceFit.adult?.level).toBe("not_applicable");
  });

  it("official source raises trust but does not automatically create high value", () => {
    const thinActivity: Activity = {
      ...baseActivity,
      id: "thin-official",
      slug: "thin-official",
      title: "官方但内容很薄的活动",
      summary: "信息很少。",
      recommendation: "",
      bestFor: "",
      tags: [],
      cautions: [],
      sourceId: "nanshan-tech-museum"
    };

    const evaluation = evaluateActivity(thinActivity, { sources: sampleSources });

    expect(evaluation.evidenceSignals.find((signal) => signal.type === "source")?.score).toBeGreaterThan(0);
    expect(evaluation.recommendationLevel).not.toBe("strong");
  });

  it("missing child safety blocks high confidence family recommendation", () => {
    const weakFamilyActivity = sampleActivities.find((activity) => activity.slug === "child-safety-weak-sample")!;

    const evaluation = evaluateActivity(weakFamilyActivity, { sources: sampleSources });

    expect(evaluation.audienceFit.family?.level).toBe("blocked");
    expect(evaluation.confidenceLevel).not.toBe("high");
    expect(evaluation.riskReasons.join(" ")).toContain("亲子安全信息不足");
  });

  it("cancelled activities are blocked", () => {
    const cancelled = sampleActivities.find((activity) => activity.slug === "cancelled-ai-lecture")!;

    const evaluation = evaluateActivity(cancelled, { sources: sampleSources });

    expect(evaluation.recommendationLevel).toBe("blocked");
    expect(evaluation.riskReasons.join(" ")).toContain("活动已取消");
  });

  it("new organizer with good content can be medium confidence instead of low value", () => {
    const evaluation = evaluateActivity(baseActivity, {
      sources: sampleSources,
      organizerHistory: {
        [baseActivity.sourceId]: {
          organizerName: "新组织方",
          completedEvents: 0,
          positiveSignals: 0,
          correctionCount: 0
        }
      }
    });

    expect(evaluation.recommendationLevel).toMatch(/strong|good/);
    expect(evaluation.confidenceLevel).toBe("medium");
  });

  it("social signal cannot dominate the final score alone", () => {
    const thinActivity: Activity = {
      ...baseActivity,
      id: "social-only",
      slug: "social-only",
      summary: "只有社媒热度。",
      recommendation: "",
      bestFor: "",
      tags: [],
      childSafetyComplete: false,
      sourceId: "unknown-source"
    };

    const evaluation = evaluateActivity(thinActivity, {
      sources: [],
      socialSignals: {
        [thinActivity.slug]: {
          mentionCount: 500,
          sentiment: "positive",
          summary: "讨论热度很高"
        }
      }
    });

    expect(evaluation.recommendationLevel).not.toBe("strong");
    expect(evaluation.confidenceLevel).not.toBe("high");
  });
});
