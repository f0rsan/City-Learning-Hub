import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { resetCandidateData } from "../../src/domain/candidateStore";
import { addCorrectionReport, addSubmittedActivity, resetLocalHubData } from "../../src/domain/localStore";
import { renderRoute } from "../../src/test/render";

describe("EvaluationAdmin", () => {
  beforeEach(() => {
    resetLocalHubData();
    resetCandidateData();
  });

  it("shows system recommendation, confidence, value reasons, and risk reasons", () => {
    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "系统评估台" })).toBeInTheDocument();
    expect(screen.getAllByText(/系统推荐/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/判断信心/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/为什么值得去/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/主要风险/)[0]).toBeInTheDocument();
  });

  it("can confirm, lower confidence, reject, or send to calibration", async () => {
    const user = userEvent.setup();
    renderRoute(<App />, "/admin");

    await user.click(screen.getAllByRole("button", { name: /确认推荐/ })[0]);
    expect(screen.getByText("已确认系统判断")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /降低信心/ })[0]);
    expect(screen.getByText("已降低信心，等待更多证据")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /送入校准/ })[0]);
    expect(screen.getByText("已送入人工校准")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /拒绝推荐/ })[0]);
    expect(screen.getByText("已拒绝推荐")).toBeInTheDocument();
  });

  it("converts an approved submission into a candidate draft", async () => {
    const user = userEvent.setup();
    addSubmittedActivity({
      title: "深圳机器人开放课",
      category: "亲子科技",
      audience: ["family"],
      dateText: "2026-05-20 10:00",
      district: "南山",
      venue: "深圳湾",
      officialUrl: "https://example.com/robot-open",
      contact: "robot@example.com",
      note: "有动手体验"
    });

    renderRoute(<App />, "/admin");

    await user.click(screen.getByRole("button", { name: /转为候选草稿/ }));

    expect(screen.getByText("深圳机器人开放课")).toBeInTheDocument();
    expect(screen.getAllByText("候选草稿")[0]).toBeInTheDocument();
  });

  it("shows corrections that affect trust", () => {
    addCorrectionReport({
      activitySlug: "nanshan-ai-family-day",
      issueType: "链接失效",
      detail: "官方页面无法打开",
      contact: "reader@example.com"
    });

    renderRoute(<App />, "/admin");

    expect(screen.getByText("影响可信度的纠错")).toBeInTheDocument();
    expect(screen.getByText("官方页面无法打开")).toBeInTheDocument();
  });
});
