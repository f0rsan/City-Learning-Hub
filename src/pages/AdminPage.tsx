import {
  CheckCircle2,
  CircleSlash2,
  DatabaseBackup,
  FileInput,
  Inbox,
  MessageSquareWarning,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";
import { useMemo, useState } from "react";
import EvaluationBadge from "../components/EvaluationBadge";
import EvidenceSummary from "../components/EvidenceSummary";
import {
  createCandidateFromSubmission,
  getCandidateActivities,
  updateCandidateStatus
} from "../domain/candidateStore";
import { addCalibrationNote, getCalibrationMessage } from "../domain/calibrationStore";
import { exportHubData, importHubData } from "../domain/exportImport";
import {
  getCorrectionReports,
  getSubmittedActivities,
  updateSubmittedActivityStatus
} from "../domain/localStore";
import { getSourceHealth } from "../domain/sourcePool";
import type { CalibrationAction } from "../domain/evaluationTypes";
import type { SubmittedActivityStatus } from "../domain/types";

const statusLabels: Record<SubmittedActivityStatus, string> = {
  pending: "待处理",
  approved: "已通过",
  rejected: "已退回"
};

export default function AdminPage() {
  const [submittedActivities, setSubmittedActivities] = useState(() =>
    getSubmittedActivities().filter((activity) => activity.status === "pending")
  );
  const [candidates, setCandidates] = useState(() => getCandidateActivities());
  const [lastAction, setLastAction] = useState("");
  const correctionReports = getCorrectionReports();
  const sourceHealth = getSourceHealth();
  const activityTitles = useMemo(
    () => new Map(candidates.map((activity) => [activity.slug, activity.title])),
    [candidates]
  );
  const evaluated = candidates.filter((candidate) => candidate.evaluation);
  const needsCalibration = evaluated.filter(
    (candidate) =>
      candidate.evaluation?.confidenceLevel !== "high" ||
      candidate.evaluation.riskReasons.some((reason) => reason.includes("不足") || reason.includes("纠错"))
  );
  const drafts = candidates.filter((candidate) => candidate.candidateStatus === "draft");

  function refresh() {
    setSubmittedActivities(getSubmittedActivities().filter((activity) => activity.status === "pending"));
    setCandidates(getCandidateActivities());
  }

  function calibrate(activityId: string, action: CalibrationAction) {
    addCalibrationNote(activityId, action);

    if (action === "lower_confidence") {
      updateCandidateStatus(activityId, "evaluated");
    }

    if (action === "reject") {
      updateCandidateStatus(activityId, "rejected");
    }

    setLastAction(getCalibrationMessage(action));
    refresh();
  }

  function setStatus(id: string, status: SubmittedActivityStatus) {
    updateSubmittedActivityStatus(id, status);
    setSubmittedActivities(getSubmittedActivities().filter((activity) => activity.status === "pending"));
  }

  function convertSubmission(id: string) {
    updateSubmittedActivityStatus(id, "approved");
    createCandidateFromSubmission(id);
    setLastAction("已转为候选草稿");
    refresh();
  }

  function exportData() {
    const data = exportHubData();
    window.localStorage.setItem("shenzhen-learning-hub:last-export", JSON.stringify(data));
    setLastAction("已生成本地 JSON 备份");
  }

  function importLastExport() {
    const raw = window.localStorage.getItem("shenzhen-learning-hub:last-export");
    const result = importHubData(raw ? JSON.parse(raw) : {});
    setLastAction(result.ok ? "已导入本地 JSON 备份" : result.error);
    refresh();
  }

  return (
    <section className="admin-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">80% 系统判断 · 20% 人工校准</p>
          <h1>系统评估台</h1>
          <p>后台不再逐条人工整理活动，而是查看系统推荐、证据、风险和信心，把人的投入集中在校准低信心和高风险样本。</p>
        </div>
        <div className="trust-panel">
          <strong>本周决策口径</strong>
          <p>投稿和纠错先进入候选与校准流程，不直接影响公开推荐。</p>
          {lastAction ? <p className="inline-status">{lastAction}</p> : null}
        </div>
      </div>

      <section className="admin-section">
        <div className="section-title">
          <SlidersHorizontal size={22} aria-hidden="true" />
          <h2>系统推荐</h2>
        </div>
        <div className="admin-list">
          {evaluated.slice(0, 4).map((activity) => (
            <article className="admin-item evaluation-admin-item" key={activity.id}>
              <div>
                <span className="pill">系统推荐</span>
                <h3>{activity.title}</h3>
                {activity.evaluation ? (
                  <>
                    <EvaluationBadge evaluation={activity.evaluation} />
                    <div className="admin-reasons">
                      <strong>为什么值得去</strong>
                      <p>{activity.evaluation.valueReasons[0]}</p>
                      <strong>主要风险</strong>
                      <p>{activity.evaluation.riskReasons[0]}</p>
                    </div>
                    <EvidenceSummary compact evaluation={activity.evaluation} />
                  </>
                ) : null}
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => calibrate(activity.id, "confirm")}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  确认推荐
                </button>
                <button type="button" onClick={() => calibrate(activity.id, "lower_confidence")}>
                  <ShieldAlert size={17} aria-hidden="true" />
                  降低信心
                </button>
                <button type="button" onClick={() => calibrate(activity.id, "send_to_calibration")}>
                  <SlidersHorizontal size={17} aria-hidden="true" />
                  送入校准
                </button>
                <button type="button" onClick={() => calibrate(activity.id, "reject")}>
                  <CircleSlash2 size={17} aria-hidden="true" />
                  拒绝推荐
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-title">
          <ShieldAlert size={22} aria-hidden="true" />
          <h2>需要校准</h2>
        </div>
        {needsCalibration.length ? (
          <div className="admin-list">
            {needsCalibration.slice(0, 3).map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">低信心或高风险</span>
                  <h3>{activity.title}</h3>
                  <p>{activity.evaluation?.riskReasons[0]}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">暂无需要校准的活动。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <Inbox size={22} aria-hidden="true" />
          <h2>候选草稿</h2>
        </div>
        {drafts.length || submittedActivities.length ? (
          <div className="admin-list">
            {drafts.map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">候选草稿</span>
                  <h3>{activity.title}</h3>
                  <p>{activity.summary}</p>
                  <a href={activity.officialUrl} target="_blank" rel="noreferrer">
                    查看来源
                  </a>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => updateCandidateStatus(activity.id, "evaluated") && refresh()}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    系统评估
                  </button>
                </div>
              </article>
            ))}
            {submittedActivities.map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">{statusLabels[activity.status]}</span>
                  <h3>{activity.title}</h3>
                  <p>
                    {activity.category} / {activity.district} / {activity.venue} / {activity.dateText}
                  </p>
                  <p>{activity.note}</p>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => convertSubmission(activity.id)}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    转为候选草稿
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
          <p className="empty-state">暂无候选草稿。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <MessageSquareWarning size={22} aria-hidden="true" />
          <h2>影响可信度的纠错</h2>
        </div>
        {correctionReports.length ? (
          <div className="admin-list">
            {correctionReports.map((report) => (
              <article className="admin-item" key={report.id}>
                <div>
                  <span className="pill">降低信心</span>
                  <h3>{activityTitles.get(report.activitySlug) ?? report.activitySlug}</h3>
                  <p>{report.issueType}</p>
                  <p>{report.detail}</p>
                  <p>{report.contact}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">暂无纠错线索。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <DatabaseBackup size={22} aria-hidden="true" />
          <h2>来源池健康度与备份</h2>
        </div>
        <div className="admin-list">
          {sourceHealth.map((source) => (
            <article className="admin-item" key={source.sourceId}>
              <div>
                <span className="pill">{source.health}</span>
                <h3>{source.name}</h3>
                <p>最后检查：{source.lastChecked}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="admin-actions">
          <button type="button" onClick={exportData}>
            <DatabaseBackup size={17} aria-hidden="true" />
            导出 JSON
          </button>
          <button type="button" onClick={importLastExport}>
            <FileInput size={17} aria-hidden="true" />
            导入上次备份
          </button>
        </div>
      </section>
    </section>
  );
}
