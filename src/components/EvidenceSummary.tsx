import type { ActivityEvaluation } from "../domain/evaluationTypes";

type EvidenceSummaryProps = {
  evaluation: ActivityEvaluation;
  compact?: boolean;
};

function signalReadout(score: number, maxScore: number) {
  const ratio = maxScore > 0 ? score / maxScore : 0;

  if (ratio >= 0.8) {
    return "信息较完整";
  }

  if (ratio >= 0.45) {
    return "仍需确认";
  }

  return "暂缺关键信息";
}

export default function EvidenceSummary({ evaluation, compact = false }: EvidenceSummaryProps) {
  const signals = compact ? evaluation.evidenceSignals.slice(0, 3) : evaluation.evidenceSignals;

  return (
    <div className="evidence-summary">
      {signals.map((signal) => (
        <div className="evidence-item" key={signal.type}>
          <strong>{signal.label}</strong>
          <div className="evidence-meter" aria-hidden="true">
            <span style={{ width: `${Math.round((signal.score / signal.maxScore) * 100)}%` }} />
          </div>
          <span className="sr-only">
            {signal.label}：{signalReadout(signal.score, signal.maxScore)}
          </span>
          {!compact ? <p>{signal.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
