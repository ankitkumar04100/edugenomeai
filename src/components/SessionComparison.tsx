import React from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS, type GenomeCategory } from '@/lib/genome-types';
import type { SessionRecord } from '@/lib/session-service';

interface Props {
  sessionA: SessionRecord;
  sessionB: SessionRecord;
  onClose: () => void;
}

function delta(a: number | null, b: number | null): { value: number; label: string; color: string } {
  const av = a ?? 0;
  const bv = b ?? 0;
  const d = bv - av;
  return {
    value: d,
    label: d > 0 ? `+${Math.round(d)}` : `${Math.round(d)}`,
    color: d > 2 ? 'text-green-600' : d < -2 ? 'text-red-600' : 'text-muted-foreground',
  };
}

const SessionComparison: React.FC<Props> = ({ sessionA, sessionB, onClose }) => {
  const scoreA = sessionA.overall_score ?? 0;
  const scoreB = sessionB.overall_score ?? 0;
  const scoreDelta = delta(scoreA, scoreB);

  const metrics = [
    { label: 'Overall Score', a: scoreA, b: scoreB },
    { label: 'Confusion', a: sessionA.avg_confusion, b: sessionB.avg_confusion },
    { label: 'Fatigue', a: sessionA.avg_fatigue, b: sessionB.avg_fatigue },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground">📊 Session Comparison</h2>
        <button onClick={onClose} className="text-xs text-primary hover:underline font-heading">← Back</button>
      </div>

      {/* Session labels */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card-premium p-3">
          <div className="text-xs text-muted-foreground font-heading">Session A</div>
          <div className="text-sm font-heading font-semibold text-foreground">
            {new Date(sessionA.started_at).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {sessionA.mode === 'demo' ? `Demo (${sessionA.persona || 'N/A'})` : 'Live'}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-2xl font-heading font-bold text-primary">vs</span>
        </div>
        <div className="card-premium p-3">
          <div className="text-xs text-muted-foreground font-heading">Session B</div>
          <div className="text-sm font-heading font-semibold text-foreground">
            {new Date(sessionB.started_at).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {sessionB.mode === 'demo' ? `Demo (${sessionB.persona || 'N/A'})` : 'Live'}
          </div>
        </div>
      </div>

      {/* Metrics comparison */}
      <div className="card-premium p-4 space-y-3">
        <h3 className="font-heading font-semibold text-sm text-foreground">Key Metrics</h3>
        {metrics.map(m => {
          const d = delta(m.a, m.b);
          return (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">{m.label}</span>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <span className="text-xs font-heading font-semibold text-foreground w-12 text-right">{Math.round(m.a ?? 0)}</span>
                <div className="flex-1 max-w-32 h-2 bg-secondary rounded-full relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary/40 rounded-full" style={{ width: `${Math.min(100, m.a ?? 0)}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full opacity-60" style={{ width: `${Math.min(100, m.b ?? 0)}%`, height: '50%', top: '25%' }} />
                </div>
                <span className="text-xs font-heading font-semibold text-foreground w-12 text-right">{Math.round(m.b ?? 0)}</span>
                <span className={`text-xs font-heading font-bold w-12 text-right ${d.color}`}>{d.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score delta highlight */}
      <div className="card-premium p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Score Change</div>
        <div className={`text-3xl font-heading font-bold ${scoreDelta.color}`}>{scoreDelta.label}</div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {scoreDelta.value > 0 ? '📈 Improvement' : scoreDelta.value < 0 ? '📉 Decline' : '➡️ No change'}
        </div>
      </div>
    </div>
  );
};

export default SessionComparison;
