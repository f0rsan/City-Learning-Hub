import { ArrowRight, CalendarClock, Database, MapPin, Ticket } from "lucide-react";
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
  const titleId = `activity-title-${activity.id}`;
  const shouldShowPrice = activity.priceNote !== "见活动页";
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
        <div className="activity-time-column" aria-label="活动时间和地点">
          <span className="row-date">
            <CalendarClock size={15} aria-hidden="true" />
            {date}
          </span>
          <span className="row-place">{activity.district}</span>
        </div>
        <div className="activity-card-main">
          <div className="card-topline">
            <span className="row-category">{activity.category}</span>
            <span className="source-chip" aria-label={`来源：${source?.name ?? "来源可查"}`} title={`来源：${source?.name ?? "来源可查"}`}>
              <Database size={14} aria-hidden="true" strokeWidth={2.2} />
              {source?.name ?? "来源可查"}
            </span>
          </div>
          <div className="activity-title-row">
            <h3 id={titleId}>{activity.title}</h3>
            <ArrowRight className="activity-row-arrow" size={17} aria-hidden="true" />
          </div>
          <div className="activity-facts" aria-label="活动基本信息">
            <span>
              <MapPin size={14} aria-hidden="true" />
              {activity.venue}
            </span>
            {shouldShowPrice ? (
              <span>
                <Ticket size={14} aria-hidden="true" />
                {activity.priceNote}
              </span>
            ) : null}
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
        <div className="activity-signal-column">
          <StatusBadge activity={activity} />
          <EvaluationBadge evaluation={evaluation} />
        </div>
      </Link>
    </article>
  );
}
