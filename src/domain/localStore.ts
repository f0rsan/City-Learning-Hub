import type {
  CorrectionReport,
  CorrectionReportInput,
  SubmittedActivity,
  SubmittedActivityInput,
  SubmittedActivityStatus
} from "./types";

const submittedActivitiesKey = "shenzhen-learning-hub:submitted-activities";
const correctionReportsKey = "shenzhen-learning-hub:correction-reports";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readList<T>(key: string): T[] {
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

function writeList<T>(key: string, value: T[]) {
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

export function resetLocalHubData() {
  window.localStorage.removeItem(submittedActivitiesKey);
  window.localStorage.removeItem(correctionReportsKey);
}
