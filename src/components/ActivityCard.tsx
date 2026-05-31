import { Link } from "react-router-dom";
import { evaluateActivity } from "../domain/evaluationRules";
import { getSourcePool } from "../domain/sourcePool";
import type { Activity } from "../domain/types";
import EvaluationBadge from "./EvaluationBadge";
import StatusBadge from "./StatusBadge";

type ActivityCardProps = {
  activity: Activity;
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const sources = getSourcePool();
  const evaluation = activity.evaluation ?? evaluateActivity(activity, { sources });
  const source = sources.find((item) => item.id === activity.sourceId);
  const sourceName = source?.name ?? "来源可查";
  const shouldShowVenue = activity.venue.trim() !== sourceName.trim();
  const titleId = `activity-title-${activity.id}`;
  const date =
    activity.dateNote ??
    new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(activity.startAt));

  return (
    <article className="activity-card activity-row">
      <Link className="activity-card-link activity-row-link" to={`/activities/${activity.slug}`} aria-labelledby={titleId}>
        <div className="activity-card-main">
          <div className="activity-time-column card-topline" aria-label="活动时间和地点">
            <span className="row-date">{date}</span>
            <span>{activity.district}</span>
            <span className="row-category">{activity.category}</span>
            <span className="source-chip" aria-label={`来源：${sourceName}`} title={`来源：${sourceName}`}>
              {sourceName}
            </span>
          </div>
          <div className="activity-title-row">
            <h3 id={titleId}>{activity.title}</h3>
          </div>
          <div className="activity-facts" aria-label="活动基本信息">
            {shouldShowVenue ? <span>{activity.venue}</span> : null}
            <StatusBadge activity={activity} />
            <EvaluationBadge evaluation={evaluation} />
          </div>
          <div className="card-judgment">
            <p className="judgment-block value">
              <strong>看点</strong>
              <span>{evaluation.valueReasons[0]}</span>
            </p>
            <p className="judgment-block risk">
              <strong>注意</strong>
              <span>{evaluation.riskReasons[0]}</span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
