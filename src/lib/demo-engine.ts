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

// 90-120s scenario: stable → confusion spike → insight → break → recovery → strong finish
function getScenarioMultiplier(t: number, totalDuration: number = 100): { traitMult: number; confusionMult: number; fatigueMult: number } {
  const phase = t / totalDuration;
  if (phase < 0.2) return { traitMult: 1.0, confusionMult: 1.0, fatigueMult: 1.0 }; // stable
  if (phase < 0.4) return { traitMult: 0.92, confusionMult: 1.8, fatigueMult: 1.3 }; // confusion spike
  if (phase < 0.55) return { traitMult: 0.97, confusionMult: 1.2, fatigueMult: 1.1 }; // insight triggers
  if (phase < 0.7) return { traitMult: 1.0, confusionMult: 0.8, fatigueMult: 0.85 }; // break
  if (phase < 0.85) return { traitMult: 1.05, confusionMult: 0.7, fatigueMult: 0.9 }; // recovery bump
  return { traitMult: 1.08, confusionMult: 0.65, fatigueMult: 0.8 }; // strong finish
}

// Seeded deterministic random
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function generateDemoPayload(personaKey: string, tick: number): GenomePayload {
  const persona = PERSONAS[personaKey] || PERSONAS.visual_thinker;
  const scenarioDuration = 100;
  const cycleTick = tick % scenarioDuration;
  const { traitMult, confusionMult, fatigueMult } = getScenarioMultiplier(cycleTick, scenarioDuration);

  const traits: Record<string, number> = {};
  TRAIT_DEFINITIONS.forEach((td, i) => {
    const base = persona.traits[td.key] || 60;
    const noise = (seededRandom(tick * 100 + i) - 0.5) * 8;
    traits[td.key] = Math.max(5, Math.min(98, base * traitMult + noise));
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

  const confNoise = (seededRandom(tick * 200 + 99) - 0.5) * 10;
  const fatNoise = (seededRandom(tick * 300 + 77) - 0.5) * 8;

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
      confusion_index: Math.max(0, Math.min(100, Math.round((persona.confusionBase * confusionMult + confNoise) * 10) / 10)),
      fatigue_index: Math.max(0, Math.min(100, Math.round((persona.fatigueBase * fatigueMult + fatNoise) * 10) / 10)),
    },
    timestamp: Date.now(),
  };
}
