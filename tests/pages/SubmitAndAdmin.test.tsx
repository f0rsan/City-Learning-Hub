import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { saveCandidateActivity } from "../../src/domain/candidateStore";
import { getPublicListedActivities } from "../../src/domain/activitySelectors";
import { evaluateActivity } from "../../src/domain/evaluationRules";
import type { CandidateActivity } from "../../src/domain/evaluationTypes";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import { resetLocalHubData } from "../../src/domain/localStore";
import { sampleActivities } from "../fixtures/sampleData";
import type { Activity } from "../../src/domain/types";
import { renderRoute } from "../../src/test/render";

describe("submit and admin flow", () => {
  const collectedActivities: readonly Activity[] = liveCollectedActivities;
  const publicActivity = getPublicListedActivities([...collectedActivities])[0];
  const fallbackPublicActivity: CandidateActivity = {
    ...sampleActivities[0],
    id: "test-correction-public-activity",
    slug: "test-correction-public-activity",
    title: "测试纠错公开活动",
    startAt: "2026-06-28T10:00:00+08:00",
    endAt: "2026-06-28T12:00:00+08:00",
    officialUrl: "https://example.com/events/test-correction-public-activity",
    lastConfirmedAt: "2026-06-11",
    status: "published",
    weeklyFeatured: true,
    publicListingTier: "featured",
    publicScore: 95,
    candidateStatus: "evaluated",
    evaluation: evaluateActivity({
      ...sampleActivities[0],
      id: "test-correction-public-activity",
      status: "published",
      startAt: "2026-06-28T10:00:00+08:00",
      endAt: "2026-06-28T12:00:00+08:00"
    }),
    createdAt: "2026-06-11T00:00:00.000Z",
    updatedAt: "2026-06-11T00:00:00.000Z"
  };

  function ensureCorrectionActivity() {
    if (publicActivity) {
      return publicActivity;
    }

    saveCandidateActivity(fallbackPublicActivity);
    return fallbackPublicActivity;
  }

  beforeEach(() => {
    window.sessionStorage.clear();
    resetLocalHubData();
  });

  it("lets a reader submit an activity and shows it in the editor queue", async () => {
    const user = userEvent.setup();
    const submitPage = renderRoute(<App />, "/submit");

    await user.type(screen.getByLabelText("活动名称"), "周末机器人体验营");
    await user.selectOptions(screen.getByLabelText("主要人群"), "亲子");
    await user.type(screen.getByLabelText("时间"), "周六 10:00");
    await user.type(screen.getByLabelText("区域"), "南山");
    await user.type(screen.getByLabelText("地点"), "深圳湾");
    await user.type(screen.getByLabelText("活动链接"), "https://activity.nslib.cn/activity/info/11423?robot=1");
    await user.type(screen.getByLabelText("联系方式"), "organizer@city-learning.local");
    await user.type(screen.getByLabelText("你为什么推荐它"), "适合小学家庭");
    await user.click(screen.getByRole("button", { name: "推荐这个活动" }));

    expect(screen.getByText(/已收到：周末机器人体验营/)).toBeInTheDocument();

    submitPage.unmount();
    window.sessionStorage.setItem("shenzhen-learning-hub:admin-authenticated", "true");
    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "活动审核台" })).toBeInTheDocument();
    expect(screen.getAllByText("周末机器人体验营")[0]).toBeInTheDocument();
    expect(screen.getAllByText("待补充")[0]).toBeInTheDocument();
  });

  it("lets a reader report a correction for an activity", async () => {
    const user = userEvent.setup();
    const activity = ensureCorrectionActivity();
    const correctionPage = renderRoute(<App />, `/correct/${activity.slug}`);

    expect(screen.getByRole("heading", { name: `纠错：${activity.title}` })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("问题类型"), "时间变更");
    await user.type(screen.getByLabelText("哪里需要改"), "主办方页面显示改到周日");
    await user.type(screen.getByLabelText("联系方式"), "reader@city-learning.local");
    await user.click(screen.getByRole("button", { name: "提交更正信息" }));

    expect(screen.getByText("已收到，会核对")).toBeInTheDocument();

    correctionPage.unmount();
    window.sessionStorage.setItem("shenzhen-learning-hub:admin-authenticated", "true");
    renderRoute(<App />, "/admin");

    expect(screen.getByText("时间变更")).toBeInTheDocument();
    expect(screen.getByText("主办方页面显示改到周日")).toBeInTheDocument();
    expect(screen.getAllByText(/影响可靠性/)[0]).toBeInTheDocument();
  });
});
