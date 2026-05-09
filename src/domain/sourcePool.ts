import type { ActivitySource } from "./types";

export type SourcePoolItem = ActivitySource & {
  city: "深圳";
  cadence: "daily" | "weekly" | "monthly";
  health: "healthy" | "needs_review" | "failing";
  lastFailureReason?: string;
};

const sourcePool: SourcePoolItem[] = [
  {
    id: "nanshan-tech-museum",
    name: "南山科技馆",
    type: "venue",
    city: "深圳",
    url: "https://example.com/nanshan-tech",
    trustLevel: "high",
    lastChecked: "2026-05-08",
    cadence: "weekly",
    health: "healthy"
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
    health: "healthy"
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
    health: "needs_review"
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
    health: "healthy"
  }
];

export function getSourcePool() {
  return sourcePool;
}

export function getSourceHealth() {
  return getSourcePool().map((source) => ({
    sourceId: source.id,
    name: source.name,
    health: source.health,
    lastChecked: source.lastChecked,
    lastFailureReason: source.lastFailureReason
  }));
}
