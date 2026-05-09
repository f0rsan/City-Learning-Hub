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
  return (
    <div className="evaluation-badges" aria-label="系统评估结果">
      <span className={`evaluation-badge recommendation ${evaluation.recommendationLevel}`}>
        系统推荐：{recommendationLabels[evaluation.recommendationLevel]}
      </span>
      <span className={`evaluation-badge confidence ${evaluation.confidenceLevel}`}>
        判断信心：{confidenceLabels[evaluation.confidenceLevel]}
      </span>
    </div>
  );
}
