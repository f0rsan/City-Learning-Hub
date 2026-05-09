import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { resetLocalHubData } from "../../src/domain/localStore";
import { renderRoute } from "../../src/test/render";

describe("submit and admin flow", () => {
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
    await user.type(screen.getByLabelText("官方链接"), "https://example.com/robot");
    await user.type(screen.getByLabelText("联系方式"), "organizer@example.com");
    await user.type(screen.getByLabelText("推荐理由"), "适合小学家庭");
    await user.click(screen.getByRole("button", { name: "提交到待审核" }));

    expect(screen.getByText("已进入待审核队列")).toBeInTheDocument();

    submitPage.unmount();
    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "轻后台" })).toBeInTheDocument();
    expect(screen.getByText("周末机器人体验营")).toBeInTheDocument();
    expect(screen.getByText("待审核")).toBeInTheDocument();
  });

  it("lets a reader report a correction for an activity", async () => {
    const user = userEvent.setup();
    const correctionPage = renderRoute(<App />, "/correct/nanshan-ai-family-day");

    expect(screen.getByRole("heading", { name: "纠错：南山 AI 互动体验日" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("问题类型"), "时间变更");
    await user.type(screen.getByLabelText("具体说明"), "主办方页面显示改到周日");
    await user.type(screen.getByLabelText("联系方式"), "reader@example.com");
    await user.click(screen.getByRole("button", { name: "提交纠错" }));

    expect(screen.getByText("已收到纠错信息")).toBeInTheDocument();

    correctionPage.unmount();
    renderRoute(<App />, "/admin");

    expect(screen.getByText("时间变更")).toBeInTheDocument();
    expect(screen.getByText("主办方页面显示改到周日")).toBeInTheDocument();
  });
});
