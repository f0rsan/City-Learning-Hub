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
    expect(screen.getByText("参考依据")).toBeInTheDocument();
    expect(screen.getByText(/^来源$/)).toBeInTheDocument();
    expect(screen.getByText(/^组织方$/)).toBeInTheDocument();
    expect(screen.getByText(/^场地$/)).toBeInTheDocument();
    expect(screen.getAllByText(/高把握|中把握|低把握/)[0]).toBeInTheDocument();
    expect(screen.getByText(/低龄儿童需要家长全程陪同/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "去活动页面报名" })).toBeInTheDocument();
  });

  it("shows a clear warning for cancelled activities", () => {
    renderRoute(<App />, "/activities/cancelled-ai-lecture");

    expect(screen.getAllByText("活动已取消")[0]).toBeInTheDocument();
    expect(screen.getByText(/请不要按原计划前往/)).toBeInTheDocument();
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
      expect(screen.queryByText(/^来源$/)).not.toBeInTheDocument();
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
      expect(screen.getByText(/^来源$/)).toBeInTheDocument();
      expect(evidenceToggle).toHaveAttribute("aria-expanded", "true");
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
