import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { createElement } from "react";
import App from "../../src/App";
import { getPublicEvaluatedActivities, resetCandidateData } from "../../src/domain/candidateStore";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import { resetLocalHubData } from "../../src/domain/localStore";
import { renderRoute } from "../../src/test/render";

describe("live activity import", () => {
  beforeEach(() => {
    resetLocalHubData();
    resetCandidateData();
  });

  it("puts source-collected activities into the public evaluated activity feed", () => {
    expect(liveCollectedActivities.length).toBeGreaterThan(0);

    const publicActivities = getPublicEvaluatedActivities();
    const imported = publicActivities.find((activity) => activity.tags.includes("真实采集"));

    expect(imported).toEqual(
      expect.objectContaining({
        officialUrl: expect.stringMatching(/^https?:\/\//),
        status: "published",
        weeklyFeatured: true
      })
    );
    expect(imported?.tags).toContain("真实采集");
    expect(imported?.summary).not.toMatch(/真实来源|系统已抓取|以原页面为准/);
  });

  it("allows source-collected activities to enter the correction flow", () => {
    const activity = liveCollectedActivities.find((item) => item.status === "published");

    expect(activity).toBeDefined();

    renderRoute(createElement(App), `/correct/${activity!.slug}`);

    expect(screen.getByRole("heading", { name: `纠错：${activity!.title}` })).toBeInTheDocument();
    expect(screen.getByText(activity!.officialUrl)).toBeInTheDocument();
  });

  it("keeps source collection labels out of the detail hero", () => {
    const activity = liveCollectedActivities.find((item) => item.status === "published");

    expect(activity).toBeDefined();

    renderRoute(createElement(App), `/activities/${activity!.slug}`);

    const hero = document.querySelector(".detail-hero");
    expect(hero?.textContent).toContain(activity!.summary);
    expect(hero?.textContent).not.toMatch(/真实来源|系统已抓取|以原页面为准|真实采集/);
  });
});
