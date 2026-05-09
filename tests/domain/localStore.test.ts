import { beforeEach, describe, expect, it } from "vitest";
import {
  addCorrectionReport,
  addSubmittedActivity,
  getCorrectionReports,
  getSubmittedActivities,
  resetLocalHubData,
  updateSubmittedActivityStatus
} from "../../src/domain/localStore";

describe("localStore", () => {
  beforeEach(() => {
    resetLocalHubData();
  });

  it("stores submitted activities for editor review", () => {
    const saved = addSubmittedActivity({
      title: "周末机器人体验营",
      category: "亲子科技",
      audience: ["family"],
      dateText: "周六 10:00",
      district: "南山",
      venue: "深圳湾",
      officialUrl: "https://example.com/robot",
      contact: "organizer@example.com",
      note: "适合小学家庭"
    });

    expect(saved.status).toBe("pending");
    expect(getSubmittedActivities()).toEqual([saved]);
  });

  it("updates the review status of a submitted activity", () => {
    const saved = addSubmittedActivity({
      title: "硬件开放日",
      category: "科技展会",
      audience: ["adult"],
      dateText: "周日 14:00",
      district: "福田",
      venue: "深业上城",
      officialUrl: "https://example.com/hardware",
      contact: "maker@example.com",
      note: "偏成人"
    });

    updateSubmittedActivityStatus(saved.id, "approved");

    expect(getSubmittedActivities()[0].status).toBe("approved");
  });

  it("stores correction reports separately", () => {
    const report = addCorrectionReport({
      activitySlug: "nanshan-ai-family-day",
      issueType: "时间变更",
      detail: "主办方页面显示改到周日",
      contact: "reader@example.com"
    });

    expect(report.status).toBe("open");
    expect(getCorrectionReports()).toEqual([report]);
  });
});
