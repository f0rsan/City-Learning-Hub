import { describe, expect, it } from "vitest";
import {
  collectFromLiveSource,
  parseBookmallNewsList,
  parseDoubanEventLinks,
  parseEventbriteJsonLd,
  parseGenericEventLinks,
  parseLandingPageEvent,
  parseSzuJsonApiEvents
} from "../../src/domain/liveSourceAdapters";

describe("liveSourceAdapters", () => {
  it("parses eventbrite JSON-LD item list", () => {
    const html = `
      <html><body>
        <script type="application/ld+json">
          {"@context":"https://schema.org","itemListElement":[
            {"position":1,"@type":"ListItem","item":{"@type":"Event","name":"Shenzhen AI Summit","url":"https://example.com/e/1","startDate":"2026-05-12"}},
            {"position":2,"@type":"ListItem","item":{"@type":"Event","name":"Shenzhen Maker Day","url":"https://example.com/e/2","startDate":"2026-05-13"}}
          ]}
        </script>
      </body></html>
    `;

    const items = parseEventbriteJsonLd(html, "eventbrite-shenzhen");

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(
      expect.objectContaining({
        sourceId: "eventbrite-shenzhen",
        title: "Shenzhen AI Summit",
        url: "https://example.com/e/1",
        startAt: "2026-05-12"
      })
    );
  });

  it("parses douban event links and removes duplicates", () => {
    const html = `
      <div class="title">
        <a href="https://www.douban.com/event/100/" title="城市与技术读书会">城市与技术读书会</a>
      </div>
      <div class="title">
        <a href="https://www.douban.com/event/100/" title="城市与技术读书会">城市与技术读书会</a>
      </div>
      <div class="title">
        <a href="https://www.douban.com/event/200/" title="深圳创客开放夜">深圳创客开放夜</a>
      </div>
    `;

    const items = parseDoubanEventLinks(html, "douban-shenzhen");

    expect(items).toHaveLength(2);
    expect(items[1]).toEqual(
      expect.objectContaining({
        sourceId: "douban-shenzhen",
        title: "深圳创客开放夜",
        url: "https://www.douban.com/event/200/"
      })
    );
  });

  it("parses generic event links with source filters", () => {
    const html = `
      <a href="/events/robot-day.html">深圳机器人工作坊</a>
      <a href="/about.html">关于我们</a>
      <a href="/events/robot-day.html?utm_source=test">深圳机器人工作坊</a>
      <a href="/events/book-salon.html">城市读书沙龙</a>
    `;

    const items = parseGenericEventLinks(html, {
      id: "generic-test-source",
      name: "测试来源",
      url: "https://example.com/list/",
      parser: "generic_event_links",
      includeUrlPatterns: [/\/events\//],
      includeTitlePatterns: [/深圳|工作坊|沙龙/]
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(
      expect.objectContaining({
        sourceId: "generic-test-source",
        title: "深圳机器人工作坊",
        url: "https://example.com/events/robot-day.html"
      })
    );
  });

  it("uses anchor title attributes when the visible generic link text is empty", () => {
    const html = `
      <a href="/Activity/detail/100" title="深圳少年宫科普工作坊"><img src="/cover.jpg" /></a>
      <a href="/Activity/detail/101" aria-label="深圳科学讲座"><span></span></a>
    `;

    const items = parseGenericEventLinks(html, {
      id: "generic-title-source",
      name: "测试来源",
      url: "https://example.com/Activity/",
      parser: "generic_event_links",
      includeUrlPatterns: [/\/Activity\/detail\//],
      includeTitlePatterns: [/深圳|科普|讲座/]
    });

    expect(items.map((item) => item.title)).toEqual(["深圳少年宫科普工作坊", "深圳科学讲座"]);
  });

  it("parses Shenzhen Book City news API records as cultural activity candidates", () => {
    const json = JSON.stringify({
      data: {
        list: [
          {
            news_id: "2198",
            new_title: "深圳出版集团与深圳大剧院会员联动活动",
            tweetsUrl: ""
          },
          {
            news_id: "1877",
            new_title: "深圳书城名家读书分享会",
            tweetsUrl: "https://mp.weixin.qq.com/s/bookcity"
          },
          {
            id: "culture-1",
            title: "深圳书城亲子阅读活动",
            pc_link: "https://www.szbookmall.com/activity/culture-1"
          }
        ]
      }
    });

    const items = parseBookmallNewsList(json, "shenzhen-book-city");

    expect(items).toEqual([
      expect.objectContaining({
        sourceId: "shenzhen-book-city",
        title: "深圳出版集团与深圳大剧院会员联动活动",
        url: "https://www.szbookmall.com/news/2198"
      }),
      expect.objectContaining({
        sourceId: "shenzhen-book-city",
        title: "深圳书城名家读书分享会",
        url: "https://mp.weixin.qq.com/s/bookcity"
      }),
      expect.objectContaining({
        sourceId: "shenzhen-book-city",
        title: "深圳书城亲子阅读活动",
        url: "https://www.szbookmall.com/activity/culture-1"
      })
    ]);
  });

  it("uses fallback seed items when an official source is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("TLS failed")));

    const result = await collectFromLiveSource({
      id: "science-fallback",
      name: "深圳科学馆",
      url: "https://www.szstm.com/",
      parser: "generic_event_links",
      fallbackItems: [
        {
          title: "深圳科学馆科普活动安排",
          url: "https://szstm.com/mobile/html/gk/sj"
        }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.items).toEqual([
      expect.objectContaining({
        sourceId: "science-fallback",
        title: "深圳科学馆科普活动安排",
        isFallback: true
      })
    ]);
  });

  it("parses Shenzhen University Library JSON API events", () => {
    const json = JSON.stringify({
      data: [
        {
          attributes: {
            title: "AI 资源系列讲座",
            drupal_internal__nid: 123,
            event_date: { value: "2026-05-20T10:00:00+08:00" }
          }
        }
      ]
    });

    const items = parseSzuJsonApiEvents(json, "szu-library-events");

    expect(items).toEqual([
      expect.objectContaining({
        sourceId: "szu-library-events",
        title: "AI 资源系列讲座",
        url: "https://www.lib.szu.edu.cn/node/123",
        startAt: "2026-05-20T10:00:00+08:00"
      })
    ]);
  });

  it("filters navigation, subscription, and low-value links from generic sources", () => {
    const html = `
      <a href="/schedule">展览排期</a>
      <a href="https://lu.ma/claw">订阅 OpenClaw Meetups</a>
      <a href="/notice">【获奖公告】活动名单公布</a>
      <a href="/events/real">深圳 AI 技术论坛</a>
      <a href="/events/comment"><!-- -->2026年8月26日<!-- --> 物联网论坛</a>
    `;

    const items = parseGenericEventLinks(html, {
      id: "quality-test-source",
      name: "质量测试来源",
      url: "https://example.com/",
      parser: "generic_event_links",
      includeTitlePatterns: [/展|活动|论坛|Meetup|AI/]
    });

    expect(items.map((item) => item.title)).toEqual(["深圳 AI 技术论坛", "2026年8月26日 物联网论坛"]);
  });

  it("turns a stable official landing page into one candidate item", () => {
    const items = parseLandingPageEvent("<title>E-IOT@2026 嵌入式与物联网展</title><p>2026年8月26日</p>", {
      id: "eiotexpo-shenzhen",
      name: "E-IOT 嵌入式与物联网展",
      url: "https://www.eiotexpo.com/",
      parser: "landing_page_event"
    });

    expect(items).toEqual([
      {
        sourceId: "eiotexpo-shenzhen",
        title: "E-IOT 嵌入式与物联网展",
        url: "https://www.eiotexpo.com/",
        startAt: "2026-08-26T10:00:00+08:00"
      }
    ]);
  });
});
