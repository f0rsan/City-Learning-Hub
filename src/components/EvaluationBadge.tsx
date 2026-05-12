import { Ban, ShieldAlert, ShieldCheck, ShieldQuestion, Star, StarHalf } from "lucide-react";
import type { ActivityEvaluation } from "../domain/evaluationTypes";

const recommendationLabels: Record<ActivityEvaluation["recommendationLevel"], string> = {
  strong: "强推荐",
  good: "值得考虑",
  caution: "谨慎选择",
  blocked: "不建议前往"
};

const confidenceLabels: Record<ActivityEvaluation["confidenceLevel"], string> = {
  high: "高",
  medium: "中",
  low: "低"
};

type EvaluationBadgeProps = {
  evaluation: ActivityEvaluation;
};

export default function EvaluationBadge({ evaluation }: EvaluationBadgeProps) {
  const RecommendationIcon =
    evaluation.recommendationLevel === "strong"
      ? Star
      : evaluation.recommendationLevel === "good"
        ? StarHalf
        : evaluation.recommendationLevel === "blocked"
          ? Ban
          : ShieldAlert;
  const ConfidenceIcon =
    evaluation.confidenceLevel === "high"
      ? ShieldCheck
      : evaluation.confidenceLevel === "medium"
        ? ShieldQuestion
        : ShieldAlert;

  return (
    <div className="evaluation-badges" aria-label="活动判断">
      <span
        className={`evaluation-badge recommendation ${evaluation.recommendationLevel}`}
        aria-label={`推荐等级：${recommendationLabels[evaluation.recommendationLevel]}`}
        title={`推荐等级：${recommendationLabels[evaluation.recommendationLevel]}`}
      >
        <RecommendationIcon size={15} aria-hidden="true" strokeWidth={2.4} />
        {recommendationLabels[evaluation.recommendationLevel]}
      </span>
      <span
        className={`evaluation-badge confidence ${evaluation.confidenceLevel}`}
        aria-label={`把握度：${confidenceLabels[evaluation.confidenceLevel]}`}
        title={`把握度：${confidenceLabels[evaluation.confidenceLevel]}`}
      >
        <ConfidenceIcon size={15} aria-hidden="true" strokeWidth={2.4} />
        {confidenceLabels[evaluation.confidenceLevel]}把握
      </span>
    </div>
  );
}
