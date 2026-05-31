import type { SourceCollectionMode } from "./types";

export type LiveSourceParser =
  | "bookmall_news_api"
  | "eventbrite_jsonld"
  | "douban_event_links"
  | "generic_event_links"
  | "szu_jsonapi_events"
  | "landing_page_event";

export type LiveSourceDefinition = {
  id: string;
  name: string;
  url: string;
  parser: LiveSourceParser;
  timeoutMs?: number;
  includeUrlPatterns?: RegExp[];
  includeTitlePatterns?: RegExp[];
  requireLocalSignal?: boolean;
  collectionMode?: SourceCollectionMode;
  assumeLocal?: boolean;
  request?: {
    url: string;
    method?: "GET" | "POST";
    body?: string;
    headers?: Record<string, string>;
  };
  fallbackItems?: Array<{
    title: string;
    url: string;
    startAt?: string;
    isFallback?: boolean;
  }>;
};

export type LiveCollectedItem = {
  sourceId: string;
  title: string;
  url: string;
  startAt?: string;
  isFallback?: boolean;
};

export type LiveCollectionResult = {
  sourceId: string;
  success: boolean;
  fetchedAt: string;
  durationMs: number;
  items: LiveCollectedItem[];
  error?: string;
};

function decodeHtml(value: string) {
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

function stripTags(value: string) {
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

function readAttribute(tag: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1];
}

function normalizeUrlForDedupe(url: string) {
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

function titleQuality(title: string) {
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
  if (/活动|讲座|沙龙|论坛|大会|展|AI|科技|读书|工作坊|meetup|summit|workshop|hackathon/i.test(title)) {
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

const localRelevancePattern = /深圳|Shenzhen|南山|福田|罗湖|宝安|龙岗|龙华|光明|坪山|盐田|前海|蛇口|深港|粤港澳/i;

export function parseEventbriteJsonLd(html: string, sourceId: string) {
  const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const items: LiveCollectedItem[] = [];

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

export function parseBookmallNewsList(jsonText: string, sourceId: string) {
  const parsed = JSON.parse(jsonText);
  const rows = Array.isArray(parsed?.data?.list) ? parsed.data.list : [];
  const items: LiveCollectedItem[] = [];

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

export function parseDoubanEventLinks(html: string, sourceId: string) {
  const linkRegex = /<a[^>]*href="(https:\/\/www\.douban\.com\/event\/\d+\/)"[^>]*title="([^"]+)"[^>]*>/g;
  const items: LiveCollectedItem[] = [];

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

function dedupeByUrl(items: LiveCollectedItem[]) {
  const itemMap = new Map<string, LiveCollectedItem>();

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

export function parseGenericEventLinks(html: string, source: LiveSourceDefinition) {
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  const items: LiveCollectedItem[] = [];

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
    const includeByLocalSignal =
      !source.requireLocalSignal || source.assumeLocal || localRelevancePattern.test(`${title} ${url}`);

    if (!includeByUrl || !includeByTitle || !includeByLocalSignal || titleQuality(title) <= 0) {
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

export function parseSzuJsonApiEvents(jsonText: string, sourceId: string) {
  const parsed = JSON.parse(jsonText);
  const rows = Array.isArray(parsed?.data) ? parsed.data : [];
  const items: LiveCollectedItem[] = [];

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

export function parseLandingPageEvent(_html: string, source: LiveSourceDefinition) {
  const text = stripTags(_html);
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

function fallbackItemsFor(definition: LiveSourceDefinition): LiveCollectedItem[] {
  return (definition.fallbackItems ?? []).map((item) => ({
    sourceId: definition.id,
    title: item.title,
    url: item.url,
    ...(item.startAt ? { startAt: item.startAt } : {}),
    isFallback: true
  }));
}

function filterItemsForDefinition(items: LiveCollectedItem[], definition: LiveSourceDefinition) {
  return items.filter((item) => {
    const includeByUrl = definition.includeUrlPatterns?.some((pattern) => pattern.test(item.url)) ?? true;
    const includeByTitle = definition.includeTitlePatterns?.some((pattern) => pattern.test(item.title)) ?? true;
    const includeByLocalSignal =
      !definition.requireLocalSignal || definition.assumeLocal || localRelevancePattern.test(`${item.title} ${item.url}`);
    return includeByUrl && includeByTitle && includeByLocalSignal && titleQuality(item.title) > 0;
  });
}

async function fetchWithTimeout(definition: LiveSourceDefinition, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const request = definition.request ?? { url: definition.url };

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

export async function collectFromLiveSource(definition: LiveSourceDefinition): Promise<LiveCollectionResult> {
  const startedAt = Date.now();
  const fetchedAt = new Date().toISOString();

  try {
    const html = await fetchWithTimeout(definition, definition.timeoutMs ?? 12000);
    const parsedItems = (() => {
      if (definition.parser === "bookmall_news_api") {
        return parseBookmallNewsList(html, definition.id);
      }
      if (definition.parser === "eventbrite_jsonld") {
        return parseEventbriteJsonLd(html, definition.id);
      }
      if (definition.parser === "douban_event_links") {
        return parseDoubanEventLinks(html, definition.id);
      }
      if (definition.parser === "szu_jsonapi_events") {
        return parseSzuJsonApiEvents(html, definition.id);
      }
      if (definition.parser === "landing_page_event") {
        return parseLandingPageEvent(html, definition);
      }
      return parseGenericEventLinks(html, definition);
    })();
    const items = filterItemsForDefinition(parsedItems, definition);

    const fallbackItems = fallbackItemsFor(definition);
    const resolvedItems = items.length > 0 ? items : fallbackItems;

    return {
      sourceId: definition.id,
      success: resolvedItems.length > 0,
      fetchedAt,
      durationMs: Date.now() - startedAt,
      items: resolvedItems,
      error: resolvedItems.length ? undefined : "解析成功但未提取到活动"
    };
  } catch (error) {
    const fallbackItems = fallbackItemsFor(definition);
    if (fallbackItems.length > 0) {
      return {
        sourceId: definition.id,
        success: true,
        fetchedAt,
        durationMs: Date.now() - startedAt,
        items: fallbackItems
      };
    }

    return {
      sourceId: definition.id,
      success: false,
      fetchedAt,
      durationMs: Date.now() - startedAt,
      items: [],
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}
