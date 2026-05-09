import type {
  CorrectionReport,
  CorrectionReportInput,
  SubmittedActivity,
  SubmittedActivityInput,
  CorrectionReportStatus,
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

export function updateCorrectionReportStatus(id: string, status: CorrectionReportStatus) {
  const updated = getCorrectionReports().map((report) => {
    if (report.id !== id) {
      return report;
    }

    return {
      ...report,
      status,
      resolvedAt: status === "resolved" ? new Date().toISOString() : undefined
    };
  });

  writeList(correctionReportsKey, updated);
  return updated.find((report) => report.id === id);
}

const resolvedRecoveryRatio = 0.4;

function withResolvedRecovery(base: Omit<CorrectionImpact, "reason">, issueType: string): CorrectionImpact {
  const riskDelta = Math.max(1, Math.round(base.riskDelta * resolvedRecoveryRatio));
  const confidenceDelta = Math.min(-1, Math.round(base.confidenceDelta * resolvedRecoveryRatio));

  return {
    ...base,
    riskDelta,
    confidenceDelta,
    reason: `${issueType}已处理，风险和信心惩罚部分恢复`
  };
}

export function getCorrectionImpacts(): CorrectionImpact[] {
  return getCorrectionReports().map((report) => {
    let baseImpact: Omit<CorrectionImpact, "reason">;

    if (report.issueType === "活动取消") {
      baseImpact = {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        isResolved: false,
        riskDelta: 30,
        confidenceDelta: -30
      };
    } else if (report.issueType === "链接失效") {
      baseImpact = {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        isResolved: false,
        riskDelta: 12,
        confidenceDelta: -20
      };
    } else if (report.issueType === "时间变更" || report.issueType === "地点变更") {
      baseImpact = {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        isResolved: false,
        riskDelta: 8,
        confidenceDelta: -12
      };
    } else {
      baseImpact = {
        activitySlug: report.activitySlug,
        issueType: report.issueType,
        isResolved: false,
        riskDelta: 6,
        confidenceDelta: -8
      };
    }

    if (report.status === "resolved") {
      return withResolvedRecovery({ ...baseImpact, isResolved: true }, report.issueType);
    }

    if (report.issueType === "活动取消") {
      return { ...baseImpact, reason: "活动取消，纠错未解决，风险最高" };
    }

    if (report.issueType === "链接失效") {
      return { ...baseImpact, reason: "官方链接失效，纠错未解决，来源信心下降" };
    }

    if (report.issueType === "时间变更" || report.issueType === "地点变更") {
      return { ...baseImpact, reason: `${report.issueType}，纠错未解决，需要重新确认` };
    }

    return { ...baseImpact, reason: "补充信息会降低当前判断信心，直到纠错解决" };
  });
}

export function resetLocalHubData() {
  window.localStorage.removeItem(submittedActivitiesKey);
  window.localStorage.removeItem(correctionReportsKey);
}
