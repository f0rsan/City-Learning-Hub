import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";
import { renderRoute } from "../src/test/render";

describe("App smoke test", () => {
  it("renders the initial Shenzhen hub shell", () => {
    renderRoute(<App />);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
  });
});
