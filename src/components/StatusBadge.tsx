import { getTrustState } from "../domain/activitySelectors";
import type { Activity } from "../domain/types";
import { AlertTriangle, CircleCheck, CircleSlash, ClockAlert, ShieldQuestion } from "lucide-react";

type StatusBadgeProps = {
  activity: Activity;
};

const shortLabels = {
  "信息已确认": "已确认",
  "信息待确认": "待确认",
  "活动已过期": "已过期",
  "活动已取消": "已取消",
  "亲子信息不足": "待补充"
} as const;

export default function StatusBadge({ activity }: StatusBadgeProps) {
  const trust = getTrustState(activity);
  const label = shortLabels[trust.label as keyof typeof shortLabels] ?? trust.label;
  const Icon =
    trust.level === "clear"
      ? CircleCheck
      : trust.label === "活动已取消"
        ? CircleSlash
        : trust.label === "活动已过期"
          ? ClockAlert
          : trust.label === "亲子信息不足"
            ? ShieldQuestion
            : AlertTriangle;

  return (
    <span className={`status-badge ${trust.level}`} aria-label={trust.label} title={trust.label}>
      <Icon size={15} aria-hidden="true" strokeWidth={2.4} />
      <span>{label}</span>
    </span>
  );
}
