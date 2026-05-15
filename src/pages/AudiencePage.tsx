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
  const title = audience === "family" ? "带孩子去学习" : "成人学习交流";
  const subtitle =
    audience === "family"
      ? "优先看适合年龄、互动体验和陪同要求都清楚的活动。"
      : "优先看技术、产业、读书、社科和创业交流活动。";

  return (
    <main className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">深圳分类精选</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </section>
      <WeeklySection title="精选活动" subtitle="看点、注意事项和可靠性放在同一行比较。" activities={activities} />
    </main>
  );
}
