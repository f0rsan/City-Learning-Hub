import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("AboutPage", () => {
  it("explains sources and trust rules", () => {
    renderRoute(<App />, "/about");

    expect(screen.getByRole("heading", { name: "我们怎样整理深圳活动" })).toBeInTheDocument();
    expect(screen.getByText(/80% 系统判断、20% 人工校准/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "儿童活动" })).toBeInTheDocument();
    expect(screen.getByText(/不会进入亲子精选/)).toBeInTheDocument();
  });
});
