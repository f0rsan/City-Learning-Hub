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
      message: "这个活动不能进入本周精选，详情页需要提示用户不要前往。"
    };
  }

  if (activity.status === "expired") {
    return {
      level: "warning",
      label: "活动已过期",
      message: "这个活动可以保留在过期记录中，但不能出现在本周精选。"
    };
  }

  if (activity.status === "uncertain") {
    return {
      level: "warning",
      label: "信息待确认",
      message: "活动信息还没有确认，应避免重点推荐。"
    };
  }

  if (activity.audience.includes("family") && !activity.childSafetyComplete) {
    return {
      level: "blocked",
      label: "亲子信息不足",
      message: "儿童相关活动必须补齐适龄、陪同要求和注意事项后才能进入亲子精选。"
    };
  }

  return {
    level: "clear",
    label: "信息已确认",
    message: `来源信息最后确认于 ${activity.lastConfirmedAt}。`
  };
}
