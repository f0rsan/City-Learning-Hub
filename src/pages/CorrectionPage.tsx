import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getActivityBySlug } from "../domain/activitySelectors";
import { addCorrectionReport } from "../domain/localStore";
import { sampleActivities } from "../domain/sampleData";

export default function CorrectionPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(sampleActivities, slug) : undefined;
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
          <p>如果时间、地点、报名链接或适龄信息有变化，可以把线索发给编辑复核。</p>
        </div>
        <div className="trust-panel">
          <strong>当前来源</strong>
          <p>{activity.officialUrl}</p>
        </div>
      </div>

      {submitted ? <p className="success-message">已收到纠错信息</p> : null}

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
          具体说明
          <textarea name="detail" required rows={5} />
        </label>
        <button type="submit">提交纠错</button>
      </form>
    </section>
  );
}
