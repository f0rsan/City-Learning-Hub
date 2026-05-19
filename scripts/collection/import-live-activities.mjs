#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const shouldCollect = !process.argv.includes("--skip-collect");
const reportDate = new Date().toISOString().slice(0, 10);
const reportPath = join(process.cwd(), "docs", "superpowers", "reports", `live-source-calibration-${reportDate}.json`);
const outputPath = join(process.cwd(), "src", "domain", "liveActivities.generated.ts");
const maxItemsPerSource = 5;
const publicTrustLevels = new Set(["high"]);
const currentYear = new Date().getFullYear();

if (shouldCollect) {
  const result = spawnSync(process.execPath, ["scripts/collection/run-live-calibration.mjs", "1", "3"], {
    cwd: process.cwd(),
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(reportPath)) {
  throw new Error(`缺少采集报告：${reportPath}`);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));

function hash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(10, 0, 0, 0);
  return next;
}

function parseDateFromTitle(title) {
  const normalized = title.replace(/\s+/g, " ");
  const isoDateTime = normalized.match(/(20\d{2})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (isoDateTime) {
    return new Date(
      Number(isoDateTime[1]),
      Number(isoDateTime[2]) - 1,
      Number(isoDateTime[3]),
      Number(isoDateTime[4] ?? "10"),
      Number(isoDateTime[5] ?? "0")
    );
  }

  const chineseDate = normalized.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (chineseDate) {
    return new Date(currentYear, Number(chineseDate[1]) - 1, Number(chineseDate[2]), 10, 0, 0, 0);
  }

  const dotDate = normalized.match(/(?:^|[^\d])(\d{1,2})[./](\d{1,2})(?=深圳站|[^\d]|$)/);
  if (dotDate) {
    return new Date(currentYear, Number(dotDate[1]) - 1, Number(dotDate[2]), 10, 0, 0, 0);
  }

  return undefined;
}

function normalizeStartDate(item, index) {
  const explicit = item.startAt ? new Date(item.startAt) : parseDateFromTitle(item.title);
  if (explicit && !Number.isNaN(explicit.getTime())) {
    return {
      startAt: explicit,
      dateNote: undefined,
      dateIsExplicit: true
    };
  }

  return {
    startAt: addDays(new Date(report.generatedAt), (index % 12) + 1),
    dateNote: "时间见活动页",
    dateIsExplicit: false
  };
}

function cleanTitle(rawTitle) {
  return rawTitle
    .replace(/\s+地址：[\s\S]*$/g, "")
    .replace(/\s+开始时间：[\s\S]*$/g, "")
    .replace(/\s+时间：[\s\S]*$/g, "")
    .replace(/\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun),[\s\S]*$/i, "")
    .replace(/\s+Every\s+[\s\S]*$/i, "")
    .replace(/\s+by\s+[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 84);
}

function inferDistrict(text, sourceId) {
  const districtBySource = {
    "nanshan-library-activities": "南山",
    "luohu-library-events": "罗湖",
    "szu-library-events": "南山"
  };
  const explicit = ["南山", "福田", "宝安", "龙岗", "罗湖", "盐田", "光明"].find((district) => text.includes(district));
  return explicit ?? districtBySource[sourceId] ?? "福田";
}

function inferCategory(title) {
  if (/hackathon|黑客松/i.test(title)) {
    return "Hackathon";
  }
  if (hasTechSignal(title)) {
    return "技术大会";
  }
  if (/展|expo|fair/i.test(title)) {
    return "科技展会";
  }
  if (/读书|阅读|书|故事/i.test(title)) {
    return "读书沙龙";
  }
  if (/讲座|讲堂|论坛|分享/i.test(title)) {
    return "社科讲座";
  }
  return "社科讲座";
}

function hasTechSignal(title) {
  return /\bAI\b|人工智能|智能体|机器人|WordPress|Claude|Data|科技|技术|智算|服务器/i.test(title);
}

function hasLearningSignal(title) {
  return (
    hasTechSignal(title) ||
    /讲座|讲堂|论坛|峰会|大会|沙龙|读书|阅读|书|故事|展|国学|公益课|课程|工作坊|创客|智能|科学|产业|跨境|出海/i.test(title)
  );
}

function isEntertainmentOnly(title) {
  const purePerformance = /演唱会|音乐会|话剧|舞蹈|钢琴|相声|音乐/.test(title) && !/讲座|论坛|工作坊|公益课|课程|分享|展/.test(title);
  const pureVrExperience = /VR|体验|冒险旅程/.test(title) && !/AI|人工智能|科技|科学|科普|讲座|论坛|工作坊|公益课|课程|分享|展|创客|制作|启蒙|产业/i.test(title);

  return purePerformance || pureVrExperience;
}

function isCoreRelevant(title) {
  return hasLearningSignal(title) && !isEntertainmentOnly(title);
}

function isSourceOnlyFallback(item, title) {
  return (
    Boolean(item.isFallback) ||
    /线索$|线索页|入口页|活动入口|活动安排$|文化活动$|展会排期$|排期$|专题展览$|活动讲座预约$|展览速递$|数据库培训$|预约培训$|小讲解员$/.test(
      title
    )
  );
}

function inferAudience(title) {
  return /亲子|儿童|少儿|青少年|孩子|故事会|家庭/.test(title) ? ["family"] : ["adult"];
}

function hasChildSafetySignal(title, sourceName) {
  return /图书馆|故事|亲子|儿童|少儿|青少年|少年宫|活动中心|科学|科普/.test(`${title} ${sourceName}`);
}

function inferVenue(title, sourceName, sourceId) {
  const address = title.match(/地址：([^时发]{4,80})/)?.[1]?.trim();
  if (address) {
    return address.slice(0, 32);
  }
  if (sourceId === "szu-library-events") {
    return "深圳大学图书馆";
  }
  if (sourceId === "nanshan-library-activities") {
    return "南山图书馆";
  }
  if (sourceId === "luohu-library-events") {
    return "罗湖图书馆";
  }
  if (sourceId === "ites-meetings") {
    return "深圳国际会展中心";
  }
  return sourceName;
}

function recommendationFor(title, sourceName) {
  if (hasTechSignal(title)) {
    return "适合关注 AI、技术实践或产业变化的人。";
  }
  if (/读书|阅读|讲座|讲堂|故事/.test(title)) {
    return "适合想听讲座、读书或参加公共文化活动的人。";
  }
  return "适合先了解主题，再决定是否报名。";
}

function summaryFor(title) {
  if (hasTechSignal(title)) {
    return "技术与产业主题，适合关注趋势和实践机会。";
  }
  if (/读书|阅读|讲座|讲堂|故事/.test(title)) {
    return "讲座阅读类活动，适合安排轻量学习。";
  }
  if (/展|expo|fair|VR|体验/i.test(title)) {
    return "展会体验类活动，适合现场了解新内容。";
  }
  return "学习交流类活动，适合按主题和时间筛选。";
}

function bestForFor(audience) {
  return audience.includes("family") ? "适合亲子家庭，出发前请核对年龄和陪同要求。" : "适合成人学习、行业交流或城市文化探索。";
}

function tagsFor(title, sourceName) {
  const tags = ["真实采集", sourceName];
  if (/\bAI\b|人工智能|智能体/i.test(title)) {
    tags.push("AI");
  }
  if (/读书|阅读|讲座|讲堂/.test(title)) {
    tags.push("讲座阅读");
  }
  if (/展|expo|fair/i.test(title)) {
    tags.push("展会");
  }
  return [...new Set(tags)].slice(0, 4);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}

function titleValueScore(title) {
  let score = Math.min(18, Math.max(4, title.length / 3));

  if (hasTechSignal(title)) {
    score += 18;
  }
  if (/讲座|讲堂|论坛|峰会|大会|沙龙|读书|阅读|故事|工作坊|课程|公益课|展|体验|Hackathon|黑客松/i.test(title)) {
    score += 18;
  }
  if (/亲子|儿童|少儿|青少年|孩子|家庭|科普|科学/.test(title)) {
    score += 8;
  }
  if (isEntertainmentOnly(title)) {
    score -= 35;
  }
  if (/^(法律咨询|展览速递|数据库培训|预约培训|专题展览|小讲解员|活动讲座预约)$/.test(title)) {
    score -= 18;
  }

  return score;
}

function sourceValueScore(source) {
  const trustScore = source.recommendedTrustLevel === "high" ? 24 : source.recommendedTrustLevel === "medium" ? 12 : 0;
  const localScore = Math.round((source.localRelevanceRatio ?? 0) * 22);
  const modeScore = source.collectionMode === "auto" ? 10 : 4;
  const confirmationScore = source.confirmationPower === "strong" ? 8 : 3;

  return trustScore + localScore + modeScore + confirmationScore;
}

function itemPublicScore(source, item, index) {
  const title = cleanTitle(item.title);
  const parsedDate = item.startAt ? new Date(item.startAt) : parseDateFromTitle(title);
  const hasExplicitDate = parsedDate && !Number.isNaN(parsedDate.getTime());
  const learningScore = isCoreRelevant(title) ? 22 : -28;
  const dateScore = hasExplicitDate ? 12 : 2;
  const freshnessTieBreaker = Math.max(0, 5 - index * 0.1);

  return clampScore(sourceValueScore(source) + titleValueScore(title) + learningScore + dateScore + freshnessTieBreaker);
}

function pickBestItemsForSource(source) {
  return (Array.isArray(source.sampleItems) ? source.sampleItems : [])
    .map((item, index) => ({
      item,
      score: itemPublicScore(source, item, index),
      index
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxItemsPerSource)
    .map((entry) => entry.item);
}

function toActivity(source, item, globalIndex) {
  const title = cleanTitle(item.title);
  const audience = inferAudience(title);
  const { startAt, dateNote, dateIsExplicit } = normalizeStartDate(item, globalIndex);
  const startOfToday = new Date(report.generatedAt);
  startOfToday.setHours(0, 0, 0, 0);
  const isTrusted = publicTrustLevels.has(source.recommendedTrustLevel) && source.localRelevanceRatio >= 0.5;
  const isDirectAuto = (source.collectionMode ?? "auto") === "auto";
  const relevant = isCoreRelevant(title);
  const sourceOnlyFallback = isSourceOnlyFallback(item, title);
  const expired = dateIsExplicit && startAt < startOfToday;
  const publicScore = itemPublicScore(source, item, globalIndex);
  const publicListingTier =
    !expired && isTrusted && relevant && !sourceOnlyFallback ? (isDirectAuto ? "featured" : "reference") : undefined;
  const status = expired ? "expired" : publicListingTier === "featured" ? "published" : "uncertain";
  const sourceName = source.sourceName;
  const district = inferDistrict(`${title} ${item.url}`, source.sourceId);
  const venue = inferVenue(item.title, sourceName, source.sourceId);
  const id = `live-${source.sourceId}-${hash(item.url)}`;

  return {
    id,
    slug: slugify(`${title}-${hash(item.url)}`),
    title,
    summary: summaryFor(title),
    category: inferCategory(title),
    audience,
    tags: tagsFor(title, sourceName),
    district,
    venue,
    address: venue,
    startAt: startAt.toISOString(),
    endAt: addHours(startAt, 2).toISOString(),
    ...(dateNote ? { dateNote } : {}),
    priceType: /免费|公益/.test(title) ? "免费" : "公益",
    priceNote: /免费|公益/.test(title) ? "免费或公益" : "见活动页",
    reservationRequired: true,
    ...(audience.includes("family") ? { ageBand: "见活动页" } : {}),
    difficulty: /进阶|专业|峰会|大会|产业|供应链/.test(title) ? "进阶" : "入门",
    recommendation: recommendationFor(title, sourceName),
    bestFor: bestForFor(audience),
    cautions: [
      dateNote ? "时间待核对" : "出发前再看时间",
      "名额和变更看活动页",
      !relevant ? "学习相关性待复核" : "",
      source.recommendedTrustLevel === "medium" ? "来源建议再复核" : ""
    ].filter(Boolean),
    officialUrl: item.url,
    sourceId: source.sourceId,
    lastConfirmedAt: report.generatedAt.slice(0, 10),
    status,
    weeklyFeatured: publicListingTier === "featured",
    ...(publicListingTier ? { publicListingTier, publicScore } : {}),
    childSafetyComplete: !audience.includes("family") || hasChildSafetySignal(title, sourceName)
  };
}

const activities = [];
let globalIndex = 0;

for (const source of report.sources ?? []) {
  if (source.collectionMode === "reputation") {
    continue;
  }
  const items = pickBestItemsForSource(source);
  for (const item of items) {
    activities.push(toActivity(source, item, globalIndex));
    globalIndex += 1;
  }
}

const output = `import type { Activity } from "./types";

// Generated by scripts/collection/import-live-activities.mjs at ${new Date().toISOString()}.
// Source report: ${reportPath}
export const liveCollectedActivities = ${JSON.stringify(activities, null, 2)} satisfies Activity[];
`;

writeFileSync(outputPath, output, "utf8");

const published = activities.filter((activity) => activity.status === "published").length;
const uncertain = activities.filter((activity) => activity.status === "uncertain").length;
const expired = activities.filter((activity) => activity.status === "expired").length;

console.log(
  JSON.stringify(
    {
      outputPath,
      importedActivities: activities.length,
      published,
      uncertain,
      expired
    },
    null,
    2
  )
);
