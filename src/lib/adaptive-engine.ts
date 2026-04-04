// Adaptive Learning Orchestrator — runs every genome tick, outputs actions
import type { GenomePayload } from './genome-types';

export type DifficultyAction = 'UP' | 'DOWN' | 'HOLD';
export type PacingAction = 'CONTINUE' | 'MICROBREAK' | 'SLOW_MODE';
export type HintSuggestion = 'VISUAL' | 'AUDIO' | 'TEXT' | 'NONE';
export type UIMode = 'NORMAL' | 'DISTRACTION_MIN' | 'STEP_BY_STEP';
export type QuestionType = 'MCQ' | 'VISUAL' | 'SHORT_TEXT' | 'INTERACTIVE';

export interface OrchestratorAction {
  difficulty_action: DifficultyAction;
  pacing_action: PacingAction;
  hint_suggestion: HintSuggestion;
  ui_mode: UIMode;
  next_question_type: QuestionType;
}

export interface OrchestratorDecision {
  tick: number;
  timestamp: number;
  sessionTimeSec: number;
  action: OrchestratorAction;
  reason: string;
  interventionType: string | null;
  expectedEffect: string;
  outcome?: 'improved' | 'unchanged' | 'worse';
}

interface OrchestratorState {
  confusionHistory: number[];
  fatigueHistory: number[];
  accuracyHistory: number[];
  responseTimeHistory: number[];
  decisions: OrchestratorDecision[];
  consecutiveHighConfusion: number;
  lastMicrobreakTick: number;
  voiceEnabled: boolean;
}

// Deterministic demo orchestrator decisions for each persona at fixed checkpoints
const DEMO_DECISIONS: Record<string, Array<{ checkpoint: number; decision: Omit<OrchestratorDecision, 'tick' | 'timestamp' | 'sessionTimeSec'> }>> = {
  visual_thinker: [
    { checkpoint: 3, decision: { action: { difficulty_action: 'DOWN', pacing_action: 'SLOW_MODE', hint_suggestion: 'VISUAL', ui_mode: 'STEP_BY_STEP', next_question_type: 'VISUAL' }, reason: 'Confusion Index 55 for 2+ ticks', interventionType: 'confusion_intervention', expectedEffect: 'Reduce cognitive load with visual step-by-step' } },
    { checkpoint: 4, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'CONTINUE', hint_suggestion: 'VISUAL', ui_mode: 'STEP_BY_STEP', next_question_type: 'VISUAL' }, reason: 'Sustained confusion + mistake cluster', interventionType: 'confusion_intervention', expectedEffect: 'Continue visual scaffolding', outcome: 'unchanged' } },
    { checkpoint: 5, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'CONTINUE', hint_suggestion: 'NONE', ui_mode: 'NORMAL', next_question_type: 'MCQ' }, reason: 'Confusion recovering to 40', interventionType: null, expectedEffect: 'Transition back to normal mode', outcome: 'improved' } },
    { checkpoint: 7, decision: { action: { difficulty_action: 'UP', pacing_action: 'CONTINUE', hint_suggestion: 'NONE', ui_mode: 'NORMAL', next_question_type: 'MCQ' }, reason: 'Strong recovery — score improving', interventionType: null, expectedEffect: 'Increase challenge', outcome: 'improved' } },
  ],
  text_analyst: [
    { checkpoint: 3, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'CONTINUE', hint_suggestion: 'TEXT', ui_mode: 'NORMAL', next_question_type: 'SHORT_TEXT' }, reason: 'Mild confusion on complex text', interventionType: 'confusion_intervention', expectedEffect: 'Provide structured text breakdown' } },
    { checkpoint: 4, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'SLOW_MODE', hint_suggestion: 'TEXT', ui_mode: 'NORMAL', next_question_type: 'MCQ' }, reason: 'Fatigue building, accuracy stable', interventionType: 'fatigue_intervention', expectedEffect: 'Slow pace to manage fatigue', outcome: 'unchanged' } },
    { checkpoint: 6, decision: { action: { difficulty_action: 'UP', pacing_action: 'CONTINUE', hint_suggestion: 'NONE', ui_mode: 'NORMAL', next_question_type: 'SHORT_TEXT' }, reason: 'Steady recovery with text hints', interventionType: null, expectedEffect: 'Increase difficulty', outcome: 'improved' } },
  ],
  fast_risk_taker: [
    { checkpoint: 2, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'SLOW_MODE', hint_suggestion: 'TEXT', ui_mode: 'DISTRACTION_MIN', next_question_type: 'MCQ' }, reason: 'Speed-accuracy imbalance: fast guessing', interventionType: 'speed_accuracy_intervention', expectedEffect: 'Force slower pace, minimize distractions' } },
    { checkpoint: 3, decision: { action: { difficulty_action: 'DOWN', pacing_action: 'SLOW_MODE', hint_suggestion: 'VISUAL', ui_mode: 'STEP_BY_STEP', next_question_type: 'VISUAL' }, reason: 'Confusion Index 72 for 2 ticks', interventionType: 'confusion_intervention', expectedEffect: 'Reduce difficulty + step-by-step', outcome: 'unchanged' } },
    { checkpoint: 4, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'MICROBREAK', hint_suggestion: 'AUDIO', ui_mode: 'NORMAL', next_question_type: 'MCQ' }, reason: 'Fatigue Index 68', interventionType: 'fatigue_intervention', expectedEffect: 'Micro-break to reset energy', outcome: 'unchanged' } },
    { checkpoint: 5, decision: { action: { difficulty_action: 'HOLD', pacing_action: 'CONTINUE', hint_suggestion: 'NONE', ui_mode: 'NORMAL', next_question_type: 'MCQ' }, reason: 'Break completed, fatigue reducing', interventionType: null, expectedEffect: 'Resume normal flow', outcome: 'improved' } },
    { checkpoint: 7, decision: { action: { difficulty_action: 'UP', pacing_action: 'CONTINUE', hint_suggestion: 'NONE', ui_mode: 'NORMAL', next_question_type: 'INTERACTIVE' }, reason: 'Post-break improvement confirmed', interventionType: null, expectedEffect: 'Leverage improved state', outcome: 'improved' } },
  ],
};

export class AdaptiveOrchestrator {
  private state: OrchestratorState = {
    confusionHistory: [],
    fatigueHistory: [],
    accuracyHistory: [],
    responseTimeHistory: [],
    decisions: [],
    consecutiveHighConfusion: 0,
    lastMicrobreakTick: -999,
    voiceEnabled: false,
  };

  reset() {
    this.state = {
      confusionHistory: [],
      fatigueHistory: [],
      accuracyHistory: [],
      responseTimeHistory: [],
      decisions: [],
      consecutiveHighConfusion: 0,
      lastMicrobreakTick: -999,
      voiceEnabled: false,
    };
  }

  setVoiceEnabled(enabled: boolean) {
    this.state.voiceEnabled = enabled;
  }

  getDecisions(): OrchestratorDecision[] {
    return this.state.decisions;
  }

  getLastDecision(): OrchestratorDecision | null {
    return this.state.decisions.length > 0 ? this.state.decisions[this.state.decisions.length - 1] : null;
  }

  // For demo mode: return deterministic decisions based on persona + tick
  inferDemo(tick: number, persona: string): OrchestratorDecision | null {
    const totalTicks = 80;
    const cycleTick = tick % totalTicks;
    const checkpoint = Math.floor((cycleTick / totalTicks) * 9.99);
    const sessionTimeSec = Math.round((cycleTick / totalTicks) * 120);

    const personaDecisions = DEMO_DECISIONS[persona] || DEMO_DECISIONS.visual_thinker;
    const match = personaDecisions.find(d => d.checkpoint === checkpoint);

    if (match) {
      const decision: OrchestratorDecision = {
        tick,
        timestamp: Date.now(),
        sessionTimeSec,
        ...match.decision,
      };
      // Avoid duplicates
      if (!this.state.decisions.find(d => d.sessionTimeSec === sessionTimeSec && d.interventionType === decision.interventionType)) {
        this.state.decisions.push(decision);
      }
      return decision;
    }
    return null;
  }

  // For live mode: real rule-based inference
  inferLive(tick: number, genome: GenomePayload, practiceStats?: { accuracy: number; avgRT: number }): OrchestratorDecision | null {
    const ci = genome.indices.confusion_index;
    const fi = genome.indices.fatigue_index;
    const sessionTimeSec = Math.round(tick * 1.5);

    this.state.confusionHistory.push(ci);
    this.state.fatigueHistory.push(fi);
    if (practiceStats) {
      this.state.accuracyHistory.push(practiceStats.accuracy);
      this.state.responseTimeHistory.push(practiceStats.avgRT);
    }

    // Track consecutive high confusion
    if (ci > 70) {
      this.state.consecutiveHighConfusion++;
    } else {
      this.state.consecutiveHighConfusion = 0;
    }

    const traits = genome.traits;
    let action: OrchestratorAction = {
      difficulty_action: 'HOLD',
      pacing_action: 'CONTINUE',
      hint_suggestion: 'NONE',
      ui_mode: 'NORMAL',
      next_question_type: 'MCQ',
    };
    let reason = '';
    let interventionType: string | null = null;
    let expectedEffect = '';

    // 1. Confusion intervention
    if (this.state.consecutiveHighConfusion >= 2) {
      action.difficulty_action = 'DOWN';
      action.ui_mode = 'STEP_BY_STEP';
      action.pacing_action = 'SLOW_MODE';
      action.hint_suggestion = (traits.visual_learning || 60) > 50 ? 'VISUAL' : 'TEXT';
      reason = `Confusion Index ${Math.round(ci)} for ${this.state.consecutiveHighConfusion} consecutive ticks`;
      interventionType = 'confusion_intervention';
      expectedEffect = 'Reduce cognitive load with step-by-step scaffolding';
    }
    // 2. Fatigue intervention
    else if (fi > 65) {
      const ticksSinceBreak = tick - this.state.lastMicrobreakTick;
      if (ticksSinceBreak > 20) {
        action.pacing_action = 'MICROBREAK';
        this.state.lastMicrobreakTick = tick;
      } else {
        action.pacing_action = 'SLOW_MODE';
      }
      action.next_question_type = 'SHORT_TEXT';
      action.hint_suggestion = this.state.voiceEnabled ? 'AUDIO' : 'TEXT';
      reason = `Fatigue Index ${Math.round(fi)}`;
      interventionType = 'fatigue_intervention';
      expectedEffect = 'Micro-break to reset cognitive energy';
    }
    // 3. Speed-accuracy imbalance
    else if (practiceStats && practiceStats.accuracy < 0.5 && practiceStats.avgRT < 3) {
      action.pacing_action = 'SLOW_MODE';
      action.ui_mode = 'DISTRACTION_MIN';
      action.hint_suggestion = 'TEXT';
      reason = `Speed-accuracy imbalance: ${Math.round(practiceStats.accuracy * 100)}% acc, ${practiceStats.avgRT.toFixed(1)}s avg RT`;
      interventionType = 'speed_accuracy_intervention';
      expectedEffect = 'Force slower pace to improve accuracy';
    }
    // 4. Learning style routing
    else if ((traits.visual_learning || 60) > 75) {
      action.next_question_type = 'VISUAL';
      action.hint_suggestion = 'VISUAL';
      reason = `Visual Learning trait high (${Math.round(traits.visual_learning || 0)})`;
      interventionType = null;
      expectedEffect = 'Route to visual-first content';
    } else if ((traits.textual_affinity || 60) > 75) {
      action.hint_suggestion = 'TEXT';
      action.next_question_type = 'SHORT_TEXT';
      reason = `Textual Affinity high (${Math.round(traits.textual_affinity || 0)})`;
      interventionType = null;
      expectedEffect = 'Route to text-first content';
    } else if (this.state.voiceEnabled && (traits.auditory_learning || 60) > 70) {
      action.hint_suggestion = 'AUDIO';
      reason = `Auditory Learning high + voice enabled`;
      interventionType = null;
      expectedEffect = 'Route to audio-first hints';
    } else {
      // No intervention needed
      return null;
    }

    // Compute outcome from previous decision
    if (this.state.decisions.length > 0) {
      const prev = this.state.decisions[this.state.decisions.length - 1];
      if (!prev.outcome && this.state.accuracyHistory.length >= 2) {
        const recentAcc = this.state.accuracyHistory[this.state.accuracyHistory.length - 1];
        const prevAcc = this.state.accuracyHistory[this.state.accuracyHistory.length - 2];
        prev.outcome = recentAcc > prevAcc + 0.05 ? 'improved' : recentAcc < prevAcc - 0.05 ? 'worse' : 'unchanged';
      }
    }

    const decision: OrchestratorDecision = {
      tick,
      timestamp: Date.now(),
      sessionTimeSec,
      action,
      reason,
      interventionType,
      expectedEffect,
    };

    this.state.decisions.push(decision);
    return decision;
  }
}

export const orchestrator = new AdaptiveOrchestrator();
