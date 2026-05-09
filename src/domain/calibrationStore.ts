import type { CalibrationAction, CalibrationNote } from "./evaluationTypes";
import { createId, readList, writeList } from "./localStore";

const calibrationNotesKey = "shenzhen-learning-hub:calibration-notes";

const actionMessages: Record<CalibrationAction, string> = {
  confirm: "已确认系统判断",
  lower_confidence: "已降低信心，等待更多证据",
  reject: "已拒绝推荐",
  send_to_calibration: "已送入人工校准"
};

export function getCalibrationNotes() {
  return readList<CalibrationNote>(calibrationNotesKey);
}

export function addCalibrationNote(activityId: string, action: CalibrationAction, note = actionMessages[action]) {
  const next: CalibrationNote = {
    id: createId("calibration"),
    activityId,
    action,
    note,
    createdAt: new Date().toISOString()
  };

  writeList(calibrationNotesKey, [next, ...getCalibrationNotes()]);
  return next;
}

export function getCalibrationMessage(action: CalibrationAction) {
  return actionMessages[action];
}

export function replaceCalibrationNotes(notes: CalibrationNote[]) {
  writeList(calibrationNotesKey, notes);
}

export function resetCalibrationData() {
  window.localStorage.removeItem(calibrationNotesKey);
}
