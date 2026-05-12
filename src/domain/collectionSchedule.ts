import type { SourceCollectionMode } from "./types";

export const COLLECTION_AUTOMATION_CRON = "0 */12 * * *";

export const PREVIOUS_COLLECTION_INTERVAL_HOURS = {
  auto: 24,
  candidate: 24,
  reputation: 168
} as const satisfies Record<SourceCollectionMode, number>;

export const COLLECTION_INTERVAL_HOURS = {
  auto: 12,
  candidate: 12,
  reputation: 84
} as const satisfies Record<SourceCollectionMode, number>;

export function getCollectionIntervalHours(mode: SourceCollectionMode) {
  return COLLECTION_INTERVAL_HOURS[mode];
}

export function isCollectionDue(mode: SourceCollectionMode, lastCollectedAt?: string, now = new Date()) {
  if (!lastCollectedAt) {
    return true;
  }

  const lastCollected = new Date(lastCollectedAt);

  if (Number.isNaN(lastCollected.getTime())) {
    return true;
  }

  const elapsedHours = (now.getTime() - lastCollected.getTime()) / (60 * 60 * 1000);
  return elapsedHours >= getCollectionIntervalHours(mode);
}
