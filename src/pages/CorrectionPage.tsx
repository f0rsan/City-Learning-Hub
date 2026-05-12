import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getActivityBySlug } from "../domain/activitySelectors";
import { getCandidateActivities } from "../domain/candidateStore";
import { addCorrectionReport } from "../domain/localStore";

export default function CorrectionPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(getCandidateActivities(), slug) : undefined;
  const [submitted, setSubmitted] = useState(false);

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="form-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">信息纠错</p>
          <h1>纠错：{activity.title}</h1>
          <p>看到时间、地点、报名链接或适龄信息不对，可以告诉我们。</p>
        </div>
        <div className="trust-panel">
          <strong>原始链接</strong>
          <p>{activity.officialUrl}</p>
        </div>
      </div>

      {submitted ? <p className="success-message">已收到，会复核</p> : null}

      <form
        className="hub-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);

          addCorrectionReport({
            activitySlug: activity.slug,
            issueType: String(form.get("issueType") ?? "信息不准确"),
            detail: String(form.get("detail") ?? "").trim(),
            contact: String(form.get("contact") ?? "").trim()
          });

          setSubmitted(true);
          event.currentTarget.reset();
        }}
      >
        <label>
          问题类型
          <select name="issueType" defaultValue="时间变更">
            <option value="时间变更">时间变更</option>
            <option value="地点变更">地点变更</option>
            <option value="链接失效">链接失效</option>
            <option value="适龄信息不清楚">适龄信息不清楚</option>
            <option value="活动取消">活动取消</option>
          </select>
        </label>
        <label>
          联系方式
          <input name="contact" required />
        </label>
        <label className="wide-field">
          哪里需要改
          <textarea name="detail" required rows={5} />
        </label>
        <button type="submit">提交纠错线索</button>
      </form>
    </section>
  );
}
