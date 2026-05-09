import {
  getCandidateActivities,
  replaceCandidateActivities
} from "./candidateStore";
import { getCalibrationNotes, replaceCalibrationNotes } from "./calibrationStore";
import { getCollectionRuns, replaceCollectionRuns } from "./collectionQueue";
import {
  getCorrectionReports,
  getSubmittedActivities,
  replaceCorrectionReports,
  replaceSubmittedActivities
} from "./localStore";
import {
  getSourceHealth,
  getSourceRuntimeMetrics,
  replaceSourceRuntimeMetrics,
  type SourceRuntimeMetrics
} from "./sourcePool";
import type { CandidateActivity } from "./evaluationTypes";
import type { CorrectionReport, SubmittedActivity } from "./types";

export type HubExportData = {
  version: 1;
  exportedAt: string;
  candidates: CandidateActivity[];
  evaluations: NonNullable<CandidateActivity["evaluation"]>[];
  submissions: SubmittedActivity[];
  corrections: CorrectionReport[];
  calibrations: ReturnType<typeof getCalibrationNotes>;
  collectionRuns: ReturnType<typeof getCollectionRuns>;
  sourceHealth: ReturnType<typeof getSourceHealth>;
  sourceRuntimeMetrics: ReturnType<typeof getSourceRuntimeMetrics>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringOrUndefined(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isSourceRuntimeMetric(value: unknown): value is SourceRuntimeMetrics {
  if (!isObject(value)) {
    return false;
  }

  if (typeof value.sourceId !== "string" || value.sourceId.trim().length === 0) {
    return false;
  }

  if (typeof value.consecutiveFailures !== "number" || !Number.isInteger(value.consecutiveFailures) || value.consecutiveFailures < 0) {
    return false;
  }

  return (
    isStringOrUndefined(value.lastSuccessAt) &&
    isStringOrUndefined(value.lastFailureAt) &&
    isStringOrUndefined(value.lastFailureReason)
  );
}

export function exportHubData(): HubExportData {
  const candidates = getCandidateActivities();

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    candidates,
    evaluations: candidates.map((candidate) => candidate.evaluation).filter(Boolean) as NonNullable<
      CandidateActivity["evaluation"]
    >[],
    submissions: getSubmittedActivities(),
    corrections: getCorrectionReports(),
    calibrations: getCalibrationNotes(),
    collectionRuns: getCollectionRuns(),
    sourceHealth: getSourceHealth(),
    sourceRuntimeMetrics: getSourceRuntimeMetrics()
  };
}

export function importHubData(data: unknown): { ok: true } | { ok: false; error: string } {
  if (
    !isObject(data) ||
    data.version !== 1 ||
    !Array.isArray(data.candidates) ||
    !Array.isArray(data.submissions) ||
    !Array.isArray(data.corrections) ||
    !Array.isArray(data.calibrations) ||
    !Array.isArray(data.collectionRuns)
  ) {
    return { ok: false, error: "导入数据格式不正确" };
  }

  const sourceRuntimeMetricsCandidate = data.sourceRuntimeMetrics;
  const sourceRuntimeMetricsRaw: unknown = sourceRuntimeMetricsCandidate === undefined ? [] : sourceRuntimeMetricsCandidate;

  if (!Array.isArray(sourceRuntimeMetricsRaw) || !sourceRuntimeMetricsRaw.every(isSourceRuntimeMetric)) {
    return { ok: false, error: "sourceRuntimeMetrics 格式不正确" };
  }
  const sourceRuntimeMetrics = sourceRuntimeMetricsRaw as SourceRuntimeMetrics[];

  replaceCandidateActivities(data.candidates as CandidateActivity[]);
  replaceSubmittedActivities(data.submissions as SubmittedActivity[]);
  replaceCorrectionReports(data.corrections as CorrectionReport[]);
  replaceCalibrationNotes(data.calibrations as HubExportData["calibrations"]);
  replaceCollectionRuns(data.collectionRuns as HubExportData["collectionRuns"]);
  replaceSourceRuntimeMetrics(sourceRuntimeMetrics);

  return { ok: true };
}
