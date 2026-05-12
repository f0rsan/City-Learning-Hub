import type { ActivitySource } from "./types";
import { readList, writeList } from "./localStore";
import { sourceCalibrationOverrides } from "./sourceCalibration";

export type SourceHealth = "healthy" | "needs_review" | "failing";
export type SourceRuntimeMetrics = {
  sourceId: string;
  consecutiveFailures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastFailureReason?: string;
};

export type SourcePoolItem = ActivitySource & {
  city: "深圳";
  cadence: "daily" | "weekly" | "monthly";
  baseHealth: SourceHealth;
  health: SourceHealth;
  runtime: SourceRuntimeMetrics;
  sourceFamily: NonNullable<ActivitySource["sourceFamily"]>;
  collectionMode: NonNullable<ActivitySource["collectionMode"]>;
  accessMode: NonNullable<ActivitySource["accessMode"]>;
  coverageTags: string[];
  complianceLevel: NonNullable<ActivitySource["complianceLevel"]>;
  confirmationPower: NonNullable<ActivitySource["confirmationPower"]>;
};

type BaseSourcePoolItem = Omit<SourcePoolItem, "health" | "runtime">;

const sourceRuntimeMetricsKey = "shenzhen-learning-hub:source-runtime-metrics";

export const SOURCE_HEALTH_THRESHOLDS = {
  staleToNeedsReviewDays: 21,
  staleToFailingDays: 45,
  failuresToNeedsReview: 2,
  failuresToFailing: 4
} as const;

const sourcePool: BaseSourcePoolItem[] = [
  {
    id: "nanshan-tech-museum",
    name: "深圳科学馆",
    type: "venue",
    city: "深圳",
    url: "https://www.szstm.com/",
    trustLevel: "medium",
    signalWeight: 0.95,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["亲子科技", "科普", "福田"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-book-city",
    name: "深圳书城",
    type: "bookstore",
    city: "深圳",
    url: "https://www.szbookmall.com/activity",
    trustLevel: "high",
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["读书沙龙", "社科讲座", "亲子"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "tech-community",
    name: "深圳技术社区线索",
    type: "community",
    city: "深圳",
    url: "https://lu.ma/discover?location=Shenzhen",
    trustLevel: "medium",
    signalWeight: 0.9,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["技术大会", "Hackathon", "AI"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-conference-platform",
    name: "深圳会展中心近期展会",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.szcec.com/szcec/cn-schedule/current/index.html",
    trustLevel: "medium",
    signalWeight: 1.1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["电子展会", "科技展会", "福田"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "eventbrite-shenzhen",
    name: "Eventbrite 深圳",
    type: "listing-platform",
    city: "深圳",
    url: "https://www.eventbrite.com/d/china--shenzhen/events/",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "needs_review",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["技术大会", "国际活动"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "douban-shenzhen",
    name: "豆瓣同城深圳",
    type: "listing-platform",
    city: "深圳",
    url: "https://shenzhen.douban.com/",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["社科讲座", "读书沙龙", "展览"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "lianpu-tech-events",
    name: "联谱科技活动",
    type: "listing-platform",
    city: "深圳",
    url: "https://lianpu.com/",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "needs_review",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["技术大会", "科技展会"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "huodongxing-shenzhen",
    name: "活动行深圳",
    type: "listing-platform",
    city: "深圳",
    url: "https://www.huodongxing.com/events?city=%E6%B7%B1%E5%9C%B3",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["技术大会", "社科讲座", "亲子"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "meetup-shenzhen",
    name: "Meetup 深圳",
    type: "listing-platform",
    city: "深圳",
    url: "https://www.meetup.com/find/?location=cn--shenzhen&source=EVENTS",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "needs_review",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["技术大会", "Hackathon", "国际活动"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "nanshan-library-activities",
    name: "南山图书馆活动平台",
    type: "venue",
    city: "深圳",
    url: "https://activity.nslib.cn/",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["读书沙龙", "社科讲座", "亲子"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "luohu-library-events",
    name: "罗湖图书馆活动速递",
    type: "venue",
    city: "深圳",
    url: "https://www.szlhlib.org.cn/category/1021",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["读书沙龙", "社科讲座", "罗湖"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "szu-library-events",
    name: "深圳大学图书馆活动",
    type: "university",
    city: "深圳",
    url: "https://www.lib.szu.edu.cn/jsonapi/node/event?sort=-event_date.value",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "json_api",
    coverageTags: ["高校讲座", "技术大会", "读书沙龙"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "ites-meetings",
    name: "ITES 深圳工业展会议活动",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.iteschina.com/zh-cn/meeting",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "needs_review",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["电子展会", "技术大会", "工业"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "szwen-cultural-events",
    name: "深圳文体通活动",
    type: "listing-platform",
    city: "深圳",
    url: "https://www.szwen.cn/",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["社科讲座", "亲子", "展览"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "shenzhen-childrens-palace",
    name: "深圳市少年宫主题活动",
    type: "venue",
    city: "深圳",
    url: "https://www.szcp.com/Activity/",
    trustLevel: "high",
    signalWeight: 1.2,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["亲子科技", "青少年", "科普"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-science-museum",
    name: "深圳科学馆",
    type: "venue",
    city: "深圳",
    url: "https://www.szstm.com/",
    trustLevel: "medium",
    signalWeight: 0.95,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["亲子科技", "科普"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-museum-events",
    name: "深圳博物馆活动讲座",
    type: "venue",
    city: "深圳",
    url: "https://www.shenzhenmuseum.com/webCollection",
    trustLevel: "high",
    signalWeight: 1.18,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["社科讲座", "展览", "亲子"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "university-town-library",
    name: "深圳大学城图书馆",
    type: "university",
    city: "深圳",
    url: "https://www.utszlib.edu.cn/",
    trustLevel: "high",
    signalWeight: 1.18,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["高校讲座", "技术大会", "读书沙龙"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-redcube-events",
    name: "深圳红立方文化活动",
    type: "venue",
    city: "深圳",
    url: "https://www.sz-redcube.com/",
    trustLevel: "medium",
    signalWeight: 0.92,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["亲子科技", "展览", "龙岗"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-youth-activity-center",
    name: "深圳市青少年活动中心",
    type: "venue",
    city: "深圳",
    url: "https://www.szaac.com/",
    trustLevel: "high",
    signalWeight: 1.18,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["亲子科技", "青少年", "公益课"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "shenzhen-world-schedule",
    name: "深圳国际会展中心排期",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.shenzhen-world.com/scheduling/index.html",
    trustLevel: "high",
    signalWeight: 1.16,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["电子展会", "科技展会", "宝安"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "szcec-futian-schedule",
    name: "深圳会展中心近期展会",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.szcec.com/szcec/cn-schedule/current/index.html",
    trustLevel: "high",
    signalWeight: 1.16,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["电子展会", "科技展会", "福田"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "cite-expo",
    name: "CITE 中国电子信息博览会",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.citexpo.org/about/introduction.html",
    trustLevel: "high",
    signalWeight: 1.18,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["电子展会", "技术大会", "产业"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "elexcon-shenzhen",
    name: "ELEXCON 深圳国际电子展",
    type: "conference-platform",
    city: "深圳",
    url: "https://elexcon.com/en",
    trustLevel: "high",
    signalWeight: 1.16,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["电子展会", "嵌入式", "硬件"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "eiotexpo-shenzhen",
    name: "E-IOT 嵌入式与物联网展",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.eiotexpo.com/",
    trustLevel: "high",
    signalWeight: 1.15,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["电子展会", "物联网", "AIoT"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "luma-shenzhen",
    name: "Luma 深圳活动",
    type: "listing-platform",
    city: "深圳",
    url: "https://lu.ma/discover?location=Shenzhen",
    trustLevel: "medium",
    signalWeight: 1,
    lastChecked: "2026-05-12",
    cadence: "daily",
    baseHealth: "healthy",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["Hackathon", "技术大会", "AI"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "hackquest-shenzhen-hackathons",
    name: "HackQuest 深圳 Hackathon",
    type: "listing-platform",
    city: "深圳",
    url: "https://www.hackquest.io/en/hackathons/AI-%C3%97-Web3-%E9%BB%91%E5%AE%A2%E6%9D%BE%E6%B7%B1%E5%9C%B3%E7%AB%99",
    trustLevel: "medium",
    signalWeight: 0.95,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "healthy",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["Hackathon", "AI", "Web3"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "hackathonradar-shenzhen",
    name: "HackathonRadar 深圳线索",
    type: "listing-platform",
    city: "深圳",
    url: "https://www.hackathonradar.com/database/hackathon/9a9d9772-703e-4263-b163-c1f52cb784a8",
    trustLevel: "unverified",
    signalWeight: 0.8,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["Hackathon"],
    complianceLevel: "needs_review",
    confirmationPower: "supporting"
  },
  {
    id: "sdcon-tech-conference",
    name: "SDCon 技术大会",
    type: "conference-platform",
    city: "深圳",
    url: "https://sdcon.com.cn/",
    trustLevel: "medium",
    signalWeight: 0.98,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "healthy",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    accessMode: "public_web",
    coverageTags: ["技术大会", "软件研发"],
    complianceLevel: "auto_allowed",
    confirmationPower: "supporting"
  },
  {
    id: "iotexpo-shenzhen",
    name: "IOTE 深圳物联网展",
    type: "conference-platform",
    city: "深圳",
    url: "https://www.iotexpo.com.cn/sz/",
    trustLevel: "high",
    signalWeight: 1.14,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "healthy",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    accessMode: "public_web",
    coverageTags: ["电子展会", "物联网", "AIoT"],
    complianceLevel: "auto_allowed",
    confirmationPower: "strong"
  },
  {
    id: "wechat-public-accounts",
    name: "公众号公开活动线索",
    type: "community",
    city: "深圳",
    url: "https://mp.weixin.qq.com/",
    trustLevel: "unverified",
    signalWeight: 0.65,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "reputation",
    collectionMode: "reputation",
    accessMode: "manual_link",
    coverageTags: ["口碑", "线索", "主办方动态"],
    complianceLevel: "manual_only",
    confirmationPower: "none"
  },
  {
    id: "xiaohongshu-shenzhen-events",
    name: "小红书深圳活动反馈",
    type: "community",
    city: "深圳",
    url: "https://www.xiaohongshu.com/",
    trustLevel: "unverified",
    signalWeight: 0.6,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "reputation",
    collectionMode: "reputation",
    accessMode: "manual_link",
    coverageTags: ["口碑", "亲子反馈", "避坑"],
    complianceLevel: "manual_only",
    confirmationPower: "none"
  },
  {
    id: "bilibili-shenzhen-learning",
    name: "B 站深圳学习活动反馈",
    type: "community",
    city: "深圳",
    url: "https://www.bilibili.com/",
    trustLevel: "unverified",
    signalWeight: 0.6,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "reputation",
    collectionMode: "reputation",
    accessMode: "manual_link",
    coverageTags: ["口碑", "现场回放", "讲座反馈"],
    complianceLevel: "manual_only",
    confirmationPower: "none"
  },
  {
    id: "weibo-shenzhen-events",
    name: "微博深圳活动反馈",
    type: "community",
    city: "深圳",
    url: "https://weibo.com/",
    trustLevel: "unverified",
    signalWeight: 0.6,
    lastChecked: "2026-05-12",
    cadence: "weekly",
    baseHealth: "needs_review",
    sourceFamily: "reputation",
    collectionMode: "reputation",
    accessMode: "manual_link",
    coverageTags: ["口碑", "变更", "现场反馈"],
    complianceLevel: "manual_only",
    confirmationPower: "none"
  }
];

function defaultRuntimeMetrics(source: BaseSourcePoolItem): SourceRuntimeMetrics {
  return {
    sourceId: source.id,
    consecutiveFailures: 0,
    lastSuccessAt: `${source.lastChecked}T00:00:00.000Z`
  };
}

function healthRank(health: SourceHealth) {
  if (health === "healthy") {
    return 0;
  }

  if (health === "needs_review") {
    return 1;
  }

  return 2;
}

function maxHealth(left: SourceHealth, right: SourceHealth): SourceHealth {
  return healthRank(left) >= healthRank(right) ? left : right;
}

function daysBetween(olderIso: string, now: Date) {
  const older = new Date(olderIso);

  if (Number.isNaN(older.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const diffMs = now.getTime() - older.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function deriveHealth(baseHealth: SourceHealth, runtime: SourceRuntimeMetrics, now: Date): SourceHealth {
  let health = baseHealth;
  const daysSinceSuccess = runtime.lastSuccessAt ? daysBetween(runtime.lastSuccessAt, now) : Number.POSITIVE_INFINITY;

  if (runtime.consecutiveFailures >= SOURCE_HEALTH_THRESHOLDS.failuresToFailing || daysSinceSuccess >= SOURCE_HEALTH_THRESHOLDS.staleToFailingDays) {
    health = maxHealth(health, "failing");
  } else if (
    runtime.consecutiveFailures >= SOURCE_HEALTH_THRESHOLDS.failuresToNeedsReview ||
    daysSinceSuccess >= SOURCE_HEALTH_THRESHOLDS.staleToNeedsReviewDays
  ) {
    health = maxHealth(health, "needs_review");
  }

  return health;
}

function runtimeMetricsMap() {
  return new Map(getSourceRuntimeMetrics().map((metrics) => [metrics.sourceId, metrics]));
}

function writeRuntimeMetrics(metrics: SourceRuntimeMetrics[]) {
  writeList(sourceRuntimeMetricsKey, metrics);
}

function upsertRuntimeMetrics(sourceId: string, updater: (current: SourceRuntimeMetrics) => SourceRuntimeMetrics) {
  const all = getSourceRuntimeMetrics();
  const source = sourcePool.find((item) => item.id === sourceId);
  const fallback = source ? defaultRuntimeMetrics(source) : { sourceId, consecutiveFailures: 0 };
  const existing = all.find((entry) => entry.sourceId === sourceId);
  const next = updater(existing ?? fallback);
  const filtered = all.filter((entry) => entry.sourceId !== sourceId);
  writeRuntimeMetrics([...filtered, next]);
  return next;
}

export function getSourcePool() {
  const now = new Date();
  const metrics = runtimeMetricsMap();

  return sourcePool.map((source) => {
    const runtime = metrics.get(source.id) ?? defaultRuntimeMetrics(source);
    const override = sourceCalibrationOverrides[source.id];

    return {
      ...source,
      trustLevel: override?.trustLevel ?? source.trustLevel,
      signalWeight: override?.signalWeight ?? source.signalWeight,
      runtime,
      health: deriveHealth(source.baseHealth, runtime, now)
    };
  });
}

export function getSourceHealth() {
  return getSourcePool().map((source) => ({
    sourceId: source.id,
    name: source.name,
    sourceFamily: source.sourceFamily,
    collectionMode: source.collectionMode,
    accessMode: source.accessMode,
    coverageTags: source.coverageTags,
    complianceLevel: source.complianceLevel,
    confirmationPower: source.confirmationPower,
    health: source.health,
    baseHealth: source.baseHealth,
    lastChecked: source.lastChecked,
    consecutiveFailures: source.runtime.consecutiveFailures,
    lastSuccessAt: source.runtime.lastSuccessAt,
    lastFailureAt: source.runtime.lastFailureAt,
    lastFailureReason: source.runtime.lastFailureReason
  }));
}

export function getSourceRuntimeMetrics() {
  return readList<SourceRuntimeMetrics>(sourceRuntimeMetricsKey);
}

export function replaceSourceRuntimeMetrics(metrics: SourceRuntimeMetrics[]) {
  writeRuntimeMetrics(metrics);
}

export function recordSourceSuccess(sourceId: string, timestamp = new Date().toISOString()) {
  return upsertRuntimeMetrics(sourceId, (current) => ({
    ...current,
    sourceId,
    consecutiveFailures: 0,
    lastSuccessAt: timestamp
  }));
}

export function recordSourceFailure(sourceId: string, reason: string, timestamp = new Date().toISOString()) {
  return upsertRuntimeMetrics(sourceId, (current) => ({
    ...current,
    sourceId,
    consecutiveFailures: Math.max(0, current.consecutiveFailures) + 1,
    lastFailureAt: timestamp,
    lastFailureReason: reason
  }));
}

export function resetSourceRuntimeMetrics() {
  window.localStorage.removeItem(sourceRuntimeMetricsKey);
}
