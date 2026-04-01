import React, { useState, useEffect, useCallback } from 'react';
import GenomeWheel from '@/components/GenomeWheel';
import SessionControls from '@/components/SessionControls';
import ConfusionFatigueBadges from '@/components/ConfusionFatigueBadges';
import InsightsPanel from '@/components/InsightsPanel';
import TraitGrid from '@/components/TraitGrid';
import AlertBanner from '@/components/AlertBanner';
import { generateDemoPayload } from '@/lib/demo-engine';
import { generateInsights } from '@/lib/insight-engine';
import { GenomePayload, GenomeCategory, CATEGORY_COLORS, CATEGORY_LABELS, Insight } from '@/lib/genome-types';
import { telemetry } from '@/lib/telemetry';
import { Link } from 'react-router-dom';

const initialPayload: GenomePayload = {
  overall_genome_score: 0,
  categories: { cognitive: 0, behavioral: 0, learning_style: 0, performance: 0 },
  traits: {},
  indices: { confusion_index: 0, fatigue_index: 0 },
  timestamp: 0,
};

const StudentDashboard: React.FC = () => {
  const [mode, setMode] = useState<'live' | 'demo'>('demo');
  const [persona, setPersona] = useState('visual_thinker');
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [genome, setGenome] = useState<GenomePayload>(initialPayload);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeTab, setActiveTab] = useState<'genome' | 'sessions' | 'insights'>('genome');
  const [categoryFilter, setCategoryFilter] = useState<GenomeCategory | null>(null);
  const [sessionHistory, setSessionHistory] = useState<GenomePayload[]>([]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (tick === 0) return;
    if (mode === 'demo') {
      const payload = generateDemoPayload(persona, tick);
      setGenome(payload);
      setInsights(generateInsights(payload));
      setSessionHistory(prev => [...prev.slice(-50), payload]);
    }
  }, [tick, mode, persona]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setTick(0);
    setSessionHistory([]);
    telemetry.log('session_start', { mode, persona });
  }, [mode, persona]);

  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleEnd = useCallback(() => {
    telemetry.log('session_end', { mode, persona, ticks: tick });
    setIsRunning(false);
    setTick(0);
    setGenome(initialPayload);
    setInsights([]);
  }, [mode, persona, tick]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <ConfusionFatigueBadges indices={genome.indices} />
            <span className="text-xs text-muted-foreground font-heading">Student Dashboard</span>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-6">
        {/* Alert banners */}
        <AlertBanner indices={genome.indices} />

        {/* Session Controls */}
        <SessionControls
          isRunning={isRunning}
          mode={mode}
          persona={persona}
          onStart={handleStart}
          onPause={handlePause}
          onEnd={handleEnd}
          onModeChange={setMode}
          onPersonaChange={setPersona}
        />

        {/* Quick links */}
        <div className="flex gap-2">
          <Link to="/practice" className="px-4 py-2 bg-accent/10 border border-accent/30 text-foreground rounded-2xl text-xs font-heading font-semibold hover:bg-accent/20 transition-colors">
            📝 Practice Player
          </Link>
          <Link to={`/replay?persona=${persona}`} className="px-4 py-2 bg-primary/10 border border-primary/30 text-foreground rounded-2xl text-xs font-heading font-semibold hover:bg-primary/20 transition-colors">
            🔄 Session Replay
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-2xl p-1 w-fit">
          {(['genome', 'sessions', 'insights'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-medium capitalize transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-selected={activeTab === tab}
              role="tab"
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'genome' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col items-center card-premium p-6">
              <GenomeWheel data={genome} size={480} />

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1 rounded-xl text-xs font-heading font-medium border transition-all ${!categoryFilter ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  All Traits
                </button>
                {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-heading font-medium border transition-all ${categoryFilter === cat ? 'text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                    style={categoryFilter === cat ? { borderColor: CATEGORY_COLORS[cat], backgroundColor: CATEGORY_COLORS[cat] + '15' } : {}}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-3 mt-4 w-full">
                {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
                  <div key={cat} className="text-center p-2 rounded-xl bg-secondary">
                    <div className="text-lg font-heading font-bold" style={{ color: CATEGORY_COLORS[cat] }}>
                      {Math.round(genome.categories[cat] || 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[cat]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <InsightsPanel insights={insights} />
              <div className="card-premium p-4 space-y-3">
                <h3 className="font-heading font-semibold text-sm text-foreground">📊 Session Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary rounded-xl p-2 text-center">
                    <div className="text-lg font-heading font-bold text-foreground">{Math.round(genome.overall_genome_score)}</div>
                    <div className="text-[10px] text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="bg-secondary rounded-xl p-2 text-center">
                    <div className="text-lg font-heading font-bold text-foreground">{tick}</div>
                    <div className="text-[10px] text-muted-foreground">Updates</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'genome' && (
          <TraitGrid data={genome} filter={categoryFilter} />
        )}

        {activeTab === 'insights' && (
          <div className="max-w-2xl">
            <InsightsPanel insights={insights} />
            {insights.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-4">💡</p>
                <p className="font-heading">Start a session to receive real-time insights</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-heading">Session history will appear here after completing sessions</p>
            <Link to={`/replay?persona=${persona}`} className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-heading font-semibold hover:opacity-90">
              View Demo Replay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
