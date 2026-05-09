import type {
  CalibrationAction,
  CalibrationAudience,
  CalibrationNote,
  CalibrationReasonType,
  CandidateActivity
} from "./evaluationTypes";
import { createId, readList, writeList } from "./localStore";

const calibrationNotesKey = "shenzhen-learning-hub:calibration-notes";
const dayMs = 24 * 60 * 60 * 1000;
const windowDays = 30;
const defaultReasonType: CalibrationReasonType = "other";
const defaultAudience: CalibrationAudience = "unknown";

const actionMessages: Record<CalibrationAction, string> = {
  confirm: "已确认系统判断",
  lower_confidence: "已降低信心，等待更多证据",
  reject: "已拒绝推荐",
  send_to_calibration: "已送入人工校准"
};

type CalibrationMetadata = {
  reasonType?: CalibrationReasonType;
  audience?: CalibrationAudience;
  ruleTag?: string;
};

type CalibrationHotspotKey = `${CalibrationReasonType}::${string}`;
export type CalibrationHotspotTrend = "up" | "down" | "flat";
export type CalibrationHotspot = {
  reasonType: CalibrationReasonType;
  ruleTag?: string;
  currentCount: number;
  previousCount: number;
  trend: CalibrationHotspotTrend;
};

function normalizeRuleTag(ruleTag?: string) {
  const value = ruleTag?.trim();
  return value ? value : undefined;
}

function normalizeCalibrationNote(note: CalibrationNote | (Omit<CalibrationNote, "reasonType" | "audience"> & CalibrationMetadata)) {
  return {
    ...note,
    reasonType: note.reasonType ?? defaultReasonType,
    audience: note.audience ?? defaultAudience,
    ruleTag: normalizeRuleTag(note.ruleTag)
  };
}

export function getCalibrationNotes() {
  return readList<CalibrationNote>(calibrationNotesKey).map(normalizeCalibrationNote);
}

export function addCalibrationNote(
  activityId: string,
  action: CalibrationAction,
  note = actionMessages[action],
  metadata: CalibrationMetadata = {}
) {
  const next = normalizeCalibrationNote({
    id: createId("calibration"),
    activityId,
    action,
    note,
    reasonType: metadata.reasonType,
    audience: metadata.audience,
    ruleTag: metadata.ruleTag,
    createdAt: new Date().toISOString()
  });

  writeList(calibrationNotesKey, [next, ...getCalibrationNotes()]);
  return next;
}

function deriveCalibrationAudience(activity: CandidateActivity): CalibrationAudience {
  const includesFamily = activity.audience.includes("family");
  const includesAdult = activity.audience.includes("adult");

  if (includesFamily && includesAdult) {
    return "both";
  }

  if (includesFamily) {
    return "family";
  }

  if (includesAdult) {
    return "adult";
  }

  return "unknown";
}

function hasAudienceMismatch(activity: CandidateActivity) {
  const familyBlocked =
    activity.audience.includes("family") && activity.evaluation?.audienceFit.family?.level === "blocked";
  const adultBlocked =
    activity.audience.includes("adult") && activity.evaluation?.audienceFit.adult?.level === "blocked";
  return familyBlocked || adultBlocked;
}

export function buildCalibrationMetadata(activity: CandidateActivity, action: CalibrationAction): CalibrationMetadata {
  const audience = deriveCalibrationAudience(activity);

  if (action === "confirm") {
    return {
      reasonType: "rule_exception",
      audience,
      ruleTag: `ADMIN_CONFIRM_${activity.evaluation?.recommendationLevel ?? "review"}`
    };
  }

  if (action === "lower_confidence") {
    return {
      reasonType: "evidence_gap",
      audience,
      ruleTag:
        activity.evaluation?.confidenceLevel === "low"
          ? "LOW_CONFIDENCE_RECHECK"
          : "MANUAL_CONFIDENCE_DOWNGRADE"
    };
  }

  if (action === "reject") {
    return {
      reasonType: "risk_update",
      audience,
      ruleTag: `ADMIN_REJECT_${activity.evaluation?.recommendationLevel ?? "review"}`
    };
  }

  return {
    reasonType: hasAudienceMismatch(activity) ? "audience_mismatch" : "evidence_gap",
    audience,
    ruleTag: hasAudienceMismatch(activity) ? "AUDIENCE_FIT_CONFLICT" : "MANUAL_CALIBRATION_QUEUE"
  };
}

export function getCalibrationMessage(action: CalibrationAction) {
  return actionMessages[action];
}

export function replaceCalibrationNotes(notes: CalibrationNote[]) {
  writeList(calibrationNotesKey, notes.map(normalizeCalibrationNote));
}

export function resetCalibrationData() {
  window.localStorage.removeItem(calibrationNotesKey);
}

function getHotspotKey(reasonType: CalibrationReasonType, ruleTag?: string): CalibrationHotspotKey {
  return `${reasonType}::${ruleTag ?? ""}`;
}

function getTrend(currentCount: number, previousCount: number): CalibrationHotspotTrend {
  if (currentCount > previousCount) {
    return "up";
  }

  if (currentCount < previousCount) {
    return "down";
  }

  return "flat";
}

type CalibrationHotspotParams = {
  topN?: number;
  now?: Date;
};

export function getCalibrationHotspots({ topN = 5, now = new Date() }: CalibrationHotspotParams = {}) {
  const currentWindowStart = now.getTime() - windowDays * dayMs;
  const previousWindowStart = currentWindowStart - windowDays * dayMs;
  const hotspotCounts = new Map<
    CalibrationHotspotKey,
    Pick<CalibrationHotspot, "reasonType" | "ruleTag" | "currentCount" | "previousCount">
  >();

  getCalibrationNotes().forEach((note) => {
    const createdAtMs = new Date(note.createdAt).getTime();

    if (Number.isNaN(createdAtMs) || createdAtMs > now.getTime() || createdAtMs < previousWindowStart) {
      return;
    }

    const key = getHotspotKey(note.reasonType, note.ruleTag);
    const existing = hotspotCounts.get(key) ?? {
      reasonType: note.reasonType,
      ruleTag: note.ruleTag,
      currentCount: 0,
      previousCount: 0
    };

    if (createdAtMs >= currentWindowStart) {
      existing.currentCount += 1;
      hotspotCounts.set(key, existing);
      return;
    }

    existing.previousCount += 1;
    hotspotCounts.set(key, existing);
  });

  return [...hotspotCounts.values()]
    .map((item) => {
      return {
        ...item,
        trend: getTrend(item.currentCount, item.previousCount)
      };
    })
    .sort((a, b) => {
      const aPeakCount = Math.max(a.currentCount, a.previousCount);
      const bPeakCount = Math.max(b.currentCount, b.previousCount);
      if (bPeakCount !== aPeakCount) {
        return bPeakCount - aPeakCount;
      }
      if (b.currentCount !== a.currentCount) {
        return b.currentCount - a.currentCount;
      }
      if (b.previousCount !== a.previousCount) {
        return b.previousCount - a.previousCount;
      }
      if (a.reasonType !== b.reasonType) {
        return a.reasonType.localeCompare(b.reasonType);
      }
      return (a.ruleTag ?? "").localeCompare(b.ruleTag ?? "");
    })
    .slice(0, Math.max(0, topN));
}
