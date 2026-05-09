import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { getTrustState } from "../domain/activitySelectors";
import { evaluateActivity } from "../domain/evaluationRules";
import { getSourcePool } from "../domain/sourcePool";
import type { Activity } from "../domain/types";
import EvaluationBadge from "./EvaluationBadge";
import EvidenceSummary from "./EvidenceSummary";
import StatusBadge from "./StatusBadge";

type ActivityDetailProps = {
  activity: Activity;
};

export default function ActivityDetail({ activity }: ActivityDetailProps) {
  const trust = getTrustState(activity);
  const evaluation = activity.evaluation ?? evaluateActivity(activity, { sources: getSourcePool() });
  const start = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(activity.startAt));

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{activity.category}</p>
          <h1>{activity.title}</h1>
          <p>{activity.summary}</p>
          <div className="tag-row">
            {activity.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <aside className={`trust-panel ${trust.level}`}>
          <StatusBadge activity={activity} />
          <EvaluationBadge evaluation={evaluation} />
          <p>{trust.message}</p>
        </aside>
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <h2>是否值得去</h2>
          <ul>
            {evaluation.valueReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <h3>适合谁</h3>
          <p>{activity.bestFor}</p>
        </article>

        <article className="detail-card">
          <h2>系统判断依据</h2>
          <EvaluationBadge evaluation={evaluation} />
          <EvidenceSummary evaluation={evaluation} />
        </article>

        <article className="detail-card">
          <h2>基本信息</h2>
          <dl className="detail-list">
            <div>
              <dt>时间</dt>
              <dd>{start}</dd>
            </div>
            <div>
              <dt>地点</dt>
              <dd>
                <MapPin size={16} aria-hidden="true" />
                {activity.district} · {activity.venue}
              </dd>
            </div>
            <div>
              <dt>费用</dt>
              <dd>{activity.priceNote}</dd>
            </div>
            <div>
              <dt>预约</dt>
              <dd>{activity.reservationRequired ? "需要提前预约" : "无需预约或现场确认"}</dd>
            </div>
            <div>
              <dt>难度</dt>
              <dd>{activity.difficulty}</dd>
            </div>
            {activity.ageBand ? (
              <div>
                <dt>年龄</dt>
                <dd>{activity.ageBand}</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article className="detail-card">
          <h2>去之前要知道</h2>
          <ul>
            {evaluation.riskReasons.map((caution) => (
              <li key={caution}>
                <AlertTriangle size={16} aria-hidden="true" />
                {caution}
              </li>
            ))}
          </ul>
        </article>

        <article className="detail-card">
          <h2>来源和更新</h2>
          <p>最后确认时间：{activity.lastConfirmedAt}</p>
          <p>请以官方页面的报名和临时变更为准。</p>
          <div className="detail-actions">
            <a href={activity.officialUrl} target="_blank" rel="noreferrer">
              查看官方报名页面
              <ExternalLink size={16} aria-hidden="true" />
            </a>
            <Link to={`/correct/${activity.slug}`}>纠错或补充信息</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
