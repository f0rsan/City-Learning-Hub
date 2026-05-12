import { describe, expect, it } from "vitest";
import {
  COLLECTION_AUTOMATION_CRON,
  COLLECTION_INTERVAL_HOURS,
  PREVIOUS_COLLECTION_INTERVAL_HOURS,
  getCollectionIntervalHours,
  isCollectionDue
} from "../../src/domain/collectionSchedule";

describe("collectionSchedule", () => {
  it("cuts the previous collection interval in half", () => {
    expect(COLLECTION_AUTOMATION_CRON).toBe("0 */12 * * *");
    expect(COLLECTION_INTERVAL_HOURS.auto).toBe(PREVIOUS_COLLECTION_INTERVAL_HOURS.auto / 2);
    expect(COLLECTION_INTERVAL_HOURS.candidate).toBe(PREVIOUS_COLLECTION_INTERVAL_HOURS.candidate / 2);
    expect(COLLECTION_INTERVAL_HOURS.reputation).toBe(PREVIOUS_COLLECTION_INTERVAL_HOURS.reputation / 2);
  });

  it("checks whether a source is due by its collection mode", () => {
    const now = new Date("2026-05-12T12:00:00+08:00");

    expect(isCollectionDue("auto", "2026-05-12T00:00:00+08:00", now)).toBe(true);
    expect(isCollectionDue("auto", "2026-05-12T06:30:00+08:00", now)).toBe(false);
    expect(getCollectionIntervalHours("candidate")).toBe(12);
  });
});
