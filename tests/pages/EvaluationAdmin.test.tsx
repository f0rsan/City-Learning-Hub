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
import { sampleActivities } from "../fixtures/sampleData";
import { renderRoute } from "../../src/test/render";

describe("EvaluationAdmin", () => {
  function authenticateAdmin() {
    window.sessionStorage.setItem("shenzhen-learning-hub:admin-authenticated", "true");
  }

  beforeEach(() => {
    window.sessionStorage.clear();
    resetLocalHubData();
    resetCandidateData();
    resetCalibrationData();
  });

  it("requires the admin password before showing the operation console", async () => {
    const user = userEvent.setup();
    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "后台登录" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "活动审核台" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("后台密码"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "进入后台" }));

    expect(screen.getByText("密码不正确")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "活动审核台" })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("后台密码"));
    await user.type(screen.getByLabelText("后台密码"), "2026@admin");
    await user.click(screen.getByRole("button", { name: "进入后台" }));

    expect(screen.getByRole("heading", { name: "活动审核台" })).toBeInTheDocument();
  });

  it("shows system recommendation, confidence, value reasons, and risk reasons", () => {
    authenticateAdmin();
    renderRoute(<App />, "/admin");

    expect(screen.getByRole("heading", { name: "活动审核台" })).toBeInTheDocument();
    expect(screen.getAllByText(/强推荐|值得考虑|谨慎选择|不建议前往/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/高可靠|可参考|待核对/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/看点/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/注意/)[0]).toBeInTheDocument();
  });

  it("can confirm, lower confidence, reject, or send to calibration", async () => {
    const user = userEvent.setup();
    authenticateAdmin();
    renderRoute(<App />, "/admin");

    await user.click(screen.getAllByRole("button", { name: /确认展示/ })[0]);
    expect(screen.getByText("已确认展示")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /降为待观察/ })[0]);
    expect(screen.getByText("已降为待观察")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /加入复核/ })[0]);
    expect(screen.getByText("已加入复核列表")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /不展示/ })[0]);
    expect(screen.getByText("已设为不展示")).toBeInTheDocument();

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
    authenticateAdmin();
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

    await user.click(screen.getByRole("button", { name: /转为待补充/ }));

    expect(screen.getByText("深圳机器人开放课")).toBeInTheDocument();
    expect(screen.getAllByText("待补充")[0]).toBeInTheDocument();
  });

  it("shows corrections that affect trust", () => {
    authenticateAdmin();
    addCorrectionReport({
      activitySlug: "nanshan-ai-family-day",
      issueType: "链接失效",
      detail: "官方页面无法打开",
      contact: "reader@example.com"
    });

    renderRoute(<App />, "/admin");

    expect(screen.getByText("待核对纠错")).toBeInTheDocument();
    expect(screen.getByText("官方页面无法打开")).toBeInTheDocument();
  });

  it("can mark a correction as resolved and shows recovery state", async () => {
    const user = userEvent.setup();
    authenticateAdmin();
    addCorrectionReport({
      activitySlug: "nanshan-ai-family-day",
      issueType: "链接失效",
      detail: "官方链接恢复",
      contact: "reader@example.com"
    });

    renderRoute(<App />, "/admin");

    await user.click(screen.getByRole("button", { name: "标记已解决" }));

    expect(screen.getByText("已标记为已核对，相关影响会部分恢复")).toBeInTheDocument();
    expect(screen.getByText("已核对（部分恢复）")).toBeInTheDocument();
  });

  it("shows rule-update marker when scoring changed after rule version update", () => {
    authenticateAdmin();
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

    expect(screen.getAllByText("规则更新后，结果有变化")[0]).toBeInTheDocument();
  });

  it("shows hotspot section when calibration notes exist", () => {
    authenticateAdmin();
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

    expect(screen.getByRole("heading", { name: "近30天复核集中在哪" })).toBeInTheDocument();
    expect(screen.getByText("近30天 0 次")).toBeInTheDocument();
    expect(screen.getByText("注意事项更新")).toBeInTheDocument();
    expect(screen.getByText("标签：RULE_RISK")).toBeInTheDocument();
    expect(screen.getByText(/趋势：↘\s*下降/)).toBeInTheDocument();
  });

  it("shows source collection groups in the admin source section", () => {
    authenticateAdmin();
    renderRoute(<App />, "/admin");

    expect(screen.getByText("自动更新：每 12 小时")).toBeInTheDocument();
    expect(screen.getByText("可直接自动采集")).toBeInTheDocument();
    expect(screen.getByText("半自动候选")).toBeInTheDocument();
    expect(screen.getByText("只做口碑信号")).toBeInTheDocument();
    expect(screen.getByText("深圳市少年宫主题活动")).toBeInTheDocument();
    expect(screen.getByText("Luma 深圳活动")).toBeInTheDocument();
    expect(screen.getByText("小红书深圳活动反馈")).toBeInTheDocument();
  });
});
