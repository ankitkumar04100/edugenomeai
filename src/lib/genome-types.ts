export type GenomeCategory = 'cognitive' | 'behavioral' | 'learning_style' | 'performance';

export interface TraitDefinition {
  key: string;
  name: string;
  category: GenomeCategory;
  definition: string;
  whyItMatters: string;
  signals: string[];
  tip: string;
}

export interface GenomePayload {
  overall_genome_score: number;
  categories: Record<GenomeCategory, number>;
  traits: Record<string, number>;
  indices: { confusion_index: number; fatigue_index: number };
  timestamp: number;
}

export interface MetricsBatch {
  session_id: string;
  mode: 'live' | 'demo';
  metrics: Record<string, number>;
  timestamp: number;
}

export interface SessionInfo {
  id: string;
  userId: string;
  mode: 'live' | 'demo';
  persona?: string;
  startTime: number;
  endTime?: number;
  history: GenomePayload[];
}

export interface Insight {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  trait: string;
  message: string;
  action: string;
  icon: string;
}

export const CATEGORY_COLORS: Record<GenomeCategory, string> = {
  cognitive: '#3B82F6',
  behavioral: '#A855F7',
  learning_style: '#10B981',
  performance: '#F97316',
};

export const CATEGORY_LABELS: Record<GenomeCategory, string> = {
  cognitive: 'Cognitive',
  behavioral: 'Behavioral',
  learning_style: 'Learning Style',
  performance: 'Performance',
};

export const TRAIT_DEFINITIONS: TraitDefinition[] = [
  // Cognitive (6)
  { key: 'pattern_recognition', name: 'Pattern Recognition Speed', category: 'cognitive', definition: 'How quickly a student identifies recurring patterns in data or problems.', whyItMatters: 'Faster pattern recognition enables abstract thinking and problem-solving.', signals: ['avg_response_time', 'time_to_first_focus'], tip: 'Practice with visual puzzles and sequence games.' },
  { key: 'concept_absorption', name: 'Concept Absorption', category: 'cognitive', definition: 'Rate at which new concepts are internalized during learning.', whyItMatters: 'Higher absorption means less repetition needed.', signals: ['fixation_duration_mean', 'error_recovery_time'], tip: 'Use multi-modal explanations (visual + text).' },
  { key: 'abstract_thinking', name: 'Abstract Thinking', category: 'cognitive', definition: 'Ability to work with abstract concepts without concrete examples.', whyItMatters: 'Critical for advanced math, logic, and theory.', signals: ['hesitation_delta', 'gaze_variance'], tip: 'Introduce concepts with concrete examples first, then abstract.' },
  { key: 'memory_retention', name: 'Memory Retention', category: 'cognitive', definition: 'How well previously learned information is recalled.', whyItMatters: 'Retention reduces re-learning time and builds compound knowledge.', signals: ['response_time_std', 'correction_count'], tip: 'Use spaced repetition and active recall.' },
  { key: 'logical_deduction', name: 'Logical Deduction', category: 'cognitive', definition: 'Ability to derive conclusions from given premises.', whyItMatters: 'Foundation for scientific reasoning and debugging.', signals: ['avg_response_time', 'speed_accuracy_delta'], tip: 'Practice syllogisms and if-then reasoning chains.' },
  { key: 'error_recovery_time', name: 'Error Recovery Time', category: 'cognitive', definition: 'Time taken to recover and correct course after making an error.', whyItMatters: 'Quick recovery indicates resilience and adaptive learning.', signals: ['error_recovery_time', 'correction_count'], tip: 'Normalize mistakes as part of learning; provide immediate feedback.' },
  // Behavioral (6)
  { key: 'focus_stability', name: 'Focus Stability', category: 'behavioral', definition: 'Consistency of attention over time during a session.', whyItMatters: 'Stable focus correlates with deeper comprehension.', signals: ['fixation_duration_mean', 'gaze_drift_velocity'], tip: 'Remove distractions; use timed focus blocks.' },
  { key: 'eye_movement_smoothness', name: 'Eye-Movement Smoothness', category: 'behavioral', definition: 'How smooth and purposeful eye movements are during reading/scanning.', whyItMatters: 'Smooth movements indicate systematic processing.', signals: ['saccade_frequency', 'gaze_drift_velocity'], tip: 'Use guided reading tools and line trackers.' },
  { key: 'distraction_vulnerability', name: 'Distraction Vulnerability', category: 'behavioral', definition: 'Susceptibility to losing focus from external or internal stimuli.', whyItMatters: 'High vulnerability needs environmental controls.', signals: ['gaze_variance', 'saccade_frequency'], tip: 'Minimize on-screen clutter; use full-screen mode.' },
  { key: 'persistence_vs_avoidance', name: 'Persistence vs Avoidance', category: 'behavioral', definition: 'Whether a student persists through difficulty or avoids challenges.', whyItMatters: 'Persistence is a key predictor of long-term success.', signals: ['difficulty_response_slope', 'confidence_drift'], tip: 'Scaffold difficulty; celebrate persistence, not just accuracy.' },
  { key: 'confidence_drift', name: 'Confidence Drift', category: 'behavioral', definition: 'Trend in self-assuredness over a session (rising, falling, or stable).', whyItMatters: 'Declining confidence can lead to avoidance behaviors.', signals: ['confidence_drift', 'hesitation_delta'], tip: 'Provide encouragement and easier stepping-stones when drift is negative.' },
  { key: 'task_switching_efficiency', name: 'Task Switching Efficiency', category: 'behavioral', definition: 'How effectively a student transitions between different task types.', whyItMatters: 'Efficient switching reduces cognitive overhead.', signals: ['avg_response_time', 'time_to_first_focus'], tip: 'Use clear transitions and topic markers between tasks.' },
  // Learning Style (6)
  { key: 'visual_learning', name: 'Visual Learning', category: 'learning_style', definition: 'Preference and effectiveness when learning through visual materials.', whyItMatters: 'Visual learners benefit from diagrams, charts, and videos.', signals: ['visual_focus_ratio', 'fixation_duration_mean'], tip: 'Prefer visual-first explanations with diagrams and concept maps.' },
  { key: 'auditory_learning', name: 'Auditory Learning', category: 'learning_style', definition: 'Preference for learning through listening and verbal explanation.', whyItMatters: 'Auditory learners retain more from lectures and discussions.', signals: ['audio_hint_usage_rate'], tip: 'Include audio narration and verbal summaries.' },
  { key: 'textual_affinity', name: 'Textual Affinity', category: 'learning_style', definition: 'Comfort and effectiveness with text-based learning materials.', whyItMatters: 'High textual affinity supports self-paced reading.', signals: ['text_scroll_rate', 'fixation_duration_mean'], tip: 'Provide detailed written explanations and reading lists.' },
  { key: 'interaction_engagement', name: 'Interaction-Driven Engagement', category: 'learning_style', definition: 'How much interactive elements boost learning outcomes.', whyItMatters: 'Interactive learners thrive with hands-on exercises.', signals: ['interaction_engagement_score'], tip: 'Add drag-and-drop, quizzes, and interactive simulations.' },
  { key: 'repetition_comfort', name: 'Repetition Comfort', category: 'learning_style', definition: 'How well a student responds to repeated practice of similar problems.', whyItMatters: 'Some students need repetition; others need variety.', signals: ['mistake_cluster_frequency', 'response_time_std'], tip: 'Vary problem framing while keeping core concept consistent.' },
  { key: 'long_short_form_pref', name: 'Long/Short-form Preference', category: 'learning_style', definition: 'Whether a student prefers extended deep-dives or bite-sized content.', whyItMatters: 'Matching format to preference improves engagement.', signals: ['fatigue_spike_index', 'fixation_duration_mean'], tip: 'Offer both formats and let the student choose.' },
  // Performance (6)
  { key: 'speed_accuracy_balance', name: 'Speed–Accuracy Balance', category: 'performance', definition: 'Trade-off between response speed and correctness.', whyItMatters: 'Identifies whether a student rushes or overthinks.', signals: ['speed_accuracy_delta', 'avg_response_time'], tip: 'Coach awareness of personal speed-accuracy sweet spot.' },
  { key: 'difficulty_adaptation', name: 'Difficulty Adaptation', category: 'performance', definition: 'How well performance holds up as problem difficulty increases.', whyItMatters: 'Strong adapters handle challenge; weak adapters need scaffolding.', signals: ['difficulty_response_slope'], tip: 'Gradually increase difficulty with checkpoint reviews.' },
  { key: 'confusion_sensitivity', name: 'Confusion Sensitivity', category: 'performance', definition: 'How easily a student becomes confused by complex or ambiguous material.', whyItMatters: 'High sensitivity needs clearer explanations and structure.', signals: ['hesitation_delta', 'gaze_variance'], tip: 'Break complex topics into smaller, sequential steps.' },
  { key: 'learning_fatigue_rate', name: 'Learning Fatigue Rate', category: 'performance', definition: 'How quickly cognitive fatigue accumulates during a session.', whyItMatters: 'Faster fatigue means shorter optimal session windows.', signals: ['blink_rate', 'fatigue_spike_index'], tip: 'Schedule breaks every 20-25 minutes for fatigable learners.' },
  { key: 'mistake_pattern_fingerprint', name: 'Mistake Pattern Fingerprint', category: 'performance', definition: 'The characteristic pattern of errors a student makes.', whyItMatters: 'Identifying patterns enables targeted remediation.', signals: ['mistake_cluster_frequency', 'correction_count'], tip: 'Review error logs to find systematic misconceptions.' },
  { key: 'cross_concept_linking', name: 'Cross-Concept Linking', category: 'performance', definition: 'Ability to connect ideas across different topics or domains.', whyItMatters: 'Cross-linking drives deeper understanding and transfer.', signals: ['visual_focus_ratio', 'interaction_engagement_score'], tip: 'Use concept maps and draw explicit connections between topics.' },
];

export const TRAIT_KEYS = TRAIT_DEFINITIONS.map(t => t.key);

export function getCategoryTraits(category: GenomeCategory): TraitDefinition[] {
  return TRAIT_DEFINITIONS.filter(t => t.category === category);
}
