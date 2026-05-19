import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLiveCollectionSourceDefinitions,
  getCollectionRuns,
  recordSourceFailure,
  runLiveCollection,
  runSimulatedCollection
} from "../../src/domain/collectionQueue";
import { getPublicEvaluatedActivities, resetCandidateData } from "../../src/domain/candidateStore";
import { getSourcePool, getSourceRuntimeMetrics, resetSourceRuntimeMetrics } from "../../src/domain/sourcePool";

describe("collectionQueue", () => {
  beforeEach(() => {
    resetCandidateData();
    resetSourceRuntimeMetrics();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("collects live candidates from real-source adapters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        const bodyForUrl = () => {
          if (url.includes("eventbrite")) {
            return `<script type="application/ld+json">{"itemListElement":[{"item":{"name":"Shenzhen AI Open Day","url":"https://example.com/live-1"}}]}</script>`;
          }
          if (url.includes("api.szbookmall.com")) {
            return JSON.stringify({
              data: {
                list: [
                  {
                    news_id: "2198",
                    new_title: "深圳书城名家读书分享活动"
                  }
                ]
              }
            });
          }
          if (url.includes("douban")) {
            return `<div class="title"><a href="https://www.douban.com/event/100/" title="深圳创客开放夜">深圳创客开放夜</a></div>`;
          }
          if (url.includes("lib.szu.edu.cn/jsonapi")) {
            return JSON.stringify({
              data: [
                {
                  attributes: {
                    title: "AI 资源系列讲座",
                    drupal_internal__nid: 100,
                    event_date: { value: "2026-05-20T10:00:00+08:00" }
                  }
                }
              ]
            });
          }
          if (url.includes("activity.nslib.cn")) {
            return `<a href="https://activity.nslib.cn/activity/info/100">南图双语故事会</a>`;
          }
          if (url.includes("szlhlib.org.cn")) {
            return `<a href="https://www.szlhlib.org.cn/information/100">罗湖读书讲座</a>`;
          }
          if (url.includes("iteschina.com")) {
            return `<a href="https://www.iteschina.com/zh-cn/meeting/100">工业 AI 论坛</a>`;
          }
          if (url.includes("szwen.cn")) {
            return `<a href="https://www.szwen.cn/eventDetail?id=100">深圳文化讲座</a>`;
          }
          if (url.includes("huodongxing.com")) {
            return `<a href="https://www.huodongxing.com/event/100">深圳 AI 沙龙</a>`;
          }
          if (url.includes("szcp.com")) {
            return `<a href="https://www.szcp.com/Activity/detail/100">深圳少年宫科普活动</a>`;
          }
          if (url.includes("meetup.com")) {
            return `<a href="https://www.meetup.com/shenzhen-ai/events/100">Shenzhen AI Meetup</a>`;
          }
          if (url.includes("lu.ma")) {
            return `<a href="https://lu.ma/abc123">Shenzhen Hackathon Meetup</a>`;
          }
          if (url.includes("lianpu.com")) {
            return `<a href="https://lianpu.com/event/100">深圳科技活动</a>`;
          }
          if (url.includes("citexpo.org")) {
            return `<a href="/events/test-100">深圳电子信息论坛</a>`;
          }

          return `<a href="/events/test-100">深圳 AI 技术讲座</a>`;
        };

        if (url.includes("eventbrite")) {
          return {
            ok: true,
            text: async () => bodyForUrl()
          };
        }

        return {
          ok: true,
          text: async () => bodyForUrl()
        };
      })
    );

    const run = await runLiveCollection({ limitPerSource: 1 });

    expect(run.createdCandidateIds.length).toBeGreaterThan(0);
    expect(run.failures).toHaveLength(0);
  });

  it("uses auto and candidate sources in live collection but skips reputation-only sources", () => {
    const definitions = getLiveCollectionSourceDefinitions();
    const ids = definitions.map((source) => source.id);

    expect(ids).toEqual(expect.arrayContaining(["shenzhen-childrens-palace", "luma-shenzhen"]));
    expect(ids).not.toContain("wechat-public-accounts");
    expect(ids).not.toContain("xiaohongshu-shenzhen-events");
    expect(definitions.every((source) => source.collectionMode !== "reputation")).toBe(true);
  });

  it("has a live collection definition for every non-reputation source", () => {
    const definitionIds = new Set(getLiveCollectionSourceDefinitions().map((source) => source.id));
    const expectedIds = getSourcePool()
      .filter((source) => source.collectionMode !== "reputation")
      .map((source) => source.id);

    expect(expectedIds.every((id) => definitionIds.has(id))).toBe(true);
  });

  it("records failures when live source fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const run = await runLiveCollection({ limitPerSource: 1 });

    expect(run.createdCandidateIds.length).toBeGreaterThan(0);
    expect(run.failures.length).toBeGreaterThan(0);
    expect(run.failures[0].reason).toContain("network down");
  });
});
