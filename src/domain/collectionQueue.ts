import { createCollectedCandidate } from "./candidateStore";
import { collectFromLiveSource, type LiveSourceDefinition } from "./liveSourceAdapters";
import { createId, readList, writeList } from "./localStore";
import { getSourcePool, recordSourceFailure as recordSourceRuntimeFailure, recordSourceSuccess } from "./sourcePool";

export type CollectionFailure = {
  sourceId: string;
  reason: string;
};

export type CollectionRun = {
  id: string;
  createdAt: string;
  createdCandidateIds: string[];
  failures: CollectionFailure[];
};

const collectionRunsKey = "shenzhen-learning-hub:collection-runs";
const liveSourceDefinitions: Record<string, LiveSourceDefinition> = {
  "nanshan-tech-museum": {
    id: "nanshan-tech-museum",
    name: "深圳科学馆",
    url: "https://www.szstm.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/科普|活动|讲座|展|科学/],
    timeoutMs: 12000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "深圳科学馆科普活动安排",
        url: "https://szstm.com/mobile/html/gk/sj"
      }
    ]
  },
  "shenzhen-book-city": {
    id: "shenzhen-book-city",
    name: "深圳书城",
    url: "https://www.szbookmall.com/activity",
    parser: "bookmall_news_api",
    request: {
      url: "https://api.szbookmall.com/www/news/list",
      method: "POST",
      headers: { "content-type": "application/json;charset=UTF-8" },
      body: JSON.stringify({ pageNumber: 1, pageSize: 30 })
    },
    includeTitlePatterns: [/活动|讲座|读书|沙龙|分享|展|亲子|书城|文化|会员/],
    timeoutMs: 12000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "深圳书城活动线索页",
        url: "https://www.szbookmall.com/activity"
      }
    ]
  },
  "tech-community": {
    id: "tech-community",
    name: "深圳技术社区线索",
    url: "https://lu.ma/discover?location=Shenzhen",
    parser: "generic_event_links",
    includeUrlPatterns: [/lu\.ma\/[a-z0-9]+/i],
    includeTitlePatterns: [/Shenzhen|深圳|Hackathon|Meetup|AI|Workshop|Salon|Tech|Founder|Developer/i],
    requireLocalSignal: true,
    timeoutMs: 16000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "Luma 深圳线索页",
        url: "https://lu.ma/discover?location=Shenzhen"
      }
    ]
  },
  "shenzhen-conference-platform": {
    id: "shenzhen-conference-platform",
    name: "深圳会展中心近期展会",
    url: "https://www.szcec.com/szcec/cn-schedule/current/index.html",
    parser: "generic_event_links",
    includeTitlePatterns: [/展|博览|会议|论坛|大会|深圳/],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "eventbrite-shenzhen": {
    id: "eventbrite-shenzhen",
    name: "Eventbrite 深圳",
    url: "https://www.eventbrite.com/d/china--shenzhen/events/",
    parser: "eventbrite_jsonld",
    requireLocalSignal: true,
    timeoutMs: 12000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "Eventbrite 深圳线索页",
        url: "https://www.eventbrite.com/d/china--shenzhen/events/"
      }
    ]
  },
  "douban-shenzhen": {
    id: "douban-shenzhen",
    name: "豆瓣同城深圳",
    url: "https://shenzhen.douban.com/",
    parser: "douban_event_links",
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "lianpu-tech-events": {
    id: "lianpu-tech-events",
    name: "联谱科技活动",
    url: "https://lianpu.com/",
    parser: "generic_event_links",
    includeUrlPatterns: [/\/event\//],
    includeTitlePatterns: [/深圳|活动|讲座|沙龙|论坛|大会|AI|科技|工作坊|Hackathon/i],
    requireLocalSignal: true,
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "huodongxing-shenzhen": {
    id: "huodongxing-shenzhen",
    name: "活动行深圳",
    url: "https://www.huodongxing.com/events?city=%E6%B7%B1%E5%9C%B3",
    parser: "generic_event_links",
    includeUrlPatterns: [/huodongxing\.com\/event\//],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "meetup-shenzhen": {
    id: "meetup-shenzhen",
    name: "Meetup 深圳",
    url: "https://www.meetup.com/find/?location=cn--shenzhen&source=EVENTS",
    parser: "generic_event_links",
    includeUrlPatterns: [/meetup\.com\/.+\/events\/\d+/],
    includeTitlePatterns: [/Shenzhen|深圳|Hackathon|Meetup|AI|Workshop|Salon|Tech|Founder|Developer/i],
    requireLocalSignal: true,
    timeoutMs: 15000,
    collectionMode: "candidate"
  },
  "nanshan-library-activities": {
    id: "nanshan-library-activities",
    name: "南山图书馆活动平台",
    url: "https://activity.nslib.cn/",
    parser: "generic_event_links",
    includeUrlPatterns: [/activity\.nslib\.cn\/activity\/info\/\d+/],
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "luohu-library-events": {
    id: "luohu-library-events",
    name: "罗湖图书馆活动速递",
    url: "https://www.szlhlib.org.cn/category/1021",
    parser: "generic_event_links",
    includeUrlPatterns: [/szlhlib\.org\.cn\/information\/\d+/],
    includeTitlePatterns: [/活动|讲座|读书|图书馆|AI|故事|展/],
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "szu-library-events": {
    id: "szu-library-events",
    name: "深圳大学图书馆活动",
    url: "https://www.lib.szu.edu.cn/jsonapi/node/event?sort=-event_date.value",
    parser: "szu_jsonapi_events",
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "ites-meetings": {
    id: "ites-meetings",
    name: "ITES 深圳工业展会议活动",
    url: "https://www.iteschina.com/zh-cn/meeting",
    parser: "generic_event_links",
    includeUrlPatterns: [/iteschina\.com\/zh-cn\/meeting\/\d+/],
    timeoutMs: 18000,
    collectionMode: "auto"
  },
  "szwen-cultural-events": {
    id: "szwen-cultural-events",
    name: "深圳文体通活动",
    url: "https://www.szwen.cn/",
    parser: "generic_event_links",
    includeUrlPatterns: [/szwen\.cn\/eventDetail\?id=/],
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "shenzhen-childrens-palace": {
    id: "shenzhen-childrens-palace",
    name: "深圳市少年宫主题活动",
    url: "https://www.szcp.com/Activity/",
    parser: "generic_event_links",
    includeUrlPatterns: [/szcp\.com\/Activity\//],
    includeTitlePatterns: [/活动|科学|艺术|科普|讲座|展|课程|工作坊/],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "shenzhen-science-museum": {
    id: "shenzhen-science-museum",
    name: "深圳科学馆",
    url: "https://www.szstm.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/科普|活动|讲座|展|科学/],
    timeoutMs: 12000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "深圳科学馆科普活动安排",
        url: "https://szstm.com/mobile/html/gk/sj"
      }
    ]
  },
  "shenzhen-museum-events": {
    id: "shenzhen-museum-events",
    name: "深圳博物馆活动讲座",
    url: "https://www.shenzhenmuseum.com/webCollection",
    parser: "generic_event_links",
    includeTitlePatterns: [/活动|讲座|展览|小讲解员|预约/],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "university-town-library": {
    id: "university-town-library",
    name: "深圳大学城图书馆",
    url: "https://www.utszlib.edu.cn/",
    parser: "generic_event_links",
    includeTitlePatterns: [/讲座|活动|AI|读书|培训|展|沙龙/],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "shenzhen-redcube-events": {
    id: "shenzhen-redcube-events",
    name: "深圳红立方文化活动",
    url: "https://www.sz-redcube.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/文化活动|活动|讲座|科普|展/],
    timeoutMs: 12000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "深圳红立方文化活动",
        url: "https://www.sz-redcube.com/"
      }
    ]
  },
  "shenzhen-youth-activity-center": {
    id: "shenzhen-youth-activity-center",
    name: "深圳市青少年活动中心",
    url: "https://www.szaac.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/活动|讲座|科技|课程|青少年|红领巾|展/],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "shenzhen-world-schedule": {
    id: "shenzhen-world-schedule",
    name: "深圳国际会展中心排期",
    url: "https://www.shenzhen-world.com/scheduling/index.html",
    parser: "landing_page_event",
    includeTitlePatterns: [/展|博览|会议|论坛|大会|深圳/],
    timeoutMs: 12000,
    collectionMode: "candidate"
  },
  "szcec-futian-schedule": {
    id: "szcec-futian-schedule",
    name: "深圳会展中心近期展会",
    url: "https://www.szcec.com/szcec/cn-schedule/current/index.html",
    parser: "generic_event_links",
    includeTitlePatterns: [/展|博览|会议|论坛|大会|深圳/],
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "cite-expo": {
    id: "cite-expo",
    name: "CITE 中国电子信息博览会",
    url: "https://www.citexpo.org/about/introduction.html",
    parser: "landing_page_event",
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "elexcon-shenzhen": {
    id: "elexcon-shenzhen",
    name: "ELEXCON 深圳国际电子展",
    url: "https://elexcon.com/en",
    parser: "landing_page_event",
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "eiotexpo-shenzhen": {
    id: "eiotexpo-shenzhen",
    name: "E-IOT 嵌入式与物联网展",
    url: "https://www.eiotexpo.com/",
    parser: "landing_page_event",
    timeoutMs: 12000,
    collectionMode: "auto"
  },
  "luma-shenzhen": {
    id: "luma-shenzhen",
    name: "Luma 深圳活动",
    url: "https://lu.ma/discover?location=Shenzhen",
    parser: "generic_event_links",
    includeUrlPatterns: [/lu\.ma\/[a-z0-9]+/i],
    includeTitlePatterns: [/Shenzhen|深圳|Hackathon|Meetup|AI|Workshop|Salon|Tech|Founder|Developer/i],
    requireLocalSignal: true,
    timeoutMs: 16000,
    collectionMode: "candidate",
    fallbackItems: [
      {
        title: "Luma 深圳线索页",
        url: "https://lu.ma/discover?location=Shenzhen"
      }
    ]
  },
  "hackquest-shenzhen-hackathons": {
    id: "hackquest-shenzhen-hackathons",
    name: "HackQuest 深圳 Hackathon",
    url: "https://www.hackquest.io/en/hackathons/AI-%C3%97-Web3-%E9%BB%91%E5%AE%A2%E6%9D%BE%E6%B7%B1%E5%9C%B3%E7%AB%99",
    parser: "landing_page_event",
    timeoutMs: 16000,
    collectionMode: "candidate"
  },
  "hackathonradar-shenzhen": {
    id: "hackathonradar-shenzhen",
    name: "HackathonRadar 深圳线索",
    url: "https://www.hackathonradar.com/database/hackathon/9a9d9772-703e-4263-b163-c1f52cb784a8",
    parser: "landing_page_event",
    timeoutMs: 16000,
    collectionMode: "candidate"
  },
  "sdcon-tech-conference": {
    id: "sdcon-tech-conference",
    name: "SDCon 技术大会",
    url: "https://sdcon.com.cn/",
    parser: "landing_page_event",
    timeoutMs: 12000,
    collectionMode: "reputation"
  },
  "iotexpo-shenzhen": {
    id: "iotexpo-shenzhen",
    name: "IOTE 深圳物联网展",
    url: "https://www.iotexpo.com.cn/sz/",
    parser: "landing_page_event",
    timeoutMs: 12000,
    collectionMode: "auto"
  }
};

export function getLiveCollectionSourceDefinitions() {
  return Object.values(liveSourceDefinitions).filter((source) => source.collectionMode !== "reputation");
}

function writeRun(run: CollectionRun) {
  writeList(collectionRunsKey, [run, ...getCollectionRuns()]);
  return run;
}

export function getCollectionRuns() {
  return readList<CollectionRun>(collectionRunsKey);
}

export function runSimulatedCollection() {
  const sources = getSourcePool().filter((source) => source.health !== "failing");
  const createdCandidateIds = sources.slice(0, 2).map((source, index) => {
    const candidate = createCollectedCandidate({
      title: `自动采集候选：${source.name}${index + 1}`,
      category: index === 0 ? "科技展会" : "读书沙龙",
      audience: index === 0 ? ["adult"] : ["family", "adult"],
      sourceId: source.id,
      officialUrl: `${source.url}/auto-candidate-${index + 1}`
    });
    recordSourceSuccess(source.id);

    return candidate.id;
  });

  return writeRun({
    id: createId("collection"),
    createdAt: new Date().toISOString(),
    createdCandidateIds,
    failures: []
  });
}

function inferCategory(title: string) {
  if (/(hackathon|黑客松|创客)/i.test(title)) {
    return "Hackathon" as const;
  }
  if (/(讲座|论坛|峰会|会议|meetup)/i.test(title)) {
    return "技术大会" as const;
  }
  if (/(读书|沙龙)/i.test(title)) {
    return "读书沙龙" as const;
  }
  if (/(展|博览|体验|艺术)/i.test(title)) {
    return "科技展会" as const;
  }

  return "社科讲座" as const;
}

function inferAudience(title: string) {
  if (/(亲子|儿童|kids|family)/i.test(title)) {
    return ["family", "adult"] as const;
  }

  return ["adult"] as const;
}

export async function runLiveCollection(options: { limitPerSource?: number } = {}) {
  const limitPerSource = options.limitPerSource ?? 5;
  const liveSources = getSourcePool().filter(
    (source) => source.id in liveSourceDefinitions && source.collectionMode !== "reputation" && source.health !== "failing"
  );
  const createdCandidateIds: string[] = [];
  const failures: CollectionFailure[] = [];

  for (const source of liveSources) {
    const definition = liveSourceDefinitions[source.id];
    const result = await collectFromLiveSource(definition);

    if (!result.success) {
      failures.push({
        sourceId: source.id,
        reason: result.error ?? "实时采集失败"
      });
      recordSourceRuntimeFailure(source.id, result.error ?? "实时采集失败");
      continue;
    }

    const sourceCandidates = result.items.slice(0, limitPerSource).map((item) =>
      createCollectedCandidate({
        title: item.title,
        category: inferCategory(item.title),
        audience: [...inferAudience(item.title)],
        sourceId: source.id,
        officialUrl: item.url
      })
    );

    createdCandidateIds.push(...sourceCandidates.map((candidate) => candidate.id));
    recordSourceSuccess(source.id);
  }

  return writeRun({
    id: createId("collection"),
    createdAt: new Date().toISOString(),
    createdCandidateIds,
    failures
  });
}

export function recordSourceFailure(sourceId: string, reason: string) {
  recordSourceRuntimeFailure(sourceId, reason);

  return writeRun({
    id: createId("collection"),
    createdAt: new Date().toISOString(),
    createdCandidateIds: [],
    failures: [{ sourceId, reason }]
  });
}

export function replaceCollectionRuns(runs: CollectionRun[]) {
  writeList(collectionRunsKey, runs);
}

export function resetCollectionRuns() {
  window.localStorage.removeItem(collectionRunsKey);
}
