import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QUIZ_QUESTIONS, QuizQuestion, Difficulty, HintType } from '@/lib/quiz-data';
import { classifyMistake, MistakeEvent, computeFingerprint } from '@/lib/mistake-engine';
import { telemetry } from '@/lib/telemetry';
import { orchestrator } from '@/lib/adaptive-engine';
import { HeatmapCollector, type HeatmapSnapshot } from '@/lib/heatmap-engine';
import { TTSHintButton, DictationButton } from '@/components/VoiceControls';
import AttentionHeatmap from '@/components/AttentionHeatmap';
import MicrobreakScreen from '@/components/MicrobreakScreen';
import AIChatBot from '@/components/AIChatBot';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface QuestionResult {
  questionId: string;
  correct: boolean;
  responseTime: number;
  hintsUsed: HintType[];
  corrections: number;
  difficulty: Difficulty;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  hard: 'text-red-600 bg-red-50 border-red-200',
};

function mapDifficultyLevel(level: number): Difficulty {
  if (level <= 2) return 'easy';
  if (level <= 3) return 'medium';
  return 'hard';
}

const PracticePlayer: React.FC = () => {
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState<HintType[]>([]);
  const [shownHints, setShownHints] = useState<Set<number>>(new Set());
  const [corrections, setCorrections] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEvent[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showMicrobreak, setShowMicrobreak] = useState(false);
  const [uiMode, setUiMode] = useState<'NORMAL' | 'DISTRACTION_MIN' | 'STEP_BY_STEP'>('NORMAL');
  const [lastHeatmap, setLastHeatmap] = useState<HeatmapSnapshot | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const startTimeRef = useRef(Date.now());
  const tickRef = useRef(0);

  // Fetch DB questions
  const { data: dbQuestions } = useQuery({
    queryKey: ['practice-questions'],
    queryFn: async () => {
      const { data: questions } = await supabase
        .from('question_bank')
        .select('*')
        .eq('published', true)
        .order('difficulty', { ascending: true });
      if (!questions?.length) return null;

      const questionIds = questions.map(q => q.id);
      const [{ data: options }, { data: hints }] = await Promise.all([
        supabase.from('question_options').select('*').in('question_id', questionIds),
        supabase.from('question_hints').select('*').in('question_id', questionIds),
      ]);

      return questions.map(q => {
        const qOpts = options?.find(o => o.question_id === q.id);
        const qHints = hints?.filter(h => h.question_id === q.id) || [];
        const difficulty = mapDifficultyLevel(q.difficulty);
        const optionsArr = (qOpts?.options_json as string[]) || [];

        return {
          id: q.id,
          type: (q.type === 'mcq' ? 'mcq' : 'text_input') as QuizQuestion['type'],
          difficulty,
          question: q.stem,
          options: optionsArr.length > 0 ? optionsArr : undefined,
          correctAnswer: qOpts?.correct_answer || '',
          hints: qHints.length > 0
            ? qHints.map(h => ({ type: (h.hint_type || 'text') as HintType, content: h.content }))
            : [{ type: 'text' as HintType, content: 'Think carefully about this problem.' }],
          topic: q.topic || q.subject || 'General',
        } as QuizQuestion;
      });
    },
  });

  // Use DB questions if available, otherwise fallback to hardcoded
  const allQuestions: QuizQuestion[] = dbQuestions && dbQuestions.length > 0 ? dbQuestions : QUIZ_QUESTIONS;
  const questions = allQuestions.filter(q => q.difficulty === currentDifficulty);
  const currentQuestion = questions[currentQuestionIdx];

  // Run orchestrator on a timer
  useEffect(() => {
    orchestrator.reset();
    const interval = setInterval(() => {
      tickRef.current++;
      const decision = orchestrator.inferDemo(tickRef.current, 'visual_thinker');
      if (decision) {
        setUiMode(decision.action.ui_mode);
        if (decision.action.pacing_action === 'MICROBREAK') {
          setShowMicrobreak(true);
        }
        telemetry.log('orchestrator_action', { type: decision.interventionType, action: decision.action });
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSelectedAnswer('');
    setTextAnswer('');
    setShowResult(false);
    setHintsUsed([]);
    setShownHints(new Set());
    setCorrections(0);
    if (currentQuestionIdx > 0) {
      setLastHeatmap(HeatmapCollector.generateDemoHeatmap('visual_thinker', currentQuestionIdx - 1));
    }
  }, [currentQuestionIdx, currentDifficulty]);

  const handleVoiceEvent = useCallback((event: string, payload?: Record<string, any>) => {
    telemetry.log(event, payload || {});
  }, []);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setTextAnswer(transcript);
  }, []);

  if (!currentQuestion && !sessionComplete) {
    const nextIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty) + 1;
    if (nextIdx < DIFFICULTY_ORDER.length) {
      setCurrentDifficulty(DIFFICULTY_ORDER[nextIdx]);
      setCurrentQuestionIdx(0);
      return null;
    }
    setSessionComplete(true);
  }

  const handleUseHint = (hintIdx: number, hintType: HintType) => {
    if (shownHints.has(hintIdx)) return;
    setShownHints(prev => new Set([...prev, hintIdx]));
    setHintsUsed(prev => [...prev, hintType]);
    telemetry.log('hint_used', { questionId: currentQuestion?.id, hintType });
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;
    const answer = currentQuestion.type === 'text_input' ? textAnswer.trim() : selectedAnswer;
    const responseTime = (Date.now() - startTimeRef.current) / 1000;
    const correct = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    if (!correct && !showResult) {
      setCorrections(c => c + 1);
      setShowResult(true);
      setIsCorrect(false);
      const mistakeType = classifyMistake(currentQuestion.type, hintsUsed[hintsUsed.length - 1] || null, responseTime);
      setMistakes(prev => [...prev, {
        timestamp: Date.now(),
        questionId: currentQuestion.id,
        type: mistakeType,
        description: `Wrong answer on ${currentQuestion.topic} (${currentQuestion.difficulty})`,
      }]);
      return;
    }

    setShowResult(true);
    setIsCorrect(correct);
    setResults(prev => [...prev, {
      questionId: currentQuestion.id,
      correct,
      responseTime,
      hintsUsed,
      corrections,
      difficulty: currentQuestion.difficulty,
    }]);
  };

  const handleNext = () => {
    const nextIdx = currentQuestionIdx + 1;
    const nextQuestions = allQuestions.filter(q => q.difficulty === currentDifficulty);
    if (nextIdx < nextQuestions.length) {
      setCurrentQuestionIdx(nextIdx);
    } else {
      const nextDiffIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty) + 1;
      if (nextDiffIdx < DIFFICULTY_ORDER.length) {
        setCurrentDifficulty(DIFFICULTY_ORDER[nextDiffIdx]);
        setCurrentQuestionIdx(0);
      } else {
        setSessionComplete(true);
      }
    }
  };

  const fingerprint = computeFingerprint(mistakes);
  const totalCorrect = results.filter(r => r.correct).length;
  const avgResponseTime = results.length > 0 ? results.reduce((a, r) => a + r.responseTime, 0) / results.length : 0;

  if (showMicrobreak) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MicrobreakScreen onResume={() => setShowMicrobreak(false)} />
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container px-4 py-8 max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">🎉 Practice Session Complete</h1>

        <div className="grid grid-cols-3 gap-4">
          <div className="card-premium p-4 text-center">
            <div className="text-2xl font-heading font-bold text-primary">{totalCorrect}/{results.length}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          <div className="card-premium p-4 text-center">
            <div className="text-2xl font-heading font-bold text-foreground">{avgResponseTime.toFixed(1)}s</div>
            <div className="text-xs text-muted-foreground">Avg Response</div>
          </div>
          <div className="card-premium p-4 text-center">
            <div className="text-2xl font-heading font-bold text-foreground">{results.reduce((a, r) => a + r.hintsUsed.length, 0)}</div>
            <div className="text-xs text-muted-foreground">Hints Used</div>
          </div>
        </div>

        {mistakes.length > 0 && (
          <div className="card-premium p-5">
            <h3 className="font-heading font-semibold text-foreground mb-3">Mistake Fingerprint</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {(['logical', 'visual', 'conceptual'] as const).map(type => (
                <div key={type} className={`text-center p-2 rounded-xl ${type === fingerprint.dominantType ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'}`}>
                  <div className="text-lg font-heading font-bold text-foreground">{fingerprint[type]}</div>
                  <div className="text-xs text-muted-foreground capitalize">{type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link to="/student" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-heading font-semibold text-sm hover:opacity-90">
            Back to Dashboard
          </Link>
          {dbQuestions && dbQuestions.length > 0 && (
            <span className="text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg font-heading">
              📚 Questions from Content Bank
            </span>
          )}
        </div>
        <AIChatBot context="Student just completed a practice session" />
      </div>
    );
  }

  if (!currentQuestion) return null;

  const difficultyIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  const isMinimal = uiMode === 'DISTRACTION_MIN';
  const isStepByStep = uiMode === 'STEP_BY_STEP';

  return (
    <div>
      <div className={`container px-4 py-8 space-y-6 ${isMinimal ? 'max-w-lg' : 'max-w-3xl'}`}>
        {/* Source indicator */}
        {dbQuestions && dbQuestions.length > 0 && (
          <div className="text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg font-heading inline-block">
            📚 Questions from Content Bank
          </div>
        )}

        {/* Difficulty stepper */}
        {!isMinimal && (
          <div className="flex items-center gap-2">
            {DIFFICULTY_ORDER.map((d, i) => (
              <React.Fragment key={d}>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold border capitalize ${i <= difficultyIdx ? DIFFICULTY_COLORS[d] : 'text-muted-foreground bg-secondary border-border'}`}>
                  {d}
                </div>
                {i < DIFFICULTY_ORDER.length - 1 && (
                  <div className={`w-8 h-0.5 ${i < difficultyIdx ? 'bg-primary' : 'bg-border'}`} />
                )}
              </React.Fragment>
            ))}
            <div className="ml-auto text-xs text-muted-foreground font-heading">
              Q{currentQuestionIdx + 1}/{questions.length}
              {uiMode !== 'NORMAL' && (
                <span className="ml-2 text-[10px] px-2 py-0.5 bg-accent/20 border border-accent/30 rounded-lg">
                  {isMinimal ? '🔕 Focus' : '📋 Step-by-Step'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-lg border capitalize ${DIFFICULTY_COLORS[currentQuestion.difficulty]}`}>
              {currentQuestion.difficulty}
            </span>
            <span>•</span>
            <span>{currentQuestion.topic}</span>
          </div>

          {isStepByStep && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
              📋 <span className="font-heading font-semibold">Step-by-Step Mode Active</span> — Read the question carefully, check hints, then answer.
            </div>
          )}

          <h2 className="font-heading text-lg font-semibold text-foreground">{currentQuestion.question}</h2>

          {/* Answer input */}
          {currentQuestion.type === 'mcq' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt) => (
                <button key={opt} onClick={() => !showResult && setSelectedAnswer(opt)} disabled={showResult}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-body transition-all ${
                    selectedAnswer === opt
                      ? showResult
                        ? isCorrect ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-primary/10 border-primary/40 text-foreground'
                      : showResult && opt === currentQuestion.correctAnswer
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-white border-border text-foreground hover:bg-secondary/50'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'text_input' && (
            <div className="space-y-2">
              <input type="text" value={textAnswer} onChange={e => !showResult && setTextAnswer(e.target.value)}
                placeholder="Type your answer..." disabled={showResult}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <DictationButton onTranscript={handleVoiceTranscript} onEvent={handleVoiceEvent} />
            </div>
          )}

          {/* Hints */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-heading">Hints:</div>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.hints.map((hint, i) => (
                <div key={i} className="flex items-center gap-1">
                  <button onClick={() => handleUseHint(i, hint.type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading border transition-all ${
                      shownHints.has(i)
                        ? 'bg-accent/20 border-accent/40 text-accent-foreground'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    }`}>
                    {hint.type === 'visual' ? '🖼️' : hint.type === 'audio' ? '🔊' : '📝'} {hint.type}
                  </button>
                  {shownHints.has(i) && hint.type === 'audio' && (
                    <TTSHintButton text={hint.content} questionId={currentQuestion.id} onEvent={handleVoiceEvent} />
                  )}
                </div>
              ))}
            </div>
            {[...shownHints].map(idx => (
              <div key={idx} className="text-xs text-foreground bg-accent/10 rounded-xl px-3 py-2 border border-accent/20">
                {currentQuestion.hints[idx].content}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!showResult ? (
              <button onClick={handleSubmit} disabled={!selectedAnswer && !textAnswer.trim()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-heading font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
                Submit Answer
              </button>
            ) : (
              <button onClick={handleNext}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-heading font-semibold text-sm hover:opacity-90 transition-opacity">
                Next Question →
              </button>
            )}
          </div>

          {showResult && (
            <div className={`text-sm font-heading font-semibold px-4 py-2 rounded-xl ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isCorrect ? '✅ Correct!' : `❌ The correct answer is: ${currentQuestion.correctAnswer}`}
            </div>
          )}
        </div>

        {/* Heatmap below question */}
        {lastHeatmap && (
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-semibold text-sm text-foreground">🔥 Attention Heatmap</h3>
              <button onClick={() => setShowHeatmap(!showHeatmap)} className="text-[10px] text-primary hover:underline font-heading">
                {showHeatmap ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHeatmap && (
              <AttentionHeatmap
                snapshot={lastHeatmap}
                summary={HeatmapCollector.getDemoSummary('visual_thinker')}
              />
            )}
          </div>
        )}

        {/* Session stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>✅ {totalCorrect} correct</span>
          <span>❌ {results.length - totalCorrect} wrong</span>
          <span>💡 {results.reduce((a, r) => a + r.hintsUsed.length, 0)} hints</span>
          <span>⏱️ {avgResponseTime.toFixed(1)}s avg</span>
        </div>
      </div>

      <AIChatBot context={`Student is practicing: ${currentQuestion.topic} (${currentQuestion.difficulty}). Question: ${currentQuestion.question}`} />
    </div>
  );
};

export default PracticePlayer;
