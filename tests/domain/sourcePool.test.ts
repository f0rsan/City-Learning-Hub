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

  it("applies calibrated trust and signal weights for live sources", () => {
    const sources = getSourcePool();
    const eventbrite = sources.find((source) => source.id === "eventbrite-shenzhen");
    const douban = sources.find((source) => source.id === "douban-shenzhen");
    const huodongxing = sources.find((source) => source.id === "huodongxing-shenzhen");
    const meetup = sources.find((source) => source.id === "meetup-shenzhen");
    const szu = sources.find((source) => source.id === "szu-library-events");

    expect(eventbrite).toEqual(
      expect.objectContaining({
        trustLevel: "unverified",
        signalWeight: 0.97
      })
    );
    expect(douban).toEqual(
      expect.objectContaining({
        trustLevel: "high",
        signalWeight: 1.31
      })
    );
    expect(huodongxing).toEqual(
      expect.objectContaining({
        trustLevel: "high",
        signalWeight: 1.29
      })
    );
    expect(meetup).toEqual(
      expect.objectContaining({
        trustLevel: "unverified",
        signalWeight: 1
      })
    );
    expect(szu).toEqual(
      expect.objectContaining({
        trustLevel: "high",
        signalWeight: 1.29
      })
    );
  });

  it("keeps at least 10 real live sources in the source pool", () => {
    const liveSourceIds = [
      "eventbrite-shenzhen",
      "douban-shenzhen",
      "lianpu-tech-events",
      "huodongxing-shenzhen",
      "meetup-shenzhen",
      "nanshan-library-activities",
      "luohu-library-events",
      "szu-library-events",
      "ites-meetings",
      "szwen-cultural-events"
    ];
    const sourceIds = new Set(getSourcePool().map((source) => source.id));

    expect(liveSourceIds.every((id) => sourceIds.has(id))).toBe(true);
  });

  it("classifies expanded sources by collection mode", () => {
    const sources = getSourcePool();
    const autoSourceIds = sources.filter((source) => source.collectionMode === "auto").map((source) => source.id);
    const candidateSourceIds = sources.filter((source) => source.collectionMode === "candidate").map((source) => source.id);
    const reputationSourceIds = sources.filter((source) => source.collectionMode === "reputation").map((source) => source.id);

    expect(autoSourceIds).toEqual(
      expect.arrayContaining([
        "nanshan-library-activities",
        "luohu-library-events",
        "szu-library-events",
        "szcec-futian-schedule",
        "cite-expo",
        "elexcon-shenzhen",
        "eiotexpo-shenzhen"
      ])
    );
    expect(candidateSourceIds).toEqual(
      expect.arrayContaining([
        "eventbrite-shenzhen",
        "meetup-shenzhen",
        "luma-shenzhen",
        "hackquest-shenzhen-hackathons",
        "hackathonradar-shenzhen",
        "sdcon-tech-conference",
        "shenzhen-science-museum",
        "shenzhen-redcube-events",
        "shenzhen-book-city",
        "shenzhen-world-schedule",
        "shenzhen-museum-events",
        "university-town-library",
        "shenzhen-conference-platform",
        "shenzhen-childrens-palace",
        "shenzhen-youth-activity-center"
      ])
    );
    expect(reputationSourceIds).toEqual(
      expect.arrayContaining([
        "wechat-public-accounts",
        "xiaohongshu-shenzhen-events",
        "bilibili-shenzhen-learning",
        "weibo-shenzhen-events"
      ])
    );
  });

  it("keeps every reputation-only source out of direct confirmation", () => {
    const reputationSources = getSourcePool().filter((source) => source.collectionMode === "reputation");

    expect(reputationSources.length).toBeGreaterThan(0);
    expect(reputationSources.every((source) => source.confirmationPower === "none")).toBe(true);
    expect(reputationSources.every((source) => source.trustLevel === "unverified")).toBe(true);
  });
});
