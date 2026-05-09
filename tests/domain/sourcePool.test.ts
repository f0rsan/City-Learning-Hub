import { beforeEach, describe, expect, it } from "vitest";
import {
  SOURCE_HEALTH_THRESHOLDS,
  getSourceHealth,
  getSourcePool,
  recordSourceFailure,
  recordSourceSuccess,
  replaceSourceRuntimeMetrics,
  resetSourceRuntimeMetrics
} from "../../src/domain/sourcePool";

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("sourcePool health decay and recovery", () => {
  beforeEach(() => {
    resetSourceRuntimeMetrics();
  });

  it("decays health by staleness", () => {
    const source = getSourcePool()[0];
    replaceSourceRuntimeMetrics([
      {
        sourceId: source.id,
        consecutiveFailures: 0,
        lastSuccessAt: isoDaysAgo(SOURCE_HEALTH_THRESHOLDS.staleToNeedsReviewDays + 1)
      }
    ]);

    const health = getSourceHealth().find((item) => item.sourceId === source.id);

    expect(health?.health).toBe("needs_review");
  });

  it("decays health by repeated failures", () => {
    const source = getSourcePool()[0];
    replaceSourceRuntimeMetrics([
      {
        sourceId: source.id,
        consecutiveFailures: SOURCE_HEALTH_THRESHOLDS.failuresToFailing,
        lastSuccessAt: isoDaysAgo(1)
      }
    ]);

    const health = getSourceHealth().find((item) => item.sourceId === source.id);

    expect(health?.health).toBe("failing");
  });

  it("recovers health on success by resetting failures", () => {
    const source = getSourcePool()[0];
    recordSourceFailure(source.id, "抓取失败");
    recordSourceFailure(source.id, "结构变化");
    recordSourceFailure(source.id, "超时");
    recordSourceFailure(source.id, "反爬拦截");

    expect(getSourceHealth().find((item) => item.sourceId === source.id)?.health).toBe("failing");

    recordSourceSuccess(source.id);
    const health = getSourceHealth().find((item) => item.sourceId === source.id);

    expect(health).toEqual(
      expect.objectContaining({
        sourceId: source.id,
        health: source.baseHealth,
        consecutiveFailures: 0
      })
    );
    expect(health?.lastSuccessAt).toEqual(expect.any(String));
  });
});
