import { describe, expect, it } from "vitest";
import {
  filterByAudience,
  getActivityBySlug,
  getPublishedActivities,
  getReferenceActivities,
  getTrustState,
  getWeeklyFeatured
} from "../../src/domain/activitySelectors";
import { sampleActivities } from "../fixtures/sampleData";

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
    expect(featured.every((activity) => activity.publicListingTier === "featured")).toBe(true);
  });

  it("opens high-quality reference activities without mixing them into weekly featured", () => {
    const reference = getReferenceActivities(sampleActivities);
    const featured = getWeeklyFeatured(sampleActivities);

    expect(reference.map((activity) => activity.slug)).toContain("reference-ai-salon");
    expect(featured.map((activity) => activity.slug)).not.toContain("reference-ai-salon");
    expect(reference.every((activity) => activity.publicListingTier === "reference")).toBe(true);
  });

  it("does not show a reference activity when the same title is already featured", () => {
    const duplicateReference = {
      ...sampleActivities[0],
      id: "duplicate-reference",
      slug: "duplicate-reference",
      status: "uncertain" as const,
      weeklyFeatured: false,
      publicListingTier: "reference" as const,
      publicScore: 99
    };

    const reference = getReferenceActivities([...sampleActivities, duplicateReference]);

    expect(reference.map((activity) => activity.slug)).not.toContain("duplicate-reference");
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

  it("marks unclear event time as needing time verification instead of confirmed", () => {
    const activity = getActivityBySlug(sampleActivities, "reference-ai-salon");

    expect(activity).toBeDefined();
    expect(getTrustState(activity!).label).toBe("时间待核对");
  });
});
