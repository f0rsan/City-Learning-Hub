import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("HomePage", () => {
  it("shows the weekly Shenzhen positioning and two audience entries", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /带孩子去学习/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /成人学习交流/ })).toBeInTheDocument();
  });

  it("shows curated activity cards with recommendation reasons", () => {
    renderRoute(<App />);

    expect(screen.getByText("南山 AI 互动体验日")).toBeInTheDocument();
    expect(screen.getAllByText(/看点/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/有互动环节，不只是看展/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/注意/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/强推荐|值得考虑|谨慎选择|不建议前往/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/高把握|中把握|低把握/)[0]).toBeInTheDocument();
    expect(screen.getByText(/先看要点/)).toBeInTheDocument();
  });

  it("shows a Shenzhen learning visual", () => {
    renderRoute(<App />);

    expect(screen.getByRole("img", { name: "深圳学习活动现场氛围" })).toBeInTheDocument();
  });

  it("filters the family route to parent-child activities", () => {
    renderRoute(<App />, "/audience/family");

    expect(screen.getByRole("heading", { name: "带孩子去学习" })).toBeInTheDocument();
    expect(screen.getByText("南山 AI 互动体验日")).toBeInTheDocument();
    expect(screen.queryByText("AI 产品实践 Meetup")).not.toBeInTheDocument();
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
      expect(screen.getByRole("button", { name: /展开其余 \d+ 条活动/ })).toBeInTheDocument();
      expect(screen.queryByText("城市与技术社科读书沙龙")).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
