import type {
  CorrectionReport,
  CorrectionReportInput,
  SubmittedActivity,
  SubmittedActivityInput,
  SubmittedActivityStatus
} from "./types";
import type { CorrectionImpact } from "./evaluationTypes";

export const submittedActivitiesKey = "shenzhen-learning-hub:submitted-activities";
export const correctionReportsKey = "shenzhen-learning-hub:correction-reports";

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readList<T>(key: string): T[] {
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeList<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSubmittedActivities() {
  return readList<SubmittedActivity>(submittedActivitiesKey);
}

export function addSubmittedActivity(input: SubmittedActivityInput): SubmittedActivity {
  const next: SubmittedActivity = {
    ...input,
    id: createId("submission"),
    status: "pending",
    createdAt: new Date().toISOString()
  };

  writeList(submittedActivitiesKey, [next, ...getSubmittedActivities()]);
  return next;
}

export function updateSubmittedActivityStatus(id: string, status: SubmittedActivityStatus) {
  const updated = getSubmittedActivities().map((activity) =>
    activity.id === id ? { ...activity, status } : activity
  );

  writeList(submittedActivitiesKey, updated);
  return updated.find((activity) => activity.id === id);
}

export function getCorrectionReports() {
  return readList<CorrectionReport>(correctionReportsKey);
}

export function replaceSubmittedActivities(value: SubmittedActivity[]) {
  writeList(submittedActivitiesKey, value);
}

export function replaceCorrectionReports(value: CorrectionReport[]) {
  writeList(correctionReportsKey, value);
}

export function addCorrectionReport(input: CorrectionReportInput): CorrectionReport {
  const next: CorrectionReport = {
    ...input,
    id: createId("correction"),
    status: "open",
    createdAt: new Date().toISOString()
  };

  writeList(correctionReportsKey, [next, ...getCorrectionReports()]);
  return next;
}

export function getCorrectionImpacts(): CorrectionImpact[] {
  return getCorrectionReports().map((report) => {
    if (report.issueType === "活动取消") {
      return {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        riskDelta: 30,
        confidenceDelta: -30,
        reason: "活动取消"
      };
    }

    if (report.issueType === "链接失效") {
      return {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        riskDelta: 12,
        confidenceDelta: -20,
        reason: "官方链接失效，来源信心下降"
      };
    }

    if (report.issueType === "时间变更" || report.issueType === "地点变更") {
      return {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        riskDelta: 8,
        confidenceDelta: -12,
        reason: `${report.issueType}，需要重新确认`
      };
    }

    return {
      activitySlug: report.activitySlug,
      issueType: report.issueType,
      riskDelta: 6,
      confidenceDelta: -8,
      reason: "补充信息会降低当前判断信心，直到复核完成"
    };
  });
}

export function resetLocalHubData() {
  window.localStorage.removeItem(submittedActivitiesKey);
  window.localStorage.removeItem(correctionReportsKey);
}
