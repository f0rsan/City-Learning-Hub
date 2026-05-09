import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("HomePage", () => {
  it("shows the weekly Shenzhen positioning and two audience entries", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /带孩子去学习/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /大人去交流/ })).toBeInTheDocument();
  });

  it("shows curated activity cards with recommendation reasons", () => {
    renderRoute(<App />);

    expect(screen.getByText("南山 AI 互动体验日")).toBeInTheDocument();
    expect(screen.getByText(/有互动环节，不只是看展/)).toBeInTheDocument();
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
});
