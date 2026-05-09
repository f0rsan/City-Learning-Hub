import { Clock, MapPin, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import type { Activity } from "../domain/types";
import StatusBadge from "./StatusBadge";

type ActivityCardProps = {
  activity: Activity;
};

export default function ActivityCard({ activity }: ActivityCardProps) {
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
      <p className="recommendation">{activity.recommendation}</p>
      <div className="tag-row">
        {activity.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
