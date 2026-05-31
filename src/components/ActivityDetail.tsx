import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  ExternalLink,
  Gauge,
  MapPin,
  Ticket,
  UserRound,
  type LucideIcon
} from "lucide-react";
import { useEffect, useId, useState } from "react";
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

type DetailFact = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function isPlaceholderFact(value?: string) {
  return !value || value.includes("见活动页") || value.includes("待核对");
}

export default function ActivityDetail({ activity }: ActivityDetailProps) {
  const reasonsPanelId = useId();
  const evidencePanelId = useId();
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(max-width: 860px)").matches;
  });
  const [showReasons, setShowReasons] = useState(!isCompactViewport);
  const [showEvidence, setShowEvidence] = useState(!isCompactViewport);
  const trust = getTrustState(activity);
  const evaluation = activity.evaluation ?? evaluateActivity(activity, { sources: getSourcePool() });
  const primaryValueReason = evaluation.valueReasons[0] ?? activity.recommendation;
  const evidencePreview = evaluation.evidenceSignals
    .slice(0, 3)
    .map((signal) => signal.label)
    .join(" / ");
  const start =
    activity.dateNote ??
    new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(activity.startAt));
  const detailTimeLabel = isPlaceholderFact(start) ? "时间待核对" : start;
  const facts = [
    !isPlaceholderFact(start) ? { label: "时间", value: start, icon: Clock } : null,
    { label: "地点", value: `${activity.district} · ${activity.venue}`, icon: MapPin },
    !isPlaceholderFact(activity.priceNote) ? { label: "费用", value: activity.priceNote, icon: Ticket } : null,
    { label: "预约", value: activity.reservationRequired ? "需要提前预约" : "现场确认", icon: CalendarCheck },
    !isPlaceholderFact(activity.difficulty) ? { label: "难度", value: activity.difficulty, icon: Gauge } : null,
    activity.ageBand && !isPlaceholderFact(activity.ageBand) ? { label: "年龄", value: activity.ageBand, icon: UserRound } : null
  ].filter((fact): fact is DetailFact => Boolean(fact));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 860px)");
    const syncViewport = () => setIsCompactViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (isCompactViewport) {
      setShowReasons(false);
      setShowEvidence(false);
      return;
    }

    setShowReasons(true);
    setShowEvidence(true);
  }, [isCompactViewport]);

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <div className="detail-title-block">
          <p className="eyebrow">{activity.category} · {detailTimeLabel}</p>
          <h1>{activity.title}</h1>
          <div className="trust-panel-badges">
            <StatusBadge activity={activity} />
            <EvaluationBadge evaluation={evaluation} />
          </div>
          <p>{activity.summary}</p>
        </div>
        <aside className={`trust-panel ${trust.level}`}>
          <strong>{trust.label}</strong>
          <p>{trust.level === "clear" ? "基础信息清楚，仍建议出发前看一次活动页。" : trust.message}</p>
        </aside>
      </section>

      <section className="detail-grid detail-layout">
        <div className="detail-primary">
          <article className="detail-card decision-card">
            <div className="detail-card-heading">
              <h2>是否值得去</h2>
              {isCompactViewport ? (
                <button
                  type="button"
                  className="detail-fold-toggle"
                  aria-expanded={showReasons}
                  aria-controls={reasonsPanelId}
                  onClick={() => setShowReasons((current) => !current)}
                >
                  {showReasons ? "收起理由" : "展开理由"}
                </button>
              ) : null}
            </div>
            <p className="decision-lead">{primaryValueReason}</p>
            <div id={reasonsPanelId} hidden={!showReasons}>
              {showReasons ? (
                <div className="decision-expanded">
                  <h3>适合谁</h3>
                  <p>{activity.bestFor}</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="detail-card evidence-card">
            <div className="detail-card-heading">
              <h2>参考依据</h2>
              {isCompactViewport ? (
                <button
                  type="button"
                  className="detail-fold-toggle"
                  aria-expanded={showEvidence}
                  aria-controls={evidencePanelId}
                  onClick={() => setShowEvidence((current) => !current)}
                >
                  {showEvidence ? "收起核对信息" : "查看核对信息"}
                </button>
              ) : null}
            </div>
            {!showEvidence ? <p className="detail-preview">参考：{evidencePreview}</p> : null}
            <div id={evidencePanelId} hidden={!showEvidence}>
              {showEvidence ? <EvidenceSummary evaluation={evaluation} /> : null}
            </div>
          </article>

          <article className="detail-card risk-card">
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
        </div>

        <aside className="detail-side">
          <article className="detail-card basic-info-card">
            <h2>基本信息</h2>
            <dl className="detail-list">
              {facts.map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <Icon size={16} aria-hidden="true" />
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="detail-card activity-page-card">
            <h2>活动页面</h2>
            <p>{activity.publicListingTier === "reference" || activity.dateNote ? "最近采集" : "最后核对"}：{activity.lastConfirmedAt}</p>
            <div className="detail-actions">
              <a href={activity.officialUrl} target="_blank" rel="noreferrer">
                去活动页面报名
                <ExternalLink size={16} aria-hidden="true" />
              </a>
              <Link to={`/correct/${activity.slug}`}>补充信息或更正</Link>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
