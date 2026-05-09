import { beforeEach, describe, expect, it } from "vitest";
import {
  getCalibrationHotspots,
  getCalibrationNotes,
  replaceCalibrationNotes,
  resetCalibrationData
} from "../../src/domain/calibrationStore";
import type { CalibrationNote } from "../../src/domain/evaluationTypes";

const fixedNow = new Date("2026-05-31T00:00:00.000Z");

function makeNote(
  id: string,
  reasonType: CalibrationNote["reasonType"],
  createdAt: string,
  ruleTag?: string
): CalibrationNote {
  return {
    id,
    activityId: `activity-${id}`,
    action: "send_to_calibration",
    note: "manual override",
    reasonType,
    audience: "unknown",
    ruleTag,
    createdAt
  };
}

describe("calibrationStore hotspots", () => {
  beforeEach(() => {
    resetCalibrationData();
  });

  it("keeps backward compatibility for legacy notes", () => {
    replaceCalibrationNotes([
      {
        id: "legacy-note",
        activityId: "legacy-activity",
        action: "confirm",
        note: "legacy note",
        createdAt: "2026-05-20T00:00:00.000Z"
      } as CalibrationNote
    ]);

    expect(getCalibrationNotes()[0]).toMatchObject({
      reasonType: "other",
      audience: "unknown",
      ruleTag: undefined
    });
  });

  it("computes last-30-day hotspots with trends vs previous 30 days", () => {
    replaceCalibrationNotes([
      makeNote("1", "risk_update", "2026-05-10T00:00:00.000Z", "RULE_A"),
      makeNote("2", "risk_update", "2026-05-18T00:00:00.000Z", "RULE_A"),
      makeNote("3", "risk_update", "2026-04-15T00:00:00.000Z", "RULE_A"),
      makeNote("4", "evidence_gap", "2026-05-08T00:00:00.000Z"),
      makeNote("5", "evidence_gap", "2026-04-03T00:00:00.000Z"),
      makeNote("6", "evidence_gap", "2026-04-06T00:00:00.000Z"),
      makeNote("7", "evidence_gap", "2026-04-20T00:00:00.000Z"),
      makeNote("8", "other", "2026-05-01T00:00:00.000Z", "RULE_B"),
      makeNote("9", "other", "2026-05-27T00:00:00.000Z", "RULE_B"),
      makeNote("10", "other", "2026-04-01T00:00:00.000Z", "RULE_B"),
      makeNote("11", "other", "2026-04-05T00:00:00.000Z", "RULE_B"),
      makeNote("12", "rule_exception", "2026-03-20T00:00:00.000Z", "OUT_OF_WINDOW"),
      makeNote("13", "rule_exception", "2026-06-01T00:00:00.000Z", "FUTURE_NOTE")
    ]);

    const hotspots = getCalibrationHotspots({ topN: 5, now: fixedNow });
    const riskUpdate = hotspots.find((item) => item.reasonType === "risk_update");
    const evidenceGap = hotspots.find((item) => item.reasonType === "evidence_gap");
    const ruleB = hotspots.find((item) => item.reasonType === "other" && item.ruleTag === "RULE_B");

    expect(hotspots).toHaveLength(3);
    expect(riskUpdate).toMatchObject({ currentCount: 2, previousCount: 1, trend: "up", ruleTag: "RULE_A" });
    expect(evidenceGap).toMatchObject({ currentCount: 1, previousCount: 3, trend: "down", ruleTag: undefined });
    expect(ruleB).toMatchObject({ currentCount: 2, previousCount: 2, trend: "flat" });
  });

  it("includes groups that dropped to zero from the previous 30-day window", () => {
    replaceCalibrationNotes([
      makeNote("current-a1", "risk_update", "2026-05-10T00:00:00.000Z", "RULE_A"),
      makeNote("previous-b1", "audience_mismatch", "2026-04-10T00:00:00.000Z", "RULE_B")
    ]);

    const hotspots = getCalibrationHotspots({ topN: 5, now: fixedNow });
    const dropped = hotspots.find((item) => item.reasonType === "audience_mismatch" && item.ruleTag === "RULE_B");

    expect(dropped).toMatchObject({
      currentCount: 0,
      previousCount: 1,
      trend: "down"
    });
  });

  it("handles exact window cutoffs deterministically", () => {
    replaceCalibrationNotes([
      makeNote("current-boundary", "risk_update", "2026-05-01T00:00:00.000Z", "BOUNDARY"),
      makeNote("previous-boundary", "risk_update", "2026-04-01T00:00:00.000Z", "BOUNDARY"),
      makeNote("out-of-window", "risk_update", "2026-03-31T23:59:59.999Z", "BOUNDARY")
    ]);

    const hotspots = getCalibrationHotspots({ topN: 5, now: fixedNow });
    expect(hotspots).toHaveLength(1);
    expect(hotspots[0]).toMatchObject({
      reasonType: "risk_update",
      ruleTag: "BOUNDARY",
      currentCount: 1,
      previousCount: 1,
      trend: "flat"
    });
  });

  it("applies topN to hotspot output", () => {
    replaceCalibrationNotes([
      makeNote("a1", "risk_update", "2026-05-10T00:00:00.000Z", "A"),
      makeNote("a2", "risk_update", "2026-05-12T00:00:00.000Z", "A"),
      makeNote("b1", "evidence_gap", "2026-05-11T00:00:00.000Z", "B"),
      makeNote("c1", "rule_exception", "2026-05-14T00:00:00.000Z", "C")
    ]);

    const hotspots = getCalibrationHotspots({ topN: 2, now: fixedNow });
    expect(hotspots).toHaveLength(2);
    expect(hotspots[0]).toMatchObject({ reasonType: "risk_update", currentCount: 2, ruleTag: "A" });
  });
});
