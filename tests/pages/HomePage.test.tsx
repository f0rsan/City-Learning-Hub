import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { getPublicListedActivities, getWeeklyFeatured } from "../../src/domain/activitySelectors";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import type { Activity } from "../../src/domain/types";
import { renderRoute } from "../../src/test/render";

describe("HomePage", () => {
  const collectedActivities: readonly Activity[] = liveCollectedActivities;
  const publicActivities = getPublicListedActivities([...collectedActivities]);
  const featuredActivities = getWeeklyFeatured([...collectedActivities]);
  const visibleActivity = publicActivities[0];
  const familyActivity = publicActivities.find((activity) => activity.audience.includes("family"));
  const adultActivity = publicActivities.find((activity) => activity.audience.includes("adult"));

  it("shows the weekly Shenzhen positioning and two audience entries", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /带孩子去学习/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /成人学习交流/ })).toBeInTheDocument();
  });

  it("shows curated activity rows with recommendation reasons", () => {
    renderRoute(<App />);

    if (visibleActivity) {
      expect(screen.getByText(visibleActivity.title)).toBeInTheDocument();
      expect(screen.getAllByLabelText("活动时间和地点").length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText("活动基本信息").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/看点/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/注意/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/强推荐|值得考虑|谨慎选择|不建议前往/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/高可靠|可参考|待核对/)[0]).toBeInTheDocument();
    } else {
      expect(screen.getByText("暂无明确时间的精选活动，下一次采集后更新。")).toBeInTheDocument();
    }

    expect(screen.getByText(/确定性更强/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "更多可参考活动" })).toBeInTheDocument();
    expect(screen.getByText(/系统筛过/)).toBeInTheDocument();
    expect(screen.queryByText("时间见活动页")).not.toBeInTheDocument();
  });

  it("shows compact weekly signals", () => {
    renderRoute(<App />);

    expect(screen.getByText(`${featuredActivities.length} 条精选`)).toBeInTheDocument();
    expect(screen.getByText("真实采集")).toBeInTheDocument();
  });

  it("filters the family route to parent-child activities", () => {
    renderRoute(<App />, "/audience/family");

    expect(screen.getByRole("heading", { name: "带孩子去学习" })).toBeInTheDocument();
    if (familyActivity) {
      expect(screen.getByText(familyActivity.title)).toBeInTheDocument();
    } else {
      expect(screen.getByText("暂无明确时间的亲子活动，下一次采集后更新。")).toBeInTheDocument();
    }

    if (adultActivity) {
      expect(screen.queryByText(adultActivity.title)).not.toBeInTheDocument();
    }
  });

  it("toggles theme mode from the header", async () => {
    const user = userEvent.setup();
    renderRoute(<App />);

    const root = document.documentElement;
    const toggle = screen.getByRole("button", { name: /切换深色模式|切换浅色模式/ });
    const before = root.dataset.theme;

    await user.click(toggle);
    expect(root.dataset.theme).not.toBe(before);
  });

  it("shows compact weekly list on mobile without unclear time labels", () => {
    const originalMatchMedia = window.matchMedia;

    try {
      window.matchMedia = ((query: string) =>
        ({
          matches: query === "(max-width: 860px)",
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false
      }) as MediaQueryList);

      renderRoute(<App />);
      expect(screen.queryByText("时间见活动页")).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
