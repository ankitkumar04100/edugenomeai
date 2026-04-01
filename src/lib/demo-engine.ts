import { GenomePayload, GenomeCategory, TRAIT_DEFINITIONS } from './genome-types';

interface PersonaBaseline {
  name: string;
  description: string;
  traits: Record<string, number>;
  confusionBase: number;
  fatigueBase: number;
}

export const PERSONAS: Record<string, PersonaBaseline> = {
  visual_thinker: {
    name: 'Visual Pattern Thinker',
    description: 'High visual, strong pattern recognition, medium fatigue',
    traits: {
      pattern_recognition: 78, concept_absorption: 65, abstract_thinking: 71, memory_retention: 70, logical_deduction: 75, error_recovery_time: 62,
      focus_stability: 70, eye_movement_smoothness: 74, distraction_vulnerability: 39, persistence_vs_avoidance: 66, confidence_drift: 58, task_switching_efficiency: 64,
      visual_learning: 82, auditory_learning: 61, textual_affinity: 69, interaction_engagement: 75, repetition_comfort: 64, long_short_form_pref: 57,
      speed_accuracy_balance: 73, difficulty_adaptation: 69, confusion_sensitivity: 42, learning_fatigue_rate: 55, mistake_pattern_fingerprint: 61, cross_concept_linking: 69,
    },
    confusionBase: 28,
    fatigueBase: 38,
  },
  text_analyst: {
    name: 'Text-Precise Analyst',
    description: 'High textual affinity, slow but accurate, low confusion sensitivity',
    traits: {
      pattern_recognition: 63, concept_absorption: 72, abstract_thinking: 68, memory_retention: 77, logical_deduction: 80, error_recovery_time: 55,
      focus_stability: 82, eye_movement_smoothness: 68, distraction_vulnerability: 28, persistence_vs_avoidance: 78, confidence_drift: 72, task_switching_efficiency: 58,
      visual_learning: 52, auditory_learning: 58, textual_affinity: 88, interaction_engagement: 55, repetition_comfort: 75, long_short_form_pref: 80,
      speed_accuracy_balance: 45, difficulty_adaptation: 76, confusion_sensitivity: 30, learning_fatigue_rate: 42, mistake_pattern_fingerprint: 38, cross_concept_linking: 74,
    },
    confusionBase: 18,
    fatigueBase: 32,
  },
  fast_risk_taker: {
    name: 'Fast Risk-Taker',
    description: 'Fast responses, lower accuracy, high correction count, fluctuating confidence',
    traits: {
      pattern_recognition: 70, concept_absorption: 58, abstract_thinking: 65, memory_retention: 55, logical_deduction: 62, error_recovery_time: 78,
      focus_stability: 52, eye_movement_smoothness: 58, distraction_vulnerability: 65, persistence_vs_avoidance: 72, confidence_drift: 42, task_switching_efficiency: 80,
      visual_learning: 70, auditory_learning: 68, textual_affinity: 45, interaction_engagement: 85, repetition_comfort: 40, long_short_form_pref: 35,
      speed_accuracy_balance: 88, difficulty_adaptation: 58, confusion_sensitivity: 62, learning_fatigue_rate: 68, mistake_pattern_fingerprint: 75, cross_concept_linking: 55,
    },
    confusionBase: 42,
    fatigueBase: 48,
  },
};

// Fixed deterministic timelines for each persona (10 checkpoints over 120s, indices 0..9)
// Each trait gets a fixed delta pattern: [checkpoint0_delta, checkpoint1_delta, ...]
// These deltas are added to the baseline to produce the final value at each checkpoint.

const DETERMINISTIC_TRAIT_DELTAS: Record<string, number[]> = {
  // 10 checkpoints: t=0,12,24,36,48,60,72,84,96,108 (loop every 120s)
  // Pattern: stable → dip → spike → recovery → strong finish
  pattern_recognition:         [0, 0, -3, -5, 2, 4, 6, 5, 3, 2],
  concept_absorption:          [0, 1, -2, -4, -1, 3, 5, 4, 3, 2],
  abstract_thinking:           [0, 0, -1, -3, 0, 2, 4, 3, 2, 1],
  memory_retention:            [0, 1, 0, -2, -1, 1, 3, 4, 3, 2],
  logical_deduction:           [0, 0, -2, -4, 1, 3, 5, 4, 3, 2],
  error_recovery_time:         [0, -1, -4, -6, -2, 2, 5, 6, 4, 3],
  focus_stability:             [0, 1, -2, -8, -4, 0, 4, 6, 5, 3],
  eye_movement_smoothness:     [0, 0, -1, -5, -2, 1, 3, 4, 3, 2],
  distraction_vulnerability:   [0, 0, 3, 8, 5, 2, -1, -3, -2, -1],
  persistence_vs_avoidance:    [0, 1, 0, -4, -2, 1, 4, 5, 4, 3],
  confidence_drift:            [0, 0, -3, -8, -5, -2, 2, 5, 4, 3],
  task_switching_efficiency:   [0, 0, -1, -3, 0, 2, 3, 4, 3, 2],
  visual_learning:             [0, 0, 2, 4, 4, 3, 2, 2, 2, 2],
  auditory_learning:           [0, 0, 1, 1, 2, 2, 3, 2, 1, 1],
  textual_affinity:            [0, 0, -1, -2, 0, 1, 2, 2, 1, 1],
  interaction_engagement:      [0, 1, 0, -3, -1, 2, 4, 5, 4, 3],
  repetition_comfort:          [0, 0, 1, 2, 1, 0, -1, 0, 1, 1],
  long_short_form_pref:        [0, 0, 0, -2, -1, 0, 1, 2, 1, 0],
  speed_accuracy_balance:      [0, 0, -2, -5, -2, 1, 3, 4, 3, 2],
  difficulty_adaptation:       [0, 0, -1, -4, -1, 2, 4, 5, 4, 3],
  confusion_sensitivity:       [0, 0, 3, 7, 4, 1, -2, -3, -2, -1],
  learning_fatigue_rate:       [0, 1, 3, 5, 4, 2, 0, -1, 0, 0],
  mistake_pattern_fingerprint: [0, 0, 2, 5, 3, 1, -1, -2, -1, 0],
  cross_concept_linking:       [0, 0, -1, -3, 0, 2, 4, 5, 4, 3],
};

// Fixed confusion/fatigue timelines per persona
const CONFUSION_TIMELINE: Record<string, number[]> = {
  visual_thinker:  [28, 28, 30, 55, 55, 40, 34, 34, 34, 34],
  text_analyst:    [18, 18, 20, 35, 35, 25, 20, 18, 18, 18],
  fast_risk_taker: [42, 42, 48, 72, 72, 55, 45, 42, 42, 42],
};

const FATIGUE_TIMELINE: Record<string, number[]> = {
  visual_thinker:  [38, 40, 42, 48, 52, 50, 46, 44, 42, 40],
  text_analyst:    [32, 33, 35, 40, 44, 42, 38, 35, 33, 32],
  fast_risk_taker: [48, 50, 54, 62, 68, 64, 58, 52, 50, 48],
};

// Session events at fixed timestamps
export interface DemoEvent {
  checkpoint: number; // 0-9
  type: 'confusion_spike' | 'fatigue_warning' | 'mistake_cluster' | 'visual_hint_used' | 'improvement' | 'break_suggested';
  label: string;
}

export const DEMO_EVENTS: Record<string, DemoEvent[]> = {
  visual_thinker: [
    { checkpoint: 3, type: 'confusion_spike', label: 'Confusion spike detected' },
    { checkpoint: 4, type: 'mistake_cluster', label: 'Mistake cluster (visual errors)' },
    { checkpoint: 5, type: 'visual_hint_used', label: 'Visual hint provided' },
    { checkpoint: 6, type: 'improvement', label: 'Performance recovering' },
    { checkpoint: 8, type: 'improvement', label: 'Strong finish' },
  ],
  text_analyst: [
    { checkpoint: 3, type: 'confusion_spike', label: 'Mild confusion on complex text' },
    { checkpoint: 4, type: 'fatigue_warning', label: 'Fatigue building slowly' },
    { checkpoint: 6, type: 'improvement', label: 'Steady recovery with text hints' },
    { checkpoint: 8, type: 'improvement', label: 'Consistent strong finish' },
  ],
  fast_risk_taker: [
    { checkpoint: 2, type: 'mistake_cluster', label: 'Rapid errors from rushing' },
    { checkpoint: 3, type: 'confusion_spike', label: 'High confusion from speed' },
    { checkpoint: 4, type: 'fatigue_warning', label: 'Fatigue spike from intensity' },
    { checkpoint: 5, type: 'break_suggested', label: 'Break recommended' },
    { checkpoint: 7, type: 'improvement', label: 'Post-break improvement' },
  ],
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateTimeline(values: number[], tickInCycle: number, totalTicks: number): number {
  const segments = values.length - 1;
  const position = (tickInCycle / totalTicks) * segments;
  const idx = Math.min(Math.floor(position), segments - 1);
  const frac = position - idx;
  return lerp(values[idx], values[idx + 1], frac);
}

export function generateDemoPayload(personaKey: string, tick: number): GenomePayload {
  const persona = PERSONAS[personaKey] || PERSONAS.visual_thinker;
  const key = personaKey in CONFUSION_TIMELINE ? personaKey : 'visual_thinker';

  // 80 ticks per cycle at 1.5s = 120s
  const totalTicks = 80;
  const cycleTick = tick % totalTicks;

  const confusionValues = CONFUSION_TIMELINE[key];
  const fatigueValues = FATIGUE_TIMELINE[key];

  const traits: Record<string, number> = {};
  TRAIT_DEFINITIONS.forEach((td) => {
    const base = persona.traits[td.key] || 60;
    const deltas = DETERMINISTIC_TRAIT_DELTAS[td.key] || [0,0,0,0,0,0,0,0,0,0];
    const delta = interpolateTimeline(deltas, cycleTick, totalTicks);
    traits[td.key] = Math.max(5, Math.min(98, base + delta));
  });

  const categories: Record<GenomeCategory, number> = {
    cognitive: 0, behavioral: 0, learning_style: 0, performance: 0,
  };
  const counts: Record<GenomeCategory, number> = { cognitive: 0, behavioral: 0, learning_style: 0, performance: 0 };
  TRAIT_DEFINITIONS.forEach(td => {
    categories[td.category] += traits[td.key];
    counts[td.category]++;
  });
  (Object.keys(categories) as GenomeCategory[]).forEach(k => {
    categories[k] = categories[k] / counts[k];
  });

  const overall = Object.values(categories).reduce((a, b) => a + b, 0) / 4;

  const ci = interpolateTimeline(confusionValues, cycleTick, totalTicks);
  const fi = interpolateTimeline(fatigueValues, cycleTick, totalTicks);

  return {
    overall_genome_score: Math.round(overall * 10) / 10,
    categories: {
      cognitive: Math.round(categories.cognitive * 10) / 10,
      behavioral: Math.round(categories.behavioral * 10) / 10,
      learning_style: Math.round(categories.learning_style * 10) / 10,
      performance: Math.round(categories.performance * 10) / 10,
    },
    traits: Object.fromEntries(Object.entries(traits).map(([k, v]) => [k, Math.round(v * 10) / 10])),
    indices: {
      confusion_index: Math.max(0, Math.min(100, Math.round(ci * 10) / 10)),
      fatigue_index: Math.max(0, Math.min(100, Math.round(fi * 10) / 10)),
    },
    timestamp: Date.now(),
  };
}

// Generate full deterministic replay timeline for a persona
export function generateDemoReplayTimeline(personaKey: string): Array<{
  t: number;
  tick: number;
  traits: Record<string, number>;
  indices: { confusion_index: number; fatigue_index: number };
  events: string[];
}> {
  const totalTicks = 80;
  const events = DEMO_EVENTS[personaKey] || DEMO_EVENTS.visual_thinker;
  const timeline: Array<any> = [];

  for (let tick = 0; tick <= totalTicks; tick += 2) {
    const payload = generateDemoPayload(personaKey, tick);
    const checkpoint = Math.floor((tick / totalTicks) * 9.99);
    const tickEvents = events
      .filter(e => e.checkpoint === checkpoint)
      .map(e => e.label);

    timeline.push({
      t: Math.round((tick / totalTicks) * 120),
      tick,
      traits: payload.traits,
      indices: payload.indices,
      events: tickEvents,
    });
  }

  return timeline;
}
