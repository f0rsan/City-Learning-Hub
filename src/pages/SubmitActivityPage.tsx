import { useState } from "react";
import { createCandidateFromSubmission } from "../domain/candidateStore";
import { addSubmittedActivity, updateSubmittedActivityStatus } from "../domain/localStore";
import type { Activity, Audience } from "../domain/types";

const categories: Activity["category"][] = [
  "亲子科技",
  "电子展会",
  "游戏展会",
  "科技展会",
  "技术大会",
  "社科讲座",
  "读书沙龙",
  "Hackathon"
];

function audienceFromValue(value: string): Audience[] {
  if (value === "成人") {
    return ["adult"];
  }

  if (value === "亲子和成人") {
    return ["family", "adult"];
  }

  return ["family"];
}

export default function SubmitActivityPage() {
  const [submittedTitle, setSubmittedTitle] = useState("");

  return (
    <section className="form-page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">共同维护</p>
          <h1>提交活动</h1>
          <p>把可能值得去的展会、讲座、沙龙或 Hackathon 放进候选池，由系统先评估价值、风险和信心。</p>
        </div>
        <div className="trust-panel">
          <strong>收录原则</strong>
          <p>优先收录有官方页面、时间地点清楚、适合学习和交流的深圳活动。</p>
        </div>
      </div>

      {submittedTitle ? (
        <p className="success-message">
          <strong>已进入候选池</strong>：{submittedTitle}
        </p>
      ) : null}

      <form
        className="hub-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const title = String(form.get("title") ?? "").trim();

          const submission = addSubmittedActivity({
            title,
            category: String(form.get("category") ?? "亲子科技") as Activity["category"],
            audience: audienceFromValue(String(form.get("audience") ?? "亲子")),
            dateText: String(form.get("dateText") ?? "").trim(),
            district: String(form.get("district") ?? "").trim(),
            venue: String(form.get("venue") ?? "").trim(),
            officialUrl: String(form.get("officialUrl") ?? "").trim(),
            contact: String(form.get("contact") ?? "").trim(),
            note: String(form.get("note") ?? "").trim()
          });
          createCandidateFromSubmission(submission.id);
          updateSubmittedActivityStatus(submission.id, "approved");

          setSubmittedTitle(title);
          event.currentTarget.reset();
        }}
      >
        <label>
          活动名称
          <input name="title" required />
        </label>
        <label>
          活动类型
          <select name="category" defaultValue="亲子科技">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          主要人群
          <select name="audience" defaultValue="亲子">
            <option value="亲子">亲子</option>
            <option value="成人">成人</option>
            <option value="亲子和成人">亲子和成人</option>
          </select>
        </label>
        <label>
          时间
          <input name="dateText" required />
        </label>
        <label>
          区域
          <input name="district" required />
        </label>
        <label>
          地点
          <input name="venue" required />
        </label>
        <label>
          官方链接
          <input name="officialUrl" required type="url" />
        </label>
        <label>
          联系方式
          <input name="contact" required />
        </label>
        <label className="wide-field">
          推荐理由
          <textarea name="note" required rows={4} />
        </label>
        <button type="submit">提交到候选池</button>
      </form>
    </section>
  );
}
