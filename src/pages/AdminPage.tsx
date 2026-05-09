import { CheckCircle2, CircleSlash2, Inbox, MessageSquareWarning } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getCorrectionReports,
  getSubmittedActivities,
  updateSubmittedActivityStatus
} from "../domain/localStore";
import { sampleActivities } from "../domain/sampleData";
import type { SubmittedActivityStatus } from "../domain/types";

const statusLabels: Record<SubmittedActivityStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已退回"
};

export default function AdminPage() {
  const [submittedActivities, setSubmittedActivities] = useState(() => getSubmittedActivities());
  const correctionReports = getCorrectionReports();
  const activityTitles = useMemo(
    () => new Map(sampleActivities.map((activity) => [activity.slug, activity.title])),
    []
  );

  function setStatus(id: string, status: SubmittedActivityStatus) {
    updateSubmittedActivityStatus(id, status);
    setSubmittedActivities(getSubmittedActivities());
  }

  return (
    <section className="admin-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">编辑维护</p>
          <h1>轻后台</h1>
          <p>第一版先把后台从人工审核队列升级为系统评估台：系统先判断，人工只校准低信心和高风险活动。</p>
        </div>
        <div className="trust-panel">
          <strong>本周决策口径</strong>
          <p>投稿和纠错先进入候选与校准流程，不直接影响公开推荐。</p>
        </div>
      </div>

      <section className="admin-section">
        <div className="section-title">
          <Inbox size={22} aria-hidden="true" />
          <h2>活动待审</h2>
        </div>
        {submittedActivities.length ? (
          <div className="admin-list">
            {submittedActivities.map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">{statusLabels[activity.status]}</span>
                  <h3>{activity.title}</h3>
                  <p>
                    {activity.category} / {activity.district} / {activity.venue} / {activity.dateText}
                  </p>
                  <p>{activity.note}</p>
                  <a href={activity.officialUrl} target="_blank" rel="noreferrer">
                    查看来源
                  </a>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => setStatus(activity.id, "approved")}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    通过
                  </button>
                  <button type="button" onClick={() => setStatus(activity.id, "rejected")}>
                    <CircleSlash2 size={17} aria-hidden="true" />
                    退回
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">暂无待审活动。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <MessageSquareWarning size={22} aria-hidden="true" />
          <h2>纠错线索</h2>
        </div>
        {correctionReports.length ? (
          <div className="admin-list">
            {correctionReports.map((report) => (
              <article className="admin-item" key={report.id}>
                <span className="pill">待复核</span>
                <h3>{activityTitles.get(report.activitySlug) ?? report.activitySlug}</h3>
                <p>{report.issueType}</p>
                <p>{report.detail}</p>
                <p>{report.contact}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">暂无纠错线索。</p>
        )}
      </section>
    </section>
  );
}
