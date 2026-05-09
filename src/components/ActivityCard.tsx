import { Clock, MapPin, Ticket } from "lucide-react";
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
  const date = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(activity.startAt));

  return (
    <article className="activity-card">
      <div className="card-topline">
        <span>{activity.category}</span>
        <StatusBadge activity={activity} />
      </div>
      <h3>
        <Link to={`/activities/${activity.slug}`}>{activity.title}</Link>
      </h3>
      <p className="summary">{activity.summary}</p>
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
        <strong>为什么值得去</strong>
        <p>{evaluation.valueReasons[0]}</p>
        <strong>主要风险</strong>
        <p>{evaluation.riskReasons[0]}</p>
      </div>
      <div className="tag-row">
        {activity.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
