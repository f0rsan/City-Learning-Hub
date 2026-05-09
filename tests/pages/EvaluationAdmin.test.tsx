import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { getCalibrationNotes, replaceCalibrationNotes, resetCalibrationData } from "../../src/domain/calibrationStore";
import {
  reevaluateCandidatesForRuleVersionChange,
  resetCandidateData,
  saveCandidateActivity
} from "../../src/domain/candidateStore";
import { evaluateActivity } from "../../src/domain/evaluationRules";
import { addCorrectionReport, addSubmittedActivity, resetLocalHubData } from "../../src/domain/localStore";
import { sampleActivities } from "../../src/domain/sampleData";
import { renderRoute } from "../../src/test/render";

describe("EvaluationAdmin", () => {
  beforeEach(() => {
    resetLocalHubData();
    resetCandidateData();
    resetCalibrationData();
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

    const noteByAction = new Map(getCalibrationNotes().map((note) => [note.action, note]));

    expect(noteByAction.get("confirm")).toMatchObject({
      reasonType: "rule_exception",
      audience: expect.not.stringMatching(/unknown/),
      ruleTag: expect.stringContaining("ADMIN_CONFIRM_")
    });
    expect(noteByAction.get("lower_confidence")).toMatchObject({
      reasonType: "evidence_gap",
      audience: expect.not.stringMatching(/unknown/),
      ruleTag: expect.any(String)
    });
    expect(noteByAction.get("send_to_calibration")).toMatchObject({
      reasonType: expect.stringMatching(/^(evidence_gap|audience_mismatch)$/),
      audience: expect.not.stringMatching(/unknown/),
      ruleTag: expect.any(String)
    });
    expect(noteByAction.get("reject")).toMatchObject({
      reasonType: "risk_update",
      audience: expect.not.stringMatching(/unknown/),
      ruleTag: expect.stringContaining("ADMIN_REJECT_")
    });
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

  it("can mark a correction as resolved and shows recovery state", async () => {
    const user = userEvent.setup();
    addCorrectionReport({
      activitySlug: "nanshan-ai-family-day",
      issueType: "链接失效",
      detail: "官方链接恢复",
      contact: "reader@example.com"
    });

    renderRoute(<App />, "/admin");

    await user.click(screen.getByRole("button", { name: "标记已解决" }));

    expect(screen.getByText("已标记纠错为解决状态，系统会部分恢复风险和信心")).toBeInTheDocument();
    expect(screen.getByText("已解决（部分恢复）")).toBeInTheDocument();
  });

  it("shows rule-update marker when scoring changed after rule version update", () => {
    const baseline = evaluateActivity(sampleActivities[0]);

    saveCandidateActivity({
      ...sampleActivities[0],
      id: "rule-update-admin-item",
      slug: "rule-update-admin-item",
      officialUrl: "https://example.com/rule-update-admin-item",
      candidateStatus: "evaluated",
      evaluation: {
        ...baseline,
        ruleVersion: "evaluation-rules-v0",
        totalScore: baseline.totalScore - 20,
        recommendationLevel: "caution",
        confidenceLevel: "low"
      },
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });
    reevaluateCandidatesForRuleVersionChange();

    renderRoute(<App />, "/admin");

    expect(screen.getAllByText("评分因规则更新发生变化")[0]).toBeInTheDocument();
  });

  it("shows hotspot section when calibration notes exist", () => {
    const now = Date.now();
    replaceCalibrationNotes([
      {
        id: "hotspot-1",
        activityId: "nanshan-ai-family-day",
        action: "send_to_calibration",
        note: "manual override",
        reasonType: "risk_update",
        audience: "family",
        ruleTag: "RULE_RISK",
        createdAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);

    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "近30天人工覆盖热点" })).toBeInTheDocument();
    expect(screen.getByText("近30天 0 次")).toBeInTheDocument();
    expect(screen.getByText("风险更新")).toBeInTheDocument();
    expect(screen.getByText("规则标签：RULE_RISK")).toBeInTheDocument();
    expect(screen.getByText(/趋势：↘\s*下降/)).toBeInTheDocument();
  });
});
