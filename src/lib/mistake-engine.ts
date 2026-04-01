// Mistake Pattern Fingerprinting
export type MistakeType = 'logical' | 'visual' | 'conceptual';

export interface MistakeEvent {
  timestamp: number;
  questionId: string;
  type: MistakeType;
  description: string;
}

export interface MistakeFingerprint {
  logical: number;
  visual: number;
  conceptual: number;
  total: number;
  clusterFrequency: number;
  dominantType: MistakeType;
}

// Rule-based classification
export function classifyMistake(questionType: string, hintType: string | null, responseTime: number): MistakeType {
  if (responseTime < 2 && !hintType) return 'logical'; // too fast = didn't think through
  if (questionType === 'image' || hintType === 'visual') return 'visual';
  return 'conceptual';
}

export function computeFingerprint(mistakes: MistakeEvent[]): MistakeFingerprint {
  const counts = { logical: 0, visual: 0, conceptual: 0 };
  mistakes.forEach(m => counts[m.type]++);
  const total = mistakes.length;
  const dominant: MistakeType = counts.logical >= counts.visual && counts.logical >= counts.conceptual
    ? 'logical'
    : counts.visual >= counts.conceptual ? 'visual' : 'conceptual';

  // Cluster frequency: mistakes within 10s of each other
  let clusters = 0;
  for (let i = 1; i < mistakes.length; i++) {
    if (mistakes[i].timestamp - mistakes[i - 1].timestamp < 10000) clusters++;
  }

  return {
    ...counts,
    total,
    clusterFrequency: total > 0 ? Math.round((clusters / Math.max(total - 1, 1)) * 100) / 100 : 0,
    dominantType: dominant,
  };
}
