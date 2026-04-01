// Practice/Quiz questions with difficulty progression and hints
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'image' | 'text_input';
export type HintType = 'visual' | 'audio' | 'text';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  imageUrl?: string;
  options?: string[];
  correctAnswer: string;
  hints: { type: HintType; content: string }[];
  topic: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Easy
  {
    id: 'q1', type: 'mcq', difficulty: 'easy', topic: 'Patterns',
    question: 'What comes next in the sequence: 2, 4, 8, 16, __?',
    options: ['24', '32', '20', '28'],
    correctAnswer: '32',
    hints: [
      { type: 'text', content: 'Each number is multiplied by 2.' },
      { type: 'visual', content: '📊 Think of doubling: 2→4→8→16→?' },
      { type: 'audio', content: '🔊 "Each term doubles the previous one."' },
    ],
  },
  {
    id: 'q2', type: 'mcq', difficulty: 'easy', topic: 'Logic',
    question: 'All roses are flowers. Some flowers fade quickly. Which must be true?',
    options: ['All roses fade quickly', 'Some roses may fade quickly', 'No roses fade', 'Roses are not flowers'],
    correctAnswer: 'Some roses may fade quickly',
    hints: [
      { type: 'text', content: 'Use set logic: roses ⊂ flowers.' },
      { type: 'visual', content: '📊 Draw a Venn diagram with roses inside flowers.' },
      { type: 'audio', content: '🔊 "If roses are flowers, and some flowers fade, some roses might fade too."' },
    ],
  },
  {
    id: 'q3', type: 'text_input', difficulty: 'easy', topic: 'Memory',
    question: 'What is the capital of France?',
    correctAnswer: 'Paris',
    hints: [
      { type: 'text', content: 'It\'s known as the "City of Light".' },
      { type: 'visual', content: '🗼 Think of the famous tower!' },
      { type: 'audio', content: '🔊 "This European capital sits on the Seine river."' },
    ],
  },
  // Medium
  {
    id: 'q4', type: 'mcq', difficulty: 'medium', topic: 'Abstract Thinking',
    question: 'If A > B and B > C, and D > A, which is the largest?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'D',
    hints: [
      { type: 'text', content: 'Chain the inequalities: D > A > B > C.' },
      { type: 'visual', content: '📊 Arrange on a number line: C < B < A < D' },
      { type: 'audio', content: '🔊 "Start from what\'s bigger than everything else."' },
    ],
  },
  {
    id: 'q5', type: 'mcq', difficulty: 'medium', topic: 'Patterns',
    question: 'Complete the pattern: 1, 1, 2, 3, 5, 8, __?',
    options: ['10', '11', '13', '15'],
    correctAnswer: '13',
    hints: [
      { type: 'text', content: 'Each number is the sum of the two before it.' },
      { type: 'visual', content: '📊 Fibonacci: 5+8 = ?' },
      { type: 'audio', content: '🔊 "This is the famous Fibonacci sequence."' },
    ],
  },
  {
    id: 'q6', type: 'text_input', difficulty: 'medium', topic: 'Deduction',
    question: 'A bat and ball cost $1.10 total. The bat costs $1 more than the ball. How much does the ball cost (in cents)?',
    correctAnswer: '5',
    hints: [
      { type: 'text', content: 'Let ball = x. Then bat = x + 100. Total = 2x + 100 = 110.' },
      { type: 'visual', content: '📊 Set up the equation: x + (x + 100) = 110' },
      { type: 'audio', content: '🔊 "The intuitive answer of 10 cents is wrong. Think algebraically."' },
    ],
  },
  // Hard
  {
    id: 'q7', type: 'mcq', difficulty: 'hard', topic: 'Cross-Concept',
    question: 'In a room of 23 people, what is the approximate probability that two share a birthday?',
    options: ['~10%', '~25%', '~50%', '~75%'],
    correctAnswer: '~50%',
    hints: [
      { type: 'text', content: 'This is the birthday paradox. It\'s surprisingly high.' },
      { type: 'visual', content: '📊 Probability grows fast: P = 1 - (365!/((365-n)! × 365^n))' },
      { type: 'audio', content: '🔊 "With 23 people, there are 253 possible pairs to compare."' },
    ],
  },
  {
    id: 'q8', type: 'mcq', difficulty: 'hard', topic: 'Logic',
    question: 'If it takes 5 machines 5 minutes to make 5 widgets, how many minutes for 100 machines to make 100 widgets?',
    options: ['1 minute', '5 minutes', '20 minutes', '100 minutes'],
    correctAnswer: '5 minutes',
    hints: [
      { type: 'text', content: 'Each machine makes 1 widget in 5 minutes.' },
      { type: 'visual', content: '📊 Rate: 1 machine → 1 widget/5min. 100 machines → 100 widgets/5min.' },
      { type: 'audio', content: '🔊 "Don\'t scale time with quantity—the machines work in parallel."' },
    ],
  },
  {
    id: 'q9', type: 'text_input', difficulty: 'hard', topic: 'Abstract Thinking',
    question: 'A lily pad doubles in size each day. If it covers the entire lake on day 48, on what day does it cover half the lake?',
    correctAnswer: '47',
    hints: [
      { type: 'text', content: 'If it doubles daily, the day before full coverage is half.' },
      { type: 'visual', content: '📊 Day 48 = full. Day 47 = half (since it doubles to fill).' },
      { type: 'audio', content: '🔊 "Work backwards: if it doubles to fill on day 48, half was day 47."' },
    ],
  },
];

export function getQuestionsByDifficulty(difficulty: Difficulty): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.difficulty === difficulty);
}
