import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("ActivityPage", () => {
  it("shows decision details before the official link", () => {
    renderRoute(<App />, "/activities/nanshan-ai-family-day");

    expect(screen.getByRole("heading", { name: "南山 AI 互动体验日" })).toBeInTheDocument();
    expect(screen.getByText(/适合第一次带孩子接触 AI/)).toBeInTheDocument();
    expect(screen.getByText("系统判断依据")).toBeInTheDocument();
    expect(screen.getByText(/来源可信度/)).toBeInTheDocument();
    expect(screen.getByText(/组织方信号/)).toBeInTheDocument();
    expect(screen.getByText(/场地信号/)).toBeInTheDocument();
    expect(screen.getAllByText(/判断信心/)[0]).toBeInTheDocument();
    expect(screen.getByText(/低龄儿童需要家长全程陪同/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看官方报名页面" })).toBeInTheDocument();
  });

  it("shows a clear warning for cancelled activities", () => {
    renderRoute(<App />, "/activities/cancelled-ai-lecture");

    expect(screen.getAllByText("活动已取消")[0]).toBeInTheDocument();
    expect(screen.getByText(/不能进入本周精选/)).toBeInTheDocument();
  });

  it("redirects unknown activities to the homepage", () => {
    renderRoute(<App />, "/activities/missing-activity");

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
  });

  it("collapses reasons and evidence by default on mobile and supports toggles", async () => {
    const user = userEvent.setup();
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

      renderRoute(<App />, "/activities/nanshan-ai-family-day");

      expect(screen.queryByRole("heading", { name: "适合谁" })).not.toBeInTheDocument();
      expect(screen.queryByText(/来源可信度/)).not.toBeInTheDocument();
      const reasonsToggle = screen.getByRole("button", { name: "展开理由" });
      const evidenceToggle = screen.getByRole("button", { name: "展开证据" });

      expect(reasonsToggle).toHaveAttribute("aria-expanded", "false");
      expect(evidenceToggle).toHaveAttribute("aria-expanded", "false");
      expect(reasonsToggle).toHaveAttribute("aria-controls");
      expect(evidenceToggle).toHaveAttribute("aria-controls");

      await user.click(reasonsToggle);
      expect(screen.getByRole("heading", { name: "适合谁" })).toBeInTheDocument();
      expect(reasonsToggle).toHaveAttribute("aria-expanded", "true");

      await user.click(evidenceToggle);
      expect(screen.getByText(/来源可信度/)).toBeInTheDocument();
      expect(evidenceToggle).toHaveAttribute("aria-expanded", "true");
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
