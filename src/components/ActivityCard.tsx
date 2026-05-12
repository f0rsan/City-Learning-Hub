import { Clock, Database, MapPin, Ticket } from "lucide-react";
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
  const evaluation = activity.evaluation ?? evaluateActivity(activity, { sources: getSourcePool() });
  const titleId = `activity-title-${activity.id}`;
  const visibleTags = activity.tags
    .filter((tag) => tag !== activity.category)
    .filter((tag) => !(activity.category === "读书沙龙" && tag === "讲座阅读"))
    .filter((tag) => !(activity.category === "科技展会" && tag === "展会"))
    .slice(0, 2);
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
    <article className="activity-card">
      <Link className="activity-card-link" to={`/activities/${activity.slug}`} aria-labelledby={titleId}>
        <div className="card-topline">
          <span>{activity.category}</span>
          <StatusBadge activity={activity} />
        </div>
        <h3 id={titleId}>{activity.title}</h3>
        <EvaluationBadge evaluation={evaluation} />
        <dl className="activity-facts">
          <div>
            <Clock size={16} aria-hidden="true" />
            <dt>时间</dt>
            <dd>{date}</dd>
          </div>
          <div>
            <MapPin size={16} aria-hidden="true" />
            <dt>地点</dt>
            <dd>
              {activity.district} · {activity.venue}
            </dd>
          </div>
          <div>
            <Ticket size={16} aria-hidden="true" />
            <dt>费用</dt>
            <dd>{activity.priceNote}</dd>
          </div>
        </dl>
        <div className="card-judgment">
          <div className="judgment-block value">
            <strong>看点</strong>
            <p>{evaluation.valueReasons[0]}</p>
          </div>
          <div className="judgment-block risk">
            <strong>注意</strong>
            <p>{evaluation.riskReasons[0]}</p>
          </div>
        </div>
        {visibleTags.length ? (
          <div className="tag-row">
            {visibleTags.map((tag) =>
              tag === "真实采集" ? (
                <span className="icon-tag" key={tag} aria-label={tag} title={tag}>
                  <Database size={14} aria-hidden="true" strokeWidth={2.2} />
                </span>
              ) : (
                <span key={tag}>{tag}</span>
              )
            )}
          </div>
        ) : null}
      </Link>
    </article>
  );
}
