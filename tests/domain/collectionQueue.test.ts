import { beforeEach, describe, expect, it } from "vitest";
import {
  getCollectionRuns,
  recordSourceFailure,
  runSimulatedCollection
} from "../../src/domain/collectionQueue";
import { getPublicEvaluatedActivities, resetCandidateData } from "../../src/domain/candidateStore";
import { getSourcePool, getSourceRuntimeMetrics, resetSourceRuntimeMetrics } from "../../src/domain/sourcePool";

describe("collectionQueue", () => {
  beforeEach(() => {
    resetCandidateData();
    resetSourceRuntimeMetrics();
  });

  it("lists stable sources", () => {
    const sources = getSourcePool();

    expect(sources.some((source) => source.city === "深圳")).toBe(true);
    expect(sources.every((source) => source.url.startsWith("https://"))).toBe(true);
  });

  it("creates candidate records from a collection run", () => {
    const run = runSimulatedCollection();

    expect(run.createdCandidateIds.length).toBeGreaterThan(0);
    expect(getCollectionRuns()[0].id).toBe(run.id);
  });

  it("records source failures", () => {
    const source = getSourcePool()[0];

    const run = recordSourceFailure(source.id, "页面结构变化");
    const metrics = getSourceRuntimeMetrics().find((item) => item.sourceId === source.id);

    expect(run.failures[0]).toEqual(expect.objectContaining({ sourceId: source.id, reason: "页面结构变化" }));
    expect(metrics).toEqual(
      expect.objectContaining({
        sourceId: source.id,
        consecutiveFailures: 1,
        lastFailureReason: "页面结构变化"
      })
    );
  });

  it("keeps collected candidates out of public display until evaluated", () => {
    runSimulatedCollection();

    expect(getPublicEvaluatedActivities().some((activity) => activity.title.includes("自动采集"))).toBe(false);
  });

  it("updates success runtime metrics for collected sources", () => {
    const run = runSimulatedCollection();
    const metrics = getSourceRuntimeMetrics();

    expect(run.createdCandidateIds.length).toBeGreaterThan(0);
    expect(metrics.filter((item) => item.lastSuccessAt).length).toBeGreaterThan(0);
    expect(metrics.every((item) => item.consecutiveFailures === 0)).toBe(true);
  });
});
