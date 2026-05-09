import { getTrustState } from "../domain/activitySelectors";
import type { Activity } from "../domain/types";

type StatusBadgeProps = {
  activity: Activity;
};

export default function StatusBadge({ activity }: StatusBadgeProps) {
  const trust = getTrustState(activity);
  return <span className={`status-badge ${trust.level}`}>{trust.label}</span>;
}
