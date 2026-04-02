// Trait Engine Abstraction — supports Demo, Rule-Based, and ML modes
import type { GenomePayload } from './genome-types';
import { generateDemoPayload } from './demo-engine';
import { TRAIT_DEFINITIONS } from './genome-types';
import type { EyeMetrics } from './eye-tracker';

export type TraitEngineMode = 'demo' | 'rule-based' | 'ml';

interface MetricsBatch {
  avg_response_time?: number;
  response_time_std?: number;
  hesitation_delta?: number;
  correction_count?: number;
  error_recovery_time?: number;
  speed_accuracy_delta?: number;
  difficulty_response_slope?: number;
  confidence_drift?: number;
  mistake_cluster_frequency?: number;
  fatigue_spike_index?: number;
  visual_focus_ratio?: number;
  text_scroll_rate?: number;
  audio_hint_usage_rate?: number;
  interaction_engagement_score?: number;
  eye?: EyeMetrics;
}

// Rule-based trait inference from raw metrics
function ruleBasedInfer(metrics: MetricsBatch, prevGenome?: GenomePayload): GenomePayload {
  const eye = metrics.eye;
  const base: Record<string, number> = {};
  
  // Cognitive traits — derived from response patterns
  base.pattern_recognition = clamp(70 + (metrics.speed_accuracy_delta || 0) * 50 - (metrics.hesitation_delta || 0) * 30);
  base.concept_absorption = clamp(65 + (1 - (metrics.avg_response_time || 2) / 5) * 30);
  base.abstract_thinking = clamp(68 + (metrics.difficulty_response_slope || 0) * 40);
  base.memory_retention = clamp(70 - (metrics.correction_count || 0) * 5);
  base.logical_deduction = clamp(72 + (metrics.speed_accuracy_delta || 0) * 40);
  base.error_recovery_time = clamp(60 + (1 - (metrics.error_recovery_time || 1.5) / 3) * 40);

  // Behavioral traits — derived from eye tracking
  if (eye) {
    base.focus_stability = clamp(50 + (1 - eye.gaze_drift_velocity / 2) * 40 + (eye.fixation_duration_mean / 5) * 20);
    base.eye_movement_smoothness = clamp(50 + (1 - eye.saccade_frequency) * 40);
    base.distraction_vulnerability = clamp(30 + eye.look_away_frequency * 50 + eye.gaze_drift_velocity * 20);
    base.confidence_drift = clamp(55 + (metrics.confidence_drift || 0) * 50);
    base.task_switching_efficiency = clamp(60 + (1 - eye.saccade_frequency / 2) * 30);
    base.persistence_vs_avoidance = clamp(65 - eye.look_away_frequency * 30 + (1 - (metrics.hesitation_delta || 0)) * 20);
  } else {
    base.focus_stability = 65;
    base.eye_movement_smoothness = 68;
    base.distraction_vulnerability = 40;
    base.confidence_drift = clamp(55 + (metrics.confidence_drift || 0) * 50);
    base.task_switching_efficiency = 62;
    base.persistence_vs_avoidance = 65;
  }

  // Learning style traits
  base.visual_learning = clamp(60 + (metrics.visual_focus_ratio || 0.5) * 40);
  base.auditory_learning = clamp(55 + (metrics.audio_hint_usage_rate || 0.2) * 50);
  base.textual_affinity = clamp(55 + Math.min((metrics.text_scroll_rate || 200) / 500, 1) * 40);
  base.interaction_engagement = clamp(55 + (metrics.interaction_engagement_score || 0.5) * 40);
  base.repetition_comfort = clamp(60);
  base.long_short_form_pref = clamp(55);

  // Performance traits
  base.speed_accuracy_balance = clamp(65 + (metrics.speed_accuracy_delta || 0) * 50);
  base.difficulty_adaptation = clamp(65 + (metrics.difficulty_response_slope || 0) * 40);
  base.confusion_sensitivity = clamp(40 + (metrics.hesitation_delta || 0) * 60 + (metrics.correction_count || 0) * 5);
  base.learning_fatigue_rate = clamp(40 + (metrics.fatigue_spike_index || 0) * 60 + (eye ? eye.blink_rate / 40 * 20 : 0));
  base.mistake_pattern_fingerprint = clamp(55 + (metrics.mistake_cluster_frequency || 0) * 50);
  base.cross_concept_linking = clamp(65 + (metrics.speed_accuracy_delta || 0) * 30);

  // Apply EMA with previous genome if available
  if (prevGenome && Object.keys(prevGenome.traits).length > 0) {
    for (const key of Object.keys(base)) {
      const prev = (prevGenome.traits as any)[key];
      if (prev !== undefined) {
        base[key] = prev * 0.7 + base[key] * 0.3;
      }
    }
  }

  // Compute categories
  const categories = { cognitive: 0, behavioral: 0, learning_style: 0, performance: 0 };
  const catCounts = { cognitive: 0, behavioral: 0, learning_style: 0, performance: 0 };
  for (const def of TRAIT_DEFINITIONS) {
    const val = base[def.key] || 50;
    categories[def.category] += val;
    catCounts[def.category]++;
  }
  for (const cat of Object.keys(categories) as Array<keyof typeof categories>) {
    categories[cat] = catCounts[cat] > 0 ? categories[cat] / catCounts[cat] : 50;
  }

  // Confusion index
  const confusion = clamp(
    (metrics.hesitation_delta || 0) * 80 +
    (metrics.correction_count || 0) * 8 +
    (eye ? eye.gaze_drift_velocity * 20 : 10) +
    10
  );

  // Fatigue index
  const fatigue = clamp(
    (metrics.fatigue_spike_index || 0) * 60 +
    (eye ? (eye.blink_rate / 30) * 30 : 15) +
    (metrics.avg_response_time || 1.5) * 5 +
    10
  );

  const overall = (categories.cognitive + categories.behavioral + categories.learning_style + categories.performance) / 4;

  return {
    overall_genome_score: overall,
    categories,
    traits: base,
    indices: { confusion_index: confusion, fatigue_index: fatigue },
    timestamp: Date.now(),
  };
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export class TraitEngine {
  private mode: TraitEngineMode = 'demo';
  private prevGenome: GenomePayload | null = null;

  setMode(mode: TraitEngineMode) {
    this.mode = mode;
  }

  getMode(): TraitEngineMode {
    return this.mode;
  }

  infer(tick: number, persona: string, metrics?: MetricsBatch): GenomePayload {
    let result: GenomePayload;

    switch (this.mode) {
      case 'demo':
        result = generateDemoPayload(persona, tick);
        break;
      case 'rule-based':
        result = ruleBasedInfer(metrics || {}, this.prevGenome || undefined);
        break;
      case 'ml':
        // ML mode placeholder — falls back to rule-based
        console.info('[TraitEngine] ML mode: no model loaded, falling back to rule-based');
        result = ruleBasedInfer(metrics || {}, this.prevGenome || undefined);
        break;
      default:
        result = generateDemoPayload(persona, tick);
    }

    this.prevGenome = result;
    return result;
  }

  reset() {
    this.prevGenome = null;
  }
}

export const traitEngine = new TraitEngine();
