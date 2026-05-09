import { beforeEach, describe, expect, it } from "vitest";
import { exportHubData, importHubData } from "../../src/domain/exportImport";
import { addCorrectionReport, addSubmittedActivity, getSubmittedActivities, resetLocalHubData } from "../../src/domain/localStore";
import { resetCandidateData, saveCandidateActivity } from "../../src/domain/candidateStore";
import { sampleActivities } from "../../src/domain/sampleData";

describe("exportImport", () => {
  beforeEach(() => {
    resetLocalHubData();
    resetCandidateData();
  });

  it("exports candidates, evaluations, submissions, corrections, calibrations, and source health", () => {
    addSubmittedActivity({
      title: "导出测试活动",
      category: "技术大会",
      audience: ["adult"],
      dateText: "2026-05-20",
      district: "南山",
      venue: "测试场地",
      officialUrl: "https://example.com/export",
      contact: "export@example.com",
      note: "用于导出"
    });
    addCorrectionReport({
      activitySlug: "nanshan-ai-family-day",
      issueType: "链接失效",
      detail: "无法打开",
      contact: "reader@example.com"
    });
    saveCandidateActivity({
      ...sampleActivities[0],
      id: "export-candidate",
      slug: "export-candidate",
      officialUrl: "https://example.com/export-candidate",
      candidateStatus: "evaluated",
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    });

    const exported = exportHubData();

    expect(exported.candidates.length).toBeGreaterThan(0);
    expect(exported.evaluations.length).toBeGreaterThan(0);
    expect(exported.submissions.length).toBe(1);
    expect(exported.corrections.length).toBe(1);
    expect(exported.calibrations).toEqual(expect.any(Array));
    expect(exported.sourceHealth.length).toBeGreaterThan(0);
  });

  it("validates shape before importing", () => {
    expect(importHubData({ bad: "shape" })).toEqual({ ok: false, error: "导入数据格式不正确" });
  });

  it("imports valid local prototype data", () => {
    const exported = exportHubData();
    addSubmittedActivity({
      title: "会被导入覆盖的活动",
      category: "技术大会",
      audience: ["adult"],
      dateText: "2026-05-20",
      district: "南山",
      venue: "测试场地",
      officialUrl: "https://example.com/replace",
      contact: "replace@example.com",
      note: "用于导入"
    });

    const result = importHubData(exported);

    expect(result.ok).toBe(true);
    expect(getSubmittedActivities()).toEqual(exported.submissions);
  });
});
