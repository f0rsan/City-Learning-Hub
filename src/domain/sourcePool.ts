import type { ActivitySource } from "./types";
import { readList, writeList } from "./localStore";

export type SourceHealth = "healthy" | "needs_review" | "failing";
export type SourceRuntimeMetrics = {
  sourceId: string;
  consecutiveFailures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastFailureReason?: string;
};

export type SourcePoolItem = ActivitySource & {
  city: "深圳";
  cadence: "daily" | "weekly" | "monthly";
  baseHealth: SourceHealth;
  health: SourceHealth;
  runtime: SourceRuntimeMetrics;
};

type BaseSourcePoolItem = Omit<SourcePoolItem, "health" | "runtime">;

const sourceRuntimeMetricsKey = "shenzhen-learning-hub:source-runtime-metrics";

export const SOURCE_HEALTH_THRESHOLDS = {
  staleToNeedsReviewDays: 21,
  staleToFailingDays: 45,
  failuresToNeedsReview: 2,
  failuresToFailing: 4
} as const;

const sourcePool: BaseSourcePoolItem[] = [
  {
    id: "nanshan-tech-museum",
    name: "南山科技馆",
    type: "venue",
    city: "深圳",
    url: "https://example.com/nanshan-tech",
    trustLevel: "high",
    lastChecked: "2026-05-08",
    cadence: "weekly",
    baseHealth: "healthy"
  },
  {
    id: "shenzhen-book-city",
    name: "深圳书城",
    type: "bookstore",
    city: "深圳",
    url: "https://example.com/shenzhen-book-city",
    trustLevel: "high",
    lastChecked: "2026-05-08",
    cadence: "weekly",
    baseHealth: "healthy"
  },
  {
    id: "tech-community",
    name: "深圳技术社区",
    type: "community",
    city: "深圳",
    url: "https://example.com/shenzhen-tech-community",
    trustLevel: "medium",
    lastChecked: "2026-05-08",
    cadence: "weekly",
    baseHealth: "needs_review"
  },
  {
    id: "shenzhen-conference-platform",
    name: "深圳会展活动平台",
    type: "conference-platform",
    city: "深圳",
    url: "https://example.com/shenzhen-conferences",
    trustLevel: "medium",
    lastChecked: "2026-05-08",
    cadence: "daily",
    baseHealth: "healthy"
  }
];

function defaultRuntimeMetrics(source: BaseSourcePoolItem): SourceRuntimeMetrics {
  return {
    sourceId: source.id,
    consecutiveFailures: 0,
    lastSuccessAt: `${source.lastChecked}T00:00:00.000Z`
  };
}

function healthRank(health: SourceHealth) {
  if (health === "healthy") {
    return 0;
  }

  if (health === "needs_review") {
    return 1;
  }

  return 2;
}

function maxHealth(left: SourceHealth, right: SourceHealth): SourceHealth {
  return healthRank(left) >= healthRank(right) ? left : right;
}

function daysBetween(olderIso: string, now: Date) {
  const older = new Date(olderIso);

  if (Number.isNaN(older.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const diffMs = now.getTime() - older.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function deriveHealth(baseHealth: SourceHealth, runtime: SourceRuntimeMetrics, now: Date): SourceHealth {
  let health = baseHealth;
  const daysSinceSuccess = runtime.lastSuccessAt ? daysBetween(runtime.lastSuccessAt, now) : Number.POSITIVE_INFINITY;

  if (runtime.consecutiveFailures >= SOURCE_HEALTH_THRESHOLDS.failuresToFailing || daysSinceSuccess >= SOURCE_HEALTH_THRESHOLDS.staleToFailingDays) {
    health = maxHealth(health, "failing");
  } else if (
    runtime.consecutiveFailures >= SOURCE_HEALTH_THRESHOLDS.failuresToNeedsReview ||
    daysSinceSuccess >= SOURCE_HEALTH_THRESHOLDS.staleToNeedsReviewDays
  ) {
    health = maxHealth(health, "needs_review");
  }

  return health;
}

function runtimeMetricsMap() {
  return new Map(getSourceRuntimeMetrics().map((metrics) => [metrics.sourceId, metrics]));
}

function writeRuntimeMetrics(metrics: SourceRuntimeMetrics[]) {
  writeList(sourceRuntimeMetricsKey, metrics);
}

function upsertRuntimeMetrics(sourceId: string, updater: (current: SourceRuntimeMetrics) => SourceRuntimeMetrics) {
  const all = getSourceRuntimeMetrics();
  const source = sourcePool.find((item) => item.id === sourceId);
  const fallback = source ? defaultRuntimeMetrics(source) : { sourceId, consecutiveFailures: 0 };
  const existing = all.find((entry) => entry.sourceId === sourceId);
  const next = updater(existing ?? fallback);
  const filtered = all.filter((entry) => entry.sourceId !== sourceId);
  writeRuntimeMetrics([...filtered, next]);
  return next;
}

export function getSourcePool() {
  const now = new Date();
  const metrics = runtimeMetricsMap();

  return sourcePool.map((source) => {
    const runtime = metrics.get(source.id) ?? defaultRuntimeMetrics(source);

    return {
      ...source,
      runtime,
      health: deriveHealth(source.baseHealth, runtime, now)
    };
  });
}

export function getSourceHealth() {
  return getSourcePool().map((source) => ({
    sourceId: source.id,
    name: source.name,
    health: source.health,
    baseHealth: source.baseHealth,
    lastChecked: source.lastChecked,
    consecutiveFailures: source.runtime.consecutiveFailures,
    lastSuccessAt: source.runtime.lastSuccessAt,
    lastFailureAt: source.runtime.lastFailureAt,
    lastFailureReason: source.runtime.lastFailureReason
  }));
}

export function getSourceRuntimeMetrics() {
  return readList<SourceRuntimeMetrics>(sourceRuntimeMetricsKey);
}

export function replaceSourceRuntimeMetrics(metrics: SourceRuntimeMetrics[]) {
  writeRuntimeMetrics(metrics);
}

export function recordSourceSuccess(sourceId: string, timestamp = new Date().toISOString()) {
  return upsertRuntimeMetrics(sourceId, (current) => ({
    ...current,
    sourceId,
    consecutiveFailures: 0,
    lastSuccessAt: timestamp
  }));
}

export function recordSourceFailure(sourceId: string, reason: string, timestamp = new Date().toISOString()) {
  return upsertRuntimeMetrics(sourceId, (current) => ({
    ...current,
    sourceId,
    consecutiveFailures: Math.max(0, current.consecutiveFailures) + 1,
    lastFailureAt: timestamp,
    lastFailureReason: reason
  }));
}

export function resetSourceRuntimeMetrics() {
  window.localStorage.removeItem(sourceRuntimeMetricsKey);
}
