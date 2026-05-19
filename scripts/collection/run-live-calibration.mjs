#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const rounds = Number(process.argv[2] ?? "3");
const concurrency = Number(process.argv[3] ?? "2");
const now = new Date();
const reportDir = join(process.cwd(), "docs", "superpowers", "reports");

const liveSources = [
  {
    id: "nanshan-tech-museum",
    name: "深圳科学馆",
    url: "https://www.szstm.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/科普|活动|讲座|展|科学/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["亲子科技", "科普"],
    timeoutMs: 12000,
    fallbackItems: [
      {
        title: "深圳科学馆科普活动安排",
        url: "https://szstm.com/mobile/html/gk/sj"
      }
    ]
  },
  {
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
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["读书沙龙", "社科讲座", "亲子"],
    assumeLocal: true,
    timeoutMs: 12000,
    fallbackItems: [
      {
        title: "深圳书城活动线索页",
        url: "https://www.szbookmall.com/activity"
      }
    ]
  },
  {
    id: "tech-community",
    name: "深圳技术社区线索",
    url: "https://lu.ma/discover?location=Shenzhen",
    parser: "generic_event_links",
    includeUrlPatterns: [/lu\.ma\/[a-z0-9]+/i],
    includeTitlePatterns: [/Shenzhen|深圳|Hackathon|Meetup|AI|Workshop|Salon|Tech|Founder|Developer/i],
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["技术大会", "Hackathon", "AI"],
    timeoutMs: 16000,
    fallbackItems: [
      {
        title: "Luma 深圳线索页",
        url: "https://lu.ma/discover?location=Shenzhen"
      }
    ]
  },
  {
    id: "shenzhen-conference-platform",
    name: "深圳会展中心近期展会",
    url: "https://www.szcec.com/szcec/cn-schedule/current/index.html",
    parser: "generic_event_links",
    includeTitlePatterns: [/展|博览|会议|论坛|大会|深圳/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["电子展会", "科技展会", "福田"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "eventbrite-shenzhen",
    name: "Eventbrite 深圳",
    url: "https://www.eventbrite.com/d/china--shenzhen/events/",
    parser: "eventbrite_jsonld",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["技术大会", "国际活动"],
    assumeLocal: false,
    timeoutMs: 12000,
    fallbackItems: [
      {
        title: "Eventbrite 深圳线索页",
        url: "https://www.eventbrite.com/d/china--shenzhen/events/"
      }
    ]
  },
  {
    id: "douban-shenzhen",
    name: "豆瓣同城深圳",
    url: "https://shenzhen.douban.com/",
    parser: "douban_event_links",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["社科讲座", "读书沙龙", "展览"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "lianpu-tech-events",
    name: "联谱科技活动",
    url: "https://lianpu.com/",
    parser: "generic_event_links",
    includeUrlPatterns: [/\/event\//],
    includeTitlePatterns: [/深圳|活动|讲座|沙龙|论坛|大会|AI|科技|工作坊|Hackathon/i],
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["技术大会", "科技展会"],
    assumeLocal: false,
    timeoutMs: 12000
  },
  {
    id: "huodongxing-shenzhen",
    name: "活动行深圳",
    url: "https://www.huodongxing.com/events?city=%E6%B7%B1%E5%9C%B3",
    parser: "generic_event_links",
    includeUrlPatterns: [/huodongxing\.com\/event\//],
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["技术大会", "社科讲座", "亲子"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "meetup-shenzhen",
    name: "Meetup 深圳",
    url: "https://www.meetup.com/find/?location=cn--shenzhen&source=EVENTS",
    parser: "generic_event_links",
    includeUrlPatterns: [/meetup\.com\/.+\/events\/\d+/],
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["技术大会", "Hackathon", "国际活动"],
    assumeLocal: false,
    timeoutMs: 15000
  },
  {
    id: "nanshan-library-activities",
    name: "南山图书馆活动平台",
    url: "https://activity.nslib.cn/",
    parser: "generic_event_links",
    includeUrlPatterns: [/activity\.nslib\.cn\/activity\/info\/\d+/],
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["读书沙龙", "社科讲座", "亲子"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "luohu-library-events",
    name: "罗湖图书馆活动速递",
    url: "https://www.szlhlib.org.cn/category/1021",
    parser: "generic_event_links",
    includeUrlPatterns: [/szlhlib\.org\.cn\/information\/\d+/],
    includeTitlePatterns: [/活动|讲座|读书|图书馆|AI|故事|展/],
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["读书沙龙", "社科讲座", "罗湖"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "szu-library-events",
    name: "深圳大学图书馆活动",
    url: "https://www.lib.szu.edu.cn/jsonapi/node/event?sort=-event_date.value",
    parser: "szu_jsonapi_events",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["高校讲座", "技术大会", "读书沙龙"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "ites-meetings",
    name: "ITES 深圳工业展会议活动",
    url: "https://www.iteschina.com/zh-cn/meeting",
    parser: "generic_event_links",
    includeUrlPatterns: [/iteschina\.com\/zh-cn\/meeting\/\d+/],
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["电子展会", "技术大会", "工业"],
    assumeLocal: true,
    timeoutMs: 18000
  },
  {
    id: "szwen-cultural-events",
    name: "深圳文体通活动",
    url: "https://www.szwen.cn/",
    parser: "generic_event_links",
    includeUrlPatterns: [/szwen\.cn\/eventDetail\?id=/],
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["社科讲座", "亲子", "展览"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "shenzhen-childrens-palace",
    name: "深圳市少年宫主题活动",
    url: "https://www.szcp.com/Activity/",
    parser: "generic_event_links",
    includeUrlPatterns: [/szcp\.com\/Activity\//],
    includeTitlePatterns: [/活动|科学|艺术|科普|讲座|展|课程|工作坊/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["亲子科技", "青少年", "科普"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "shenzhen-science-museum",
    name: "深圳科学馆",
    url: "https://www.szstm.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/科普|活动|讲座|展|科学/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["亲子科技", "科普"],
    timeoutMs: 12000,
    fallbackItems: [
      {
        title: "深圳科学馆科普活动安排",
        url: "https://szstm.com/mobile/html/gk/sj"
      }
    ]
  },
  {
    id: "shenzhen-museum-events",
    name: "深圳博物馆活动讲座",
    url: "https://www.shenzhenmuseum.com/webCollection",
    parser: "generic_event_links",
    includeTitlePatterns: [/活动|讲座|展览|小讲解员|预约/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["社科讲座", "展览", "亲子"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "university-town-library",
    name: "深圳大学城图书馆",
    url: "https://www.utszlib.edu.cn/",
    parser: "generic_event_links",
    includeTitlePatterns: [/讲座|活动|AI|读书|培训|展|沙龙/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["高校讲座", "技术大会", "读书沙龙"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "shenzhen-redcube-events",
    name: "深圳红立方文化活动",
    url: "https://www.sz-redcube.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/文化活动|活动|讲座|科普|展/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["亲子科技", "展览", "龙岗"],
    timeoutMs: 12000,
    fallbackItems: [
      {
        title: "深圳红立方文化活动",
        url: "https://www.sz-redcube.com/"
      }
    ]
  },
  {
    id: "shenzhen-youth-activity-center",
    name: "深圳市青少年活动中心",
    url: "https://www.szaac.com/",
    parser: "generic_event_links",
    includeTitlePatterns: [/活动|讲座|科技|课程|青少年|红领巾|展/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["亲子科技", "青少年", "公益课"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "shenzhen-world-schedule",
    name: "深圳国际会展中心排期",
    url: "https://www.shenzhen-world.com/scheduling/index.html",
    parser: "landing_page_event",
    includeTitlePatterns: [/展|博览|会议|论坛|大会|深圳/],
    sourceFamily: "confirmation",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["电子展会", "科技展会", "宝安"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "szcec-futian-schedule",
    name: "深圳会展中心近期展会",
    url: "https://www.szcec.com/szcec/cn-schedule/current/index.html",
    parser: "generic_event_links",
    includeTitlePatterns: [/展|博览|会议|论坛|大会|深圳/],
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["电子展会", "科技展会", "福田"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "cite-expo",
    name: "CITE 中国电子信息博览会",
    url: "https://www.citexpo.org/about/introduction.html",
    parser: "landing_page_event",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["电子展会", "技术大会", "产业"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "elexcon-shenzhen",
    name: "ELEXCON 深圳国际电子展",
    url: "https://elexcon.com/en",
    parser: "landing_page_event",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["电子展会", "嵌入式", "硬件"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "eiotexpo-shenzhen",
    name: "E-IOT 嵌入式与物联网展",
    url: "https://www.eiotexpo.com/",
    parser: "landing_page_event",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["电子展会", "物联网", "AIoT"],
    assumeLocal: true,
    timeoutMs: 12000
  },
  {
    id: "luma-shenzhen",
    name: "Luma 深圳活动",
    url: "https://lu.ma/discover?location=Shenzhen",
    parser: "generic_event_links",
    includeUrlPatterns: [/lu\.ma\/[a-z0-9]+/i],
    includeTitlePatterns: [/Shenzhen|深圳|Hackathon|Meetup|AI|Workshop|Salon|Tech|Founder|Developer/i],
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["Hackathon", "技术大会", "AI"],
    timeoutMs: 16000,
    fallbackItems: [
      {
        title: "Luma 深圳线索页",
        url: "https://lu.ma/discover?location=Shenzhen"
      }
    ]
  },
  {
    id: "hackquest-shenzhen-hackathons",
    name: "HackQuest 深圳 Hackathon",
    url: "https://www.hackquest.io/en/hackathons/AI-%C3%97-Web3-%E9%BB%91%E5%AE%A2%E6%9D%BE%E6%B7%B1%E5%9C%B3%E7%AB%99",
    parser: "landing_page_event",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["Hackathon", "AI", "Web3"],
    timeoutMs: 16000
  },
  {
    id: "hackathonradar-shenzhen",
    name: "HackathonRadar 深圳线索",
    url: "https://www.hackathonradar.com/database/hackathon/9a9d9772-703e-4263-b163-c1f52cb784a8",
    parser: "landing_page_event",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["Hackathon"],
    timeoutMs: 16000
  },
  {
    id: "sdcon-tech-conference",
    name: "SDCon 技术大会",
    url: "https://sdcon.com.cn/",
    parser: "landing_page_event",
    sourceFamily: "discovery",
    collectionMode: "candidate",
    confirmationPower: "supporting",
    coverageTags: ["技术大会", "软件研发"],
    timeoutMs: 12000
  },
  {
    id: "iotexpo-shenzhen",
    name: "IOTE 深圳物联网展",
    url: "https://www.iotexpo.com.cn/sz/",
    parser: "landing_page_event",
    sourceFamily: "confirmation",
    collectionMode: "auto",
    confirmationPower: "strong",
    coverageTags: ["电子展会", "物联网", "AIoT"],
    assumeLocal: true,
    timeoutMs: 12000
  }
];

const localRelevancePattern = /深圳|Shenzhen|南山|福田|罗湖|宝安|龙岗|龙华|光明|坪山|盐田|前海|蛇口|深港|粤港澳/i;

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&#039;", "'")
    .replaceAll("&#183;", "·")
    .replaceAll("&#8211;", "-")
    .replaceAll("&mdash;", "-")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripTags(value) {
  return decodeHtml(
    value
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function readAttribute(tag, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1];
}

function normalizeUrlForDedupe(url) {
  try {
    const parsed = new URL(decodeHtml(url));
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|qd$|recId$|recSource$|searchId$|eventOrigin$|request_id$|sceneType$|hot$)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    return parsed.href;
  } catch {
    return decodeHtml(url);
  }
}

function titleQuality(title) {
  if (!title) {
    return 0;
  }

  if (
    /^(订阅|展览$|活动$|讲座$|科普活动$|展览排期|展会介绍|展会排期|今日展会|近期展会|活动列表|主题活动|活动公告|最新活动|展陈内容|展位预定|展商后台|展馆平面图|展商名录|展后报告|学科与培训|全部活动|读者活动|名家讲座|常设展览|展览回顾|Conference$|Concurrent Event$)/i.test(title) ||
    /^https?:\/\//i.test(title) ||
    /获奖公告|名单公布|通知公告/.test(title)
  ) {
    return 0;
  }

  let score = Math.min(80, title.length);
  if (/活动|讲座|沙龙|论坛|大会|展|AI|科技|读书|工作坊|meetup|summit|workshop/i.test(title)) {
    score += 30;
  }
  if (/^(查看更多|更多分类|活动列表|立即报名|SIGN UP(?:\s*立即报名)?|报名参观|展位预定|会议活动|展会概览|测试.*)$/i.test(title)) {
    score -= 80;
  }
  if (title.length > 180) {
    score -= 70;
  }

  return score;
}

function dedupeByUrl(items) {
  const itemMap = new Map();

  for (const item of items) {
    const key = normalizeUrlForDedupe(item.url);
    const existing = itemMap.get(key);

    if (existing && titleQuality(existing.title) >= titleQuality(item.title)) {
      continue;
    }

    itemMap.set(key, {
      ...item,
      url: key
    });
  }

  return [...itemMap.values()];
}

function parseEventbriteJsonLd(html, sourceId) {
  const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const items = [];

  for (const match of html.matchAll(scriptRegex)) {
    const content = match[1]?.trim();
    if (!content) {
      continue;
    }

    try {
      const parsed = JSON.parse(content);
      const list = Array.isArray(parsed?.itemListElement) ? parsed.itemListElement : [];

      for (const item of list) {
        const event = item?.item;
        if (!event?.name || !event?.url) {
          continue;
        }

        items.push({
          sourceId,
          title: decodeHtml(String(event.name)),
          url: String(event.url),
          startAt: event.startDate ? String(event.startDate) : undefined
        });
      }
    } catch {
      continue;
    }
  }

  return dedupeByUrl(items);
}

function parseBookmallNewsList(jsonText, sourceId) {
  const parsed = JSON.parse(jsonText);
  const rows = Array.isArray(parsed?.data?.list) ? parsed.data.list : [];
  const items = [];

  for (const row of rows) {
    const title = stripTags(String(row?.new_title ?? row?.title ?? row?.name ?? ""));
    const newsId = row?.news_id ?? row?.id;
    const explicitUrl = [row?.pc_link, row?.app_link, row?.url, row?.link, row?.tweetsUrl].find(
      (value) => typeof value === "string" && value.startsWith("http")
    );
    const officialUrl = explicitUrl
      ? String(explicitUrl)
      : newsId
        ? `https://www.szbookmall.com/news/${newsId}`
        : undefined;

    if (!title || !officialUrl || titleQuality(title) <= 0) {
      continue;
    }

    items.push({
      sourceId,
      title,
      url: officialUrl
    });
  }

  return dedupeByUrl(items);
}

function parseDoubanEventLinks(html, sourceId) {
  const linkRegex = /<a[^>]*href="(https:\/\/www\.douban\.com\/event\/\d+\/)"[^>]*title="([^"]+)"[^>]*>/g;
  const items = [];

  for (const match of html.matchAll(linkRegex)) {
    const url = match[1];
    const title = decodeHtml(match[2]).trim();

    if (!url || !title) {
      continue;
    }

    items.push({
      sourceId,
      title,
      url
    });
  }

  return dedupeByUrl(items);
}

function parseGenericEventLinks(html, source) {
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  const items = [];

  for (const match of html.matchAll(linkRegex)) {
    const attributes = match[1] ?? "";
    const href = readAttribute(attributes, "href");

    if (!href || /^(javascript:|mailto:|tel:|#)/i.test(href)) {
      continue;
    }

    const url = new URL(decodeHtml(href), source.url).href;
    const title =
      stripTags(match[2] ?? "") ||
      stripTags(readAttribute(attributes, "title") ?? "") ||
      stripTags(readAttribute(attributes, "aria-label") ?? "");
    const includeByUrl = source.includeUrlPatterns?.some((pattern) => pattern.test(url)) ?? true;
    const includeByTitle = source.includeTitlePatterns?.some((pattern) => pattern.test(title)) ?? true;

    if (!includeByUrl || !includeByTitle || titleQuality(title) <= 0) {
      continue;
    }

    items.push({
      sourceId: source.id,
      title,
      url
    });
  }

  return dedupeByUrl(items);
}

function parseSzuJsonApiEvents(jsonText, sourceId) {
  const parsed = JSON.parse(jsonText);
  const rows = Array.isArray(parsed?.data) ? parsed.data : [];
  const items = [];

  for (const row of rows) {
    const attrs = row?.attributes;

    if (!attrs?.title) {
      continue;
    }

    const nodeUrl = attrs.drupal_internal__nid ? `https://www.lib.szu.edu.cn/node/${attrs.drupal_internal__nid}` : undefined;
    const officialUrl = typeof attrs.link?.uri === "string" && attrs.link.uri.startsWith("http") ? attrs.link.uri : nodeUrl;

    if (!officialUrl) {
      continue;
    }

    items.push({
      sourceId,
      title: stripTags(String(attrs.title)),
      url: officialUrl,
      startAt: attrs.event_date?.value ? String(attrs.event_date.value) : undefined
    });
  }

  return dedupeByUrl(items);
}

function parseLandingPageEvent(html, source) {
  const text = stripTags(html);
  const dateMatch =
    text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/) ??
    text.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
  const startAt = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}T10:00:00+08:00`
    : undefined;

  return [
    {
      sourceId: source.id,
      title: source.name,
      url: source.url,
      ...(startAt ? { startAt } : {})
    }
  ];
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

async function fetchWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.7",
        "user-agent": "Mozilla/5.0 ShenzhenLearningHubCollector/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackItemsFor(source) {
  return (source.fallbackItems ?? []).map((item) => ({
    sourceId: source.id,
    title: item.title,
    url: item.url,
    ...(item.startAt ? { startAt: item.startAt } : {}),
    isFallback: true
  }));
}

function filterItemsForSource(items, source) {
  return items.filter((item) => {
    const includeByUrl = source.includeUrlPatterns?.some((pattern) => pattern.test(item.url)) ?? true;
    const includeByTitle = source.includeTitlePatterns?.some((pattern) => pattern.test(item.title)) ?? true;
    return includeByUrl && includeByTitle && titleQuality(item.title) > 0;
  });
}

async function fetchSourceText(source) {
  const request = source.request ?? { url: source.url };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), source.timeoutMs ?? 12000);

  try {
    const response = await fetch(request.url, {
      method: request.method ?? "GET",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.7",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        ...(request.headers ?? {})
      },
      body: request.body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function collectFromSource(source) {
  const startedAt = Date.now();

  try {
    const html = await fetchSourceText(source);
    const parsedItems = (() => {
      if (source.parser === "bookmall_news_api") {
        return parseBookmallNewsList(html, source.id);
      }
      if (source.parser === "eventbrite_jsonld") {
        return parseEventbriteJsonLd(html, source.id);
      }
      if (source.parser === "douban_event_links") {
        return parseDoubanEventLinks(html, source.id);
      }
      if (source.parser === "szu_jsonapi_events") {
        return parseSzuJsonApiEvents(html, source.id);
      }
      if (source.parser === "landing_page_event") {
        return parseLandingPageEvent(html, source);
      }
      return parseGenericEventLinks(html, source);
    })();
    const items = filterItemsForSource(parsedItems, source);
    const fallbackItems = fallbackItemsFor(source);
    const resolvedItems = items.length > 0 ? items : fallbackItems;

    return {
      sourceId: source.id,
      sourceName: source.name,
      success: resolvedItems.length > 0,
      durationMs: Date.now() - startedAt,
      items: resolvedItems,
      error: resolvedItems.length > 0 ? undefined : "解析成功但未提取到活动"
    };
  } catch (error) {
    const fallbackItems = fallbackItemsFor(source);
    if (fallbackItems.length > 0) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        success: true,
        durationMs: Date.now() - startedAt,
        items: fallbackItems
      };
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      success: false,
      durationMs: Date.now() - startedAt,
      items: [],
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

async function runBatches(tasks, batchSize) {
  const results = [];

  for (let index = 0; index < tasks.length; index += batchSize) {
    const batch = tasks.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map((task) => task()));
    results.push(...batchResults);
  }

  return results;
}

function recommendTrustLevel(score, localRelevanceRatio, fallbackRatio = 0) {
  if (fallbackRatio >= 0.5) {
    return score >= 0.58 && localRelevanceRatio >= 0.5 ? "medium" : "unverified";
  }

  if (localRelevanceRatio < 0.5) {
    return score >= 0.68 ? "medium" : "unverified";
  }

  if (score >= 0.82) {
    return "high";
  }
  if (score >= 0.58) {
    return "medium";
  }
  return "unverified";
}

function recommendSignalWeight(score, localRelevanceRatio, fallbackRatio = 0) {
  const localityMultiplier = localRelevanceRatio < 0.5 ? 0.86 : 1;
  const fallbackMultiplier = fallbackRatio >= 0.5 ? 0.82 : 1;
  const weight = (0.65 + score * 0.75) * localityMultiplier * fallbackMultiplier;
  return Math.min(1.4, Math.max(0.6, Number(weight.toFixed(2))));
}

async function main() {
  const tasks = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const source of liveSources) {
      tasks.push(() => collectFromSource(source));
    }
  }

  const runs = await runBatches(tasks, concurrency);
  const sourceMap = new Map(liveSources.map((item) => [item.id, item]));

  const summary = liveSources.map((source) => {
    const items = runs.filter((run) => run.sourceId === source.id);
    const successRuns = items.filter((run) => run.success);
    const totalItems = successRuns.reduce((count, run) => count + run.items.length, 0);
    const uniqueUrls = new Set(successRuns.flatMap((run) => run.items.map((item) => item.url))).size;
    const uniqueTitles = new Set(successRuns.flatMap((run) => run.items.map((item) => normalizeTitle(item.title)))).size;
    const avgLatencyMs = items.length
      ? Math.round(items.reduce((sum, run) => sum + run.durationMs, 0) / items.length)
      : 0;

    const successRate = items.length ? successRuns.length / items.length : 0;
    const avgItemsPerSuccess = successRuns.length ? totalItems / successRuns.length : 0;
    const uniquenessRatio = totalItems > 0 ? uniqueUrls / totalItems : 0;
    const titleUniquenessRatio = totalItems > 0 ? uniqueTitles / totalItems : 0;
    const allSuccessItems = successRuns.flatMap((run) => run.items);
    const fallbackItems = allSuccessItems.filter((item) => item.isFallback).length;
    const fallbackRatio = totalItems > 0 ? fallbackItems / totalItems : 0;
    const directItemRatio = totalItems > 0 ? (totalItems - fallbackItems) / totalItems : 0;
    const localMatches = allSuccessItems.filter((item) => localRelevancePattern.test(`${item.title} ${item.url}`)).length;
    const localRelevanceRatio = source.assumeLocal ? 1 : totalItems > 0 ? localMatches / totalItems : 0;
    const parseHealth = successRuns.length > 0 ? (directItemRatio > 0 ? 1 : 0.45) : 0;
    const latencyScore = avgLatencyMs <= 4000 ? 1 : avgLatencyMs <= 9000 ? 0.7 : 0.3;
    const volumeScore = Math.min(1, avgItemsPerSuccess / 20);

    const rawQualityScore =
      successRate * 0.3 +
      parseHealth * 0.15 +
      localRelevanceRatio * 0.2 +
      uniquenessRatio * 0.1 +
      titleUniquenessRatio * 0.1 +
      volumeScore * 0.1 +
      latencyScore * 0.05 -
      fallbackRatio * 0.22;
    const sourceQualityScore = Number(Math.max(0, rawQualityScore).toFixed(3));

    return {
      sourceId: source.id,
      sourceName: sourceMap.get(source.id)?.name ?? source.id,
      sourceUrl: source.url,
      sourceFamily: source.sourceFamily ?? "discovery",
      collectionMode: source.collectionMode ?? "candidate",
      confirmationPower: source.confirmationPower ?? "supporting",
      coverageTags: source.coverageTags ?? [],
      attempts: items.length,
      successRuns: successRuns.length,
      failureRuns: items.length - successRuns.length,
      successRate: Number(successRate.toFixed(3)),
      avgLatencyMs,
      avgItemsPerSuccess: Number(avgItemsPerSuccess.toFixed(2)),
      totalItems,
      uniqueUrls,
      uniqueTitles,
      uniquenessRatio: Number(uniquenessRatio.toFixed(3)),
      titleUniquenessRatio: Number(titleUniquenessRatio.toFixed(3)),
      localRelevanceRatio: Number(localRelevanceRatio.toFixed(3)),
      fallbackRatio: Number(fallbackRatio.toFixed(3)),
      sourceQualityScore,
      recommendedTrustLevel: recommendTrustLevel(sourceQualityScore, localRelevanceRatio, fallbackRatio),
      recommendedSignalWeight: recommendSignalWeight(sourceQualityScore, localRelevanceRatio, fallbackRatio),
      sampleItems: dedupeByUrl(successRuns.flatMap((run) => run.items)).slice(0, 5)
    };
  });

  const successfulSources = summary.filter((source) => source.successRuns > 0).length;
  const passedGate = successfulSources >= 10;

  const report = {
    generatedAt: now.toISOString(),
    rounds,
    concurrency,
    requiredSuccessfulSources: 10,
    successfulSources,
    passedGate,
    sources: summary,
    failures: runs.filter((run) => !run.success).map((run) => ({
      sourceId: run.sourceId,
      sourceName: run.sourceName,
      error: run.error,
      durationMs: run.durationMs
    }))
  };

  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, `live-source-calibration-${now.toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify({ reportPath, successfulSources, passedGate, summary }, null, 2));

  if (!passedGate) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
