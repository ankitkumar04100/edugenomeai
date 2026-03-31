import { GenomePayload, Insight } from './genome-types';

let insightCounter = 0;

export function generateInsights(genome: GenomePayload): Insight[] {
  const insights: Insight[] = [];
  const t = genome.traits;
  const idx = genome.indices;

  if (t.focus_stability < 55) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'warning', trait: 'focus_stability', message: 'Focus Stability is declining', action: 'Shorten session, add visual anchors, reduce on-screen clutter.', icon: '👁️' });
  }
  if (t.pattern_recognition > 75) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'info', trait: 'pattern_recognition', message: 'Strong Pattern Recognition detected', action: 'Use diagrams, abstractions, and concept maps to leverage this strength.', icon: '🧩' });
  }
  if (idx.fatigue_index > 65) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'critical', trait: 'fatigue', message: 'Fatigue Index is HIGH', action: 'Recommend 3–5 minute break; switch to short-form content.', icon: '😴' });
  }
  if (idx.confusion_index > 60) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'critical', trait: 'confusion', message: 'Confusion Index is elevated', action: 'Simplify current material; break into smaller steps.', icon: '❓' });
  }
  if (t.confidence_drift < 50) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'warning', trait: 'confidence_drift', message: 'Confidence is drifting downward', action: 'Provide encouragement + easier stepping-stone problems.', icon: '💪' });
  }
  if (t.visual_learning > 75) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'info', trait: 'visual_learning', message: 'Visual Learning preference detected', action: 'Prefer visual-first explanations with charts and videos.', icon: '🎨' });
  }
  if (t.learning_fatigue_rate > 65) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'warning', trait: 'learning_fatigue_rate', message: 'Learning fatigue accumulating fast', action: 'Schedule breaks every 20 minutes; vary task types.', icon: '⚡' });
  }
  if (t.distraction_vulnerability > 60) {
    insights.push({ id: `i-${++insightCounter}`, severity: 'warning', trait: 'distraction_vulnerability', message: 'High distraction vulnerability', action: 'Enable full-screen mode; minimize UI elements.', icon: '🔕' });
  }

  return insights.slice(0, 5);
}
