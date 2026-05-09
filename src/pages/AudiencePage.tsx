import { Navigate, useParams } from "react-router-dom";
import WeeklySection from "../components/WeeklySection";
import { filterByAudience } from "../domain/activitySelectors";
import { getPublicEvaluatedActivities } from "../domain/candidateStore";
import type { Audience } from "../domain/types";

function isAudience(value: string | undefined): value is Audience {
  return value === "family" || value === "adult";
}

export default function AudiencePage() {
  const { audience } = useParams();

  if (!isAudience(audience)) {
    return <Navigate to="/" replace />;
  }

  const activities = filterByAudience(getPublicEvaluatedActivities(), audience);
  const title = audience === "family" ? "带孩子去学习" : "大人去交流";
  const subtitle =
    audience === "family"
      ? "优先展示适龄、可亲子同行、注意事项清楚的活动。"
      : "优先展示科技、产业、读书、社科和技术交流活动。";

  return (
    <main className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">深圳精选入口</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </section>
      <WeeklySection title="精选活动" subtitle={subtitle} activities={activities} />
    </main>
  );
}
