import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import { resetLocalHubData } from "../../src/domain/localStore";
import type { Activity } from "../../src/domain/types";
import { renderRoute } from "../../src/test/render";

describe("submit and admin flow", () => {
  const collectedActivities: readonly Activity[] = liveCollectedActivities;
  const familyActivity = collectedActivities.find(
    (activity) => activity.status === "published" && activity.audience.includes("family")
  )!;

  beforeEach(() => {
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
    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "活动审核台" })).toBeInTheDocument();
    expect(screen.getAllByText("周末机器人体验营")[0]).toBeInTheDocument();
    expect(screen.getAllByText("待补充")[0]).toBeInTheDocument();
  });

  it("lets a reader report a correction for an activity", async () => {
    const user = userEvent.setup();
    const correctionPage = renderRoute(<App />, `/correct/${familyActivity.slug}`);

    expect(screen.getByRole("heading", { name: `纠错：${familyActivity.title}` })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("问题类型"), "时间变更");
    await user.type(screen.getByLabelText("哪里需要改"), "主办方页面显示改到周日");
    await user.type(screen.getByLabelText("联系方式"), "reader@city-learning.local");
    await user.click(screen.getByRole("button", { name: "提交更正信息" }));

    expect(screen.getByText("已收到，会核对")).toBeInTheDocument();

    correctionPage.unmount();
    renderRoute(<App />, "/admin");

    expect(screen.getByText("时间变更")).toBeInTheDocument();
    expect(screen.getByText("主办方页面显示改到周日")).toBeInTheDocument();
    expect(screen.getAllByText(/影响可靠性/)[0]).toBeInTheDocument();
  });
});
