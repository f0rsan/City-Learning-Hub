import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { getWeeklyFeatured } from "../../src/domain/activitySelectors";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import type { Activity } from "../../src/domain/types";
import { renderRoute } from "../../src/test/render";

describe("HomePage", () => {
  const collectedActivities: readonly Activity[] = liveCollectedActivities;
  const familyActivity = collectedActivities.find(
    (activity) => activity.status === "published" && activity.audience.includes("family")
  )!;
  const adultActivity = collectedActivities.find(
    (activity) => activity.status === "published" && activity.audience.includes("adult")
  )!;
  const hiddenMobileActivity = collectedActivities.find((activity) => activity.title === "E-IOT 嵌入式与物联网展")!;

  it("shows the weekly Shenzhen positioning and two audience entries", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /带孩子去学习/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /成人学习交流/ })).toBeInTheDocument();
  });

  it("shows curated activity rows with recommendation reasons", () => {
    renderRoute(<App />);

    expect(screen.getByText(familyActivity.title)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "AI服务器先进制造技术创新系列论坛封面" })).toBeInTheDocument();
    expect(screen.getAllByText(/看点/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/注意/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/强推荐|值得考虑|谨慎选择|不建议前往/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/高可靠|可参考|待核对/)[0]).toBeInTheDocument();
    expect(screen.getByText(/按时间排列/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "更多可参考活动" })).toBeInTheDocument();
    expect(screen.getByText(/系统筛过/)).toBeInTheDocument();
  });

  it("shows compact weekly signals", () => {
    renderRoute(<App />);

    expect(screen.getByText(`${getWeeklyFeatured([...collectedActivities]).length} 条精选`)).toBeInTheDocument();
    expect(screen.getByText("真实采集")).toBeInTheDocument();
  });

  it("filters the family route to parent-child activities", () => {
    renderRoute(<App />, "/audience/family");

    expect(screen.getByRole("heading", { name: "带孩子去学习" })).toBeInTheDocument();
    expect(screen.getByText(familyActivity.title)).toBeInTheDocument();
    expect(screen.queryByText(adultActivity.title)).not.toBeInTheDocument();
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

  it("shows compact weekly list on mobile with progressive disclosure", () => {
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
      expect(screen.getAllByRole("button", { name: /展开其余 \d+ 条活动/ }).length).toBeGreaterThan(0);
      expect(screen.queryByText(hiddenMobileActivity.title)).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
