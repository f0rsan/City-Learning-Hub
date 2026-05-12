import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";
import { renderRoute } from "../../src/test/render";

describe("AboutPage", () => {
  it("explains sources and trust rules", () => {
    renderRoute(<App />, "/about");

    expect(screen.getByRole("heading", { name: "深圳活动怎么选" })).toBeInTheDocument();
    expect(screen.getByText(/标出适合人群和注意事项/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "来源可查" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "亲子活动" })).toBeInTheDocument();
    expect(screen.getByText(/不会进入亲子精选/)).toBeInTheDocument();
  });
});
