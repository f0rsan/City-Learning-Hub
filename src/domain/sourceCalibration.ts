import type { ActivitySource } from "./types";

export type SourceCalibrationOverride = Pick<ActivitySource, "trustLevel"> & {
  signalWeight: number;
  calibratedAt: string;
  sampleSize: number;
};

export const sourceCalibrationOverrides: Record<string, SourceCalibrationOverride> = {
  "eventbrite-shenzhen": {
    trustLevel: "unverified",
    signalWeight: 0.97,
    calibratedAt: "2026-05-11",
    sampleSize: 64
  },
  "douban-shenzhen": {
    trustLevel: "high",
    signalWeight: 1.31,
    calibratedAt: "2026-05-11",
    sampleSize: 347
  },
  "lianpu-tech-events": {
    trustLevel: "unverified",
    signalWeight: 0.99,
    calibratedAt: "2026-05-11",
    sampleSize: 200
  },
  "huodongxing-shenzhen": {
    trustLevel: "high",
    signalWeight: 1.29,
    calibratedAt: "2026-05-11",
    sampleSize: 84
  },
  "meetup-shenzhen": {
    trustLevel: "unverified",
    signalWeight: 1,
    calibratedAt: "2026-05-11",
    sampleSize: 48
  },
  "nanshan-library-activities": {
    trustLevel: "high",
    signalWeight: 1.27,
    calibratedAt: "2026-05-11",
    sampleSize: 60
  },
  "luohu-library-events": {
    trustLevel: "medium",
    signalWeight: 1.25,
    calibratedAt: "2026-05-11",
    sampleSize: 36
  },
  "szu-library-events": {
    trustLevel: "high",
    signalWeight: 1.29,
    calibratedAt: "2026-05-11",
    sampleSize: 200
  },
  "ites-meetings": {
    trustLevel: "medium",
    signalWeight: 1.22,
    calibratedAt: "2026-05-11",
    sampleSize: 32
  },
  "szwen-cultural-events": {
    trustLevel: "high",
    signalWeight: 1.29,
    calibratedAt: "2026-05-11",
    sampleSize: 132
  }
};
