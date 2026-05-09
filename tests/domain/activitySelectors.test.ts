import { describe, expect, it } from "vitest";
import {
  filterByAudience,
  getActivityBySlug,
  getPublishedActivities,
  getTrustState,
  getWeeklyFeatured
} from "../../src/domain/activitySelectors";
import { sampleActivities } from "../../src/domain/sampleData";

describe("activity selectors", () => {
  it("returns only published activities for public pages", () => {
    const visible = getPublishedActivities(sampleActivities);
    expect(visible.every((activity) => activity.status === "published")).toBe(true);
  });

  it("keeps weekly featured activities curated and current", () => {
    const featured = getWeeklyFeatured(sampleActivities);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    expect(featured.every((activity) => activity.weeklyFeatured)).toBe(true);
    expect(featured.every((activity) => activity.status === "published")).toBe(true);
  });

  it("filters activities for parent-child and adult entry points", () => {
    expect(
      filterByAudience(sampleActivities, "family").every((activity) => activity.audience.includes("family"))
    ).toBe(true);
    expect(filterByAudience(sampleActivities, "adult").every((activity) => activity.audience.includes("adult"))).toBe(
      true
    );
  });

  it("finds an activity by slug", () => {
    const activity = getActivityBySlug(sampleActivities, "nanshan-ai-family-day");
    expect(activity?.title).toBe("南山 AI 互动体验日");
  });

  it("marks weak child information as not ready for family curation", () => {
    const activity = getActivityBySlug(sampleActivities, "child-safety-weak-sample");
    expect(activity).toBeDefined();
    expect(getTrustState(activity!).level).toBe("blocked");
  });
});
