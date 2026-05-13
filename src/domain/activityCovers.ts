import aiServerCover from "../assets/activity-covers/ai-server-cover.jpg";
import type { Activity, ActivityCoverImage } from "./types";

const coverImagesBySlug: Record<string, ActivityCoverImage> = {
  "ai服务器-69c5bd575d": {
    src: aiServerCover,
    alt: "AI服务器先进制造技术创新系列论坛封面",
    sourceName: "官方活动页"
  }
};

export function getActivityCoverImage(activity: Pick<Activity, "slug">) {
  return coverImagesBySlug[activity.slug];
}
