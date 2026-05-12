import type { Activity, Audience, TrustState } from "./types";

export function getPublishedActivities(activities: Activity[]) {
  return activities.filter((activity) => activity.status === "published");
}

export function getWeeklyFeatured(activities: Activity[]) {
  return getPublishedActivities(activities)
    .filter((activity) => activity.weeklyFeatured && getTrustState(activity).level !== "blocked")
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function filterByAudience(activities: Activity[], audience: Audience) {
  return getPublishedActivities(activities)
    .filter((activity) => activity.audience.includes(audience))
    .filter((activity) => (audience === "family" ? activity.childSafetyComplete : true))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function getActivityBySlug(activities: Activity[], slug: string) {
  return activities.find((activity) => activity.slug === slug);
}

export function getTrustState(activity: Activity): TrustState {
  if (activity.status === "cancelled") {
    return {
      level: "blocked",
      label: "活动已取消",
      message: "主办方已取消，请不要按原计划前往。"
    };
  }

  if (activity.status === "expired") {
    return {
      level: "warning",
      label: "活动已过期",
      message: "活动已结束，仅作为参考记录保留。"
    };
  }

  if (activity.status === "uncertain") {
    return {
      level: "warning",
      label: "信息待确认",
      message: "时间、地点或报名信息仍需确认，出发前请再核对。"
    };
  }

  if (activity.audience.includes("family") && !activity.childSafetyComplete) {
    return {
      level: "blocked",
      label: "亲子信息不足",
      message: "适龄或陪同信息不足，暂不建议作为亲子安排。"
    };
  }

  return {
    level: "clear",
    label: "信息已确认",
    message: `信息最后核对于 ${activity.lastConfirmedAt}。`
  };
}
