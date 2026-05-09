import type { ActivityEvaluation } from "../domain/evaluationTypes";

type EvidenceSummaryProps = {
  evaluation: ActivityEvaluation;
  compact?: boolean;
};

export default function EvidenceSummary({ evaluation, compact = false }: EvidenceSummaryProps) {
  const signals = compact ? evaluation.evidenceSignals.slice(0, 3) : evaluation.evidenceSignals;

  return (
    <div className="evidence-summary">
      {signals.map((signal) => (
        <div className="evidence-item" key={signal.type}>
          <strong>{signal.label}</strong>
          <span>
            {signal.score}/{signal.maxScore}
          </span>
          {!compact ? <p>{signal.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
