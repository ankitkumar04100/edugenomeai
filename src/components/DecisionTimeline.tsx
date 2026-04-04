import React from 'react';
import type { OrchestratorDecision } from '@/lib/adaptive-engine';

interface Props {
  decisions: OrchestratorDecision[];
  compact?: boolean;
}

const INTERVENTION_ICONS: Record<string, string> = {
  confusion_intervention: '🧠',
  fatigue_intervention: '😴',
  speed_accuracy_intervention: '⚡',
};

const ACTION_LABELS: Record<string, string> = {
  DOWN: '↓ Difficulty decreased',
  UP: '↑ Difficulty increased',
  HOLD: '→ Difficulty held',
  MICROBREAK: '☕ Micro-break triggered',
  SLOW_MODE: '🐢 Slow mode activated',
  STEP_BY_STEP: '📋 Step-by-step mode',
  DISTRACTION_MIN: '🔕 Distraction-min mode',
};

const OUTCOME_STYLES: Record<string, string> = {
  improved: 'text-green-600 bg-green-50',
  unchanged: 'text-amber-600 bg-amber-50',
  worse: 'text-red-600 bg-red-50',
};

const DecisionTimeline: React.FC<Props> = ({ decisions, compact = false }) => {
  if (decisions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-xs">
        <p>🤖 No adaptive decisions yet</p>
        <p className="mt-1">The orchestrator will act when indices or traits trigger rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {decisions.slice().reverse().map((d, i) => {
        const icon = d.interventionType ? INTERVENTION_ICONS[d.interventionType] || '🔄' : '📊';
        const mainLabel = d.action.difficulty_action !== 'HOLD'
          ? ACTION_LABELS[d.action.difficulty_action]
          : d.action.pacing_action !== 'CONTINUE'
          ? ACTION_LABELS[d.action.pacing_action]
          : d.action.ui_mode !== 'NORMAL'
          ? ACTION_LABELS[d.action.ui_mode]
          : `Hint: ${d.action.hint_suggestion}`;

        return (
          <div key={`${d.tick}-${i}`} className={`border border-border rounded-xl ${compact ? 'p-2' : 'p-3'} bg-card`}>
            <div className="flex items-start gap-2">
              <span className="text-base">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-semibold text-foreground">{mainLabel}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Math.floor(d.sessionTimeSec / 60)}:{String(d.sessionTimeSec % 60).padStart(2, '0')}
                  </span>
                </div>
                {!compact && (
                  <>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{d.reason}</p>
                    <p className="text-[10px] text-muted-foreground italic">Expected: {d.expectedEffect}</p>
                  </>
                )}
                {d.outcome && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-heading font-semibold ${OUTCOME_STYLES[d.outcome] || ''}`}>
                    {d.outcome === 'improved' ? '✅ Improved' : d.outcome === 'worse' ? '❌ Worsened' : '➡️ Unchanged'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DecisionTimeline;
