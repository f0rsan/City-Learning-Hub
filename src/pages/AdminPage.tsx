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
import { useMemo, useState, type FormEvent } from "react";
import EvaluationBadge from "../components/EvaluationBadge";
import EvidenceSummary from "../components/EvidenceSummary";
import {
  createCandidateFromSubmission,
  getCandidateActivities,
  updateCandidateStatus
} from "../domain/candidateStore";
import { getCollectionIntervalHours } from "../domain/collectionSchedule";
import {
  addCalibrationNote,
  buildCalibrationMetadata,
  getCalibrationHotspots,
  getCalibrationMessage
} from "../domain/calibrationStore";
import { exportHubData, importHubData } from "../domain/exportImport";
import {
  getCorrectionReports,
  getSubmittedActivities,
  updateCorrectionReportStatus,
  updateSubmittedActivityStatus
} from "../domain/localStore";
import { getSourceHealth, type SourceHealth } from "../domain/sourcePool";
import type { CalibrationAction, CalibrationReasonType } from "../domain/evaluationTypes";
import type { SourceCollectionMode, SubmittedActivityStatus } from "../domain/types";

const adminPassword = "2026@admin";
const adminAuthStorageKey = "shenzhen-learning-hub:admin-authenticated";

const statusLabels: Record<SubmittedActivityStatus, string> = {
  pending: "待处理",
  approved: "已通过",
  rejected: "已退回"
};

const candidateQueueLabels = {
  draft: "待补充",
  pending: "待评估",
  archived: "已归档"
} as const;

const reasonTypeLabels: Record<CalibrationReasonType, string> = {
  evidence_gap: "证据不足",
  risk_update: "注意事项更新",
  audience_mismatch: "人群不匹配",
  rule_exception: "特殊情况",
  other: "其他原因"
};

const trendLabels = {
  up: "上升",
  down: "下降",
  flat: "持平"
} as const;

const trendSymbols = {
  up: "↗",
  down: "↘",
  flat: "→"
} as const;

const sourceHealthLabels: Record<SourceHealth, string> = {
  healthy: "稳定",
  needs_review: "需复核",
  failing: "异常"
};

const sourceCollectionModeLabels: Record<SourceCollectionMode, string> = {
  auto: "可直接自动采集",
  candidate: "半自动候选",
  reputation: "只做口碑信号"
};

const confirmationPowerLabels = {
  strong: "可确认",
  supporting: "辅助确认",
  none: "不确认"
} as const;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem(adminAuthStorageKey) === "true"
  );
  const [loginError, setLoginError] = useState("");
  const [submittedActivities, setSubmittedActivities] = useState(() =>
    getSubmittedActivities().filter((activity) => activity.status === "pending")
  );
  const [candidates, setCandidates] = useState(() => getCandidateActivities());
  const [lastAction, setLastAction] = useState("");
  const correctionReports = getCorrectionReports();
  const sourceHealth = getSourceHealth();
  const sourceGroups = (Object.keys(sourceCollectionModeLabels) as SourceCollectionMode[]).map((mode) => ({
    mode,
    label: sourceCollectionModeLabels[mode],
    sources: sourceHealth.filter((source) => source.collectionMode === mode)
  }));
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
  const pendingCandidates = candidates.filter(
    (candidate) => candidate.candidateStatus === "draft" || candidate.candidateStatus === "pending"
  );
  const archivedCandidates = candidates.filter((candidate) => candidate.candidateStatus === "archived");
  const calibrationHotspots = getCalibrationHotspots({ topN: 5 });

  function refresh() {
    setSubmittedActivities(getSubmittedActivities().filter((activity) => activity.status === "pending"));
    setCandidates(getCandidateActivities());
  }

  function calibrate(activityId: string, action: CalibrationAction) {
    const activity = candidates.find((candidate) => candidate.id === activityId);

    if (!activity) {
      setLastAction("未找到活动，无法记录操作");
      return;
    }

    addCalibrationNote(activityId, action, getCalibrationMessage(action), buildCalibrationMetadata(activity, action));

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
    setLastAction("已转为待补充");
    refresh();
  }

  function resolveCorrection(id: string) {
    updateCorrectionReportStatus(id, "resolved");
    setLastAction("已标记为已核对，相关影响会部分恢复");
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

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (password !== adminPassword) {
      setLoginError("密码不正确");
      return;
    }

    window.sessionStorage.setItem(adminAuthStorageKey, "true");
    setLoginError("");
    setIsAuthenticated(true);
  }

  if (!isAuthenticated) {
    return (
      <section className="admin-login-page" aria-labelledby="admin-login-title">
        <div className="admin-login-panel">
          <p className="eyebrow">内部操作</p>
          <h1 id="admin-login-title">后台登录</h1>
          <p>请输入后台密码后继续。</p>
          <form className="admin-login-form" onSubmit={login}>
            <label htmlFor="admin-password">后台密码</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
            {loginError ? (
              <p className="form-error" role="alert">
                {loginError}
              </p>
            ) : null}
            <button type="submit">进入后台</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">工具初筛 · 人工复核</p>
          <h1>活动审核台</h1>
          <p>查看本周推荐、参考依据和注意事项，把人工时间留给信息不清或风险较高的活动。</p>
        </div>
        <div className="trust-panel">
          <strong>本周口径</strong>
          <p>投稿和纠错先进入待处理列表，确认后才影响公开页面。</p>
          {lastAction ? (
            <p className="inline-status" aria-live="polite" role="status">
              {lastAction}
            </p>
          ) : null}
        </div>
      </div>

      <section className="admin-section">
        <div className="section-title">
          <SlidersHorizontal size={22} aria-hidden="true" />
          <h2>本周候选推荐</h2>
        </div>
        <div className="admin-list">
          {evaluated.slice(0, 4).map((activity) => (
            <article className="admin-item evaluation-admin-item" key={activity.id}>
              <div>
                <span className="pill">推荐中</span>
                <h3>{activity.title}</h3>
                {activity.evaluation ? (
                  <>
                    <EvaluationBadge evaluation={activity.evaluation} />
                    {activity.evaluationChange?.changedBy === "rule_version_update" ? (
                      <p className="inline-status">规则更新后，结果有变化</p>
                    ) : null}
                    <div className="admin-reasons">
                      <strong>看点</strong>
                      <p>{activity.evaluation.valueReasons[0]}</p>
                      <strong>注意</strong>
                      <p>{activity.evaluation.riskReasons[0]}</p>
                    </div>
                    <EvidenceSummary compact evaluation={activity.evaluation} />
                  </>
                ) : null}
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => calibrate(activity.id, "confirm")}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  确认展示
                </button>
                <button type="button" onClick={() => calibrate(activity.id, "lower_confidence")}>
                  <ShieldAlert size={17} aria-hidden="true" />
                  降为待观察
                </button>
                <button type="button" onClick={() => calibrate(activity.id, "send_to_calibration")}>
                  <SlidersHorizontal size={17} aria-hidden="true" />
                  加入复核
                </button>
                <button type="button" onClick={() => calibrate(activity.id, "reject")}>
                  <CircleSlash2 size={17} aria-hidden="true" />
                  不展示
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="section-title">
          <ShieldAlert size={22} aria-hidden="true" />
          <h2>近30天复核集中在哪</h2>
        </div>
        {calibrationHotspots.length ? (
          <div className="admin-list">
            {calibrationHotspots.map((hotspot) => (
              <article className="admin-item" key={`${hotspot.reasonType}-${hotspot.ruleTag ?? "none"}`}>
                <div>
                  <span className="pill">近30天 {hotspot.currentCount} 次</span>
                  <h3>{reasonTypeLabels[hotspot.reasonType] ?? hotspot.reasonType}</h3>
                  <p>标签：{hotspot.ruleTag ?? "未标注"}</p>
                  <p>
                    趋势：{trendSymbols[hotspot.trend]} {trendLabels[hotspot.trend]}（前30天 {hotspot.previousCount} 次）
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">近30天暂无集中复核问题。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <ShieldAlert size={22} aria-hidden="true" />
          <h2>需要复核</h2>
        </div>
        {needsCalibration.length ? (
          <div className="admin-list">
            {needsCalibration.slice(0, 3).map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">低把握或高风险</span>
                  <h3>{activity.title}</h3>
                  <p>{activity.evaluation?.riskReasons[0]}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">暂无需要复核的活动。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <Inbox size={22} aria-hidden="true" />
          <h2>待补充活动</h2>
        </div>
        {pendingCandidates.length || submittedActivities.length ? (
          <div className="admin-list">
            {pendingCandidates.map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">
                    {activity.candidateStatus === "pending" ? candidateQueueLabels.pending : candidateQueueLabels.draft}
                  </span>
                  <h3>{activity.title}</h3>
                  <p>{activity.summary}</p>
                  <a href={activity.officialUrl} target="_blank" rel="noreferrer">
                    查看来源
                  </a>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => updateCandidateStatus(activity.id, "evaluated") && refresh()}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    开始评估
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
                    转为待补充
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
          <p className="empty-state">暂无待补充或待处理活动。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <Inbox size={22} aria-hidden="true" />
          <h2>已过期线索</h2>
        </div>
        {archivedCandidates.length ? (
          <div className="admin-list">
            {archivedCandidates.map((activity) => (
              <article className="admin-item" key={activity.id}>
                <div>
                  <span className="pill">{candidateQueueLabels.archived}</span>
                  <h3>{activity.title}</h3>
                  <p>
                    归档原因：
                    {activity.archiveReason === "pending_ttl_expired" ? "待处理超时" : "草稿超时"}
                  </p>
                  <p>归档时间：{activity.archivedAt ? new Date(activity.archivedAt).toLocaleString("zh-CN") : "未知"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">暂无已过期线索。</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <MessageSquareWarning size={22} aria-hidden="true" />
          <h2>待核对纠错</h2>
        </div>
        {correctionReports.length ? (
          <div className="admin-list">
            {correctionReports.map((report) => (
              <article className="admin-item" key={report.id}>
                <div>
                  <span className="pill">{report.status === "resolved" ? "已核对（部分恢复）" : "影响可靠性"}</span>
                  <h3>{activityTitles.get(report.activitySlug) ?? report.activitySlug}</h3>
                  <p>{report.issueType}</p>
                  <p>{report.detail}</p>
                  <p>{report.contact}</p>
                  {report.resolvedAt ? <p>已解决时间：{new Date(report.resolvedAt).toLocaleString("zh-CN")}</p> : null}
                </div>
                {report.status === "open" ? (
                  <div className="admin-actions">
                    <button type="button" onClick={() => resolveCorrection(report.id)}>
                      <CheckCircle2 size={17} aria-hidden="true" />
                      标记已解决
                    </button>
                  </div>
                ) : null}
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
          <h2>来源状态与备份</h2>
        </div>
        <p className="section-note">自动更新：每 {getCollectionIntervalHours("auto")} 小时</p>
        {sourceGroups.map((group) => (
          <div className="source-group" key={group.mode}>
            <div className="source-group-heading">
              <h3>{group.label}</h3>
              <span className="pill">{group.sources.length} 个来源</span>
            </div>
            <div className="admin-list">
              {group.sources.map((source) => (
                <article className="admin-item" key={source.sourceId}>
                  <div>
                    <div className="badge-row">
                      <span className="pill">{sourceHealthLabels[source.health]}</span>
                      <span className="pill">{confirmationPowerLabels[source.confirmationPower]}</span>
                    </div>
                    <h3>{source.name}</h3>
                    <p>{source.coverageTags.slice(0, 3).join(" / ")}</p>
                    <p>最后检查：{source.lastChecked}</p>
                    <p>连续失败：{source.consecutiveFailures}</p>
                    <p>最近成功：{source.lastSuccessAt ?? "暂无"}</p>
                    {source.lastFailureAt ? <p>最近失败：{source.lastFailureAt}</p> : null}
                    {source.lastFailureReason ? <p>失败原因：{source.lastFailureReason}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
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
