import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { createCandidateFromSubmission, resetCandidateData, saveCandidateActivity } from "../../src/domain/candidateStore";
import { evaluateActivity } from "../../src/domain/evaluationRules";
import { liveCollectedActivities } from "../../src/domain/liveActivities.generated";
import { addSubmittedActivity, resetLocalHubData } from "../../src/domain/localStore";
import { sampleActivities } from "../fixtures/sampleData";
import type { Activity } from "../../src/domain/types";
import { renderRoute } from "../../src/test/render";

describe("ActivityPage", () => {
  const collectedActivities: readonly Activity[] = liveCollectedActivities;
  const familyActivity = collectedActivities.find(
    (activity) => activity.status === "published" && activity.audience.includes("family")
  )!;

  beforeEach(() => {
    resetLocalHubData();
    resetCandidateData();
  });

  it("shows decision details before the official link", () => {
    renderRoute(<App />, `/activities/${familyActivity.slug}`);

    expect(screen.getByRole("heading", { name: familyActivity.title })).toBeInTheDocument();
    expect(screen.getByText("是否值得去")).toBeInTheDocument();
    expect(screen.getByText("参考依据")).toBeInTheDocument();
    expect(screen.getByText(/^来源$/)).toBeInTheDocument();
    expect(screen.getByText(/^组织方$/)).toBeInTheDocument();
    expect(screen.getByText(/^场地$/)).toBeInTheDocument();
    expect(screen.getAllByText(/高可靠|可参考|待核对/)[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "去活动页面报名" })).toBeInTheDocument();
  });

  it("shows a clear warning for cancelled activities", () => {
    const cancelledActivity = {
      ...sampleActivities[0],
      id: "cancelled-test-activity",
      slug: "cancelled-test-activity",
      title: "已取消活动",
      officialUrl: "https://activity.nslib.cn/activity/info/11423",
      status: "cancelled" as const,
      candidateStatus: "cancelled" as const,
      evaluation: evaluateActivity({ ...sampleActivities[0], status: "cancelled" }),
      createdAt: "2026-05-09T00:00:00.000Z",
      updatedAt: "2026-05-09T00:00:00.000Z"
    };
    saveCandidateActivity(cancelledActivity);

    renderRoute(<App />, "/activities/cancelled-test-activity");

    expect(screen.getAllByText("活动已取消")[0]).toBeInTheDocument();
    expect(screen.getByText(/请不要按原计划前往/)).toBeInTheDocument();
  });

  it("redirects unknown activities to the homepage", () => {
    renderRoute(<App />, "/activities/missing-activity");

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
  });

  it("does not expose draft candidates on public detail routes", () => {
    const submission = addSubmittedActivity({
      title: "内部待补充活动",
      category: "亲子科技",
      audience: ["family"],
      dateText: "周六 10:00",
      district: "南山",
      venue: "深圳湾",
      officialUrl: "https://activity.nslib.cn/activity/info/11423?draft=1",
      contact: "reader@city-learning.local",
      note: "还没核对完整"
    });
    const candidate = createCandidateFromSubmission(submission.id);

    renderRoute(<App />, `/activities/${candidate?.slug}`);

    expect(screen.getByRole("heading", { name: "深圳本周值得去" })).toBeInTheDocument();
    expect(screen.queryByText("内部待补充活动")).not.toBeInTheDocument();
  });

  it("collapses reasons and evidence by default on mobile and supports toggles", async () => {
    const user = userEvent.setup();
    const originalMatchMedia = window.matchMedia;

    try {
      window.matchMedia = ((query: string) =>
        ({
          matches: query === "(max-width: 860px)",
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false
        }) as MediaQueryList);

      renderRoute(<App />, `/activities/${familyActivity.slug}`);

      expect(screen.queryByRole("heading", { name: "适合谁" })).not.toBeInTheDocument();
      expect(screen.queryByText(/^来源$/)).not.toBeInTheDocument();
      const reasonsToggle = screen.getByRole("button", { name: "展开理由" });
      const evidenceToggle = screen.getByRole("button", { name: "查看核对信息" });

      expect(reasonsToggle).toHaveAttribute("aria-expanded", "false");
      expect(evidenceToggle).toHaveAttribute("aria-expanded", "false");
      expect(reasonsToggle).toHaveAttribute("aria-controls");
      expect(evidenceToggle).toHaveAttribute("aria-controls");

      await user.click(reasonsToggle);
      expect(screen.getByRole("heading", { name: "适合谁" })).toBeInTheDocument();
      expect(reasonsToggle).toHaveAttribute("aria-expanded", "true");

      await user.click(evidenceToggle);
      expect(screen.getByText(/^来源$/)).toBeInTheDocument();
      expect(evidenceToggle).toHaveAttribute("aria-expanded", "true");
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
