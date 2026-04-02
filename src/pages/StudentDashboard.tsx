import React, { useState, useEffect, useCallback } from 'react';
import GenomeWheel from '@/components/GenomeWheel';
import SessionControls from '@/components/SessionControls';
import ConfusionFatigueBadges from '@/components/ConfusionFatigueBadges';
import InsightsPanel from '@/components/InsightsPanel';
import TraitGrid from '@/components/TraitGrid';
import AlertBanner from '@/components/AlertBanner';
import ConsentModal from '@/components/ConsentModal';
import PrivacyStatus from '@/components/PrivacyStatus';
import SystemStatus from '@/components/SystemStatus';
import { generateInsights } from '@/lib/insight-engine';
import { GenomePayload, GenomeCategory, CATEGORY_COLORS, CATEGORY_LABELS, Insight } from '@/lib/genome-types';
import { telemetry } from '@/lib/telemetry';
import { traitEngine, TraitEngineMode } from '@/lib/trait-engine';
import { eyeTracker, EyeMetrics } from '@/lib/eye-tracker';
import { useAuth } from '@/hooks/useAuth';
import { startSession, endSession, saveGenomeSnapshot, saveSessionEvent, getUserSessions, SessionRecord } from '@/lib/session-service';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const initialPayload: GenomePayload = {
  overall_genome_score: 0,
  categories: { cognitive: 0, behavioral: 0, learning_style: 0, performance: 0 },
  traits: {},
  indices: { confusion_index: 0, fatigue_index: 0 },
  timestamp: 0,
};

const StudentDashboard: React.FC = () => {
  const { user, profile, updateConsent } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'live' | 'demo'>('demo');
  const [persona, setPersona] = useState('visual_thinker');
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [genome, setGenome] = useState<GenomePayload>(initialPayload);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeTab, setActiveTab] = useState<'genome' | 'sessions' | 'insights'>('genome');
  const [categoryFilter, setCategoryFilter] = useState<GenomeCategory | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [eyeMetrics, setEyeMetrics] = useState<EyeMetrics | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [lastUpdateMs, setLastUpdateMs] = useState(0);
  const engineMode = mode === 'demo' ? 'demo' : 'rule-based';

  // Load session history
  useEffect(() => {
    if (user) {
      getUserSessions(user.id).then(setSessions);
    }
  }, [user, isRunning]);

  useEffect(() => {
    traitEngine.setMode(engineMode as TraitEngineMode);
  }, [engineMode]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1500);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (tick === 0) return;
    const start = performance.now();
    const payload = traitEngine.infer(tick, persona, eyeMetrics ? { eye: eyeMetrics } : undefined);
    setGenome(payload);
    setInsights(generateInsights(payload));
    setLastUpdateMs(Math.round(performance.now() - start));

    // Persist snapshot if logged in
    if (sessionId) {
      saveGenomeSnapshot(sessionId, payload);
      if (payload.indices.confusion_index > 70) {
        saveSessionEvent(sessionId, 'confusion_spike', { value: payload.indices.confusion_index });
      }
      if (payload.indices.fatigue_index > 65) {
        saveSessionEvent(sessionId, 'fatigue_alert', { value: payload.indices.fatigue_index });
      }
    }
  }, [tick, persona, eyeMetrics, sessionId]);

  const handleModeChange = useCallback((newMode: 'live' | 'demo') => {
    if (newMode === 'live' && !profile?.eye_tracking_consent) {
      setShowConsent(true);
      return;
    }
    setMode(newMode);
  }, [profile]);

  const handleConsentAccept = useCallback(async (eye: boolean, data: boolean) => {
    await updateConsent(eye, data);
    setShowConsent(false);
    setMode('live');
    toast.success('Live Mode enabled');
  }, [updateConsent]);

  const handleStart = useCallback(async () => {
    traitEngine.reset();
    setIsRunning(true);
    setTick(0);
    telemetry.log('session_start', { mode, persona });

    // Start DB session if logged in
    if (user) {
      const sid = await startSession(user.id, mode, mode === 'demo' ? persona : undefined);
      setSessionId(sid);
    }

    // Start eye tracking in live mode
    if (mode === 'live') {
      const ok = await eyeTracker.init((m) => {
        setEyeMetrics(m);
        setFaceConfidence(m.face_confidence);
      });
      setCameraOn(ok);
      if (!ok) {
        toast.error('Camera access denied. Falling back to Demo Mode.');
        setMode('demo');
      }
    }
  }, [mode, persona, user]);

  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleEnd = useCallback(async () => {
    telemetry.log('session_end', { mode, persona, ticks: tick });
    
    if (sessionId) {
      await endSession(sessionId, genome);
      toast.success('Session saved');
    }

    eyeTracker.stop();
    setCameraOn(false);
    setIsRunning(false);
    setTick(0);
    setGenome(initialPayload);
    setInsights([]);
    setSessionId(null);
    setEyeMetrics(null);
  }, [mode, persona, tick, sessionId, genome]);

  const handleExportPDF = useCallback(async () => {
    if (!sessionId) { toast.error('No active session to export'); return; }
    toast.loading('Generating report...');
    try {
      const { data, error } = await supabase.functions.invoke('export-pdf', {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      // Open HTML report in new tab
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.dismiss();
      toast.success('Report generated');
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Export failed');
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <ConsentModal open={showConsent} onAccept={handleConsentAccept} onDecline={() => setShowConsent(false)} />

      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <ConfusionFatigueBadges indices={genome.indices} />
            {user ? (
              <span className="text-xs text-muted-foreground font-heading">{profile?.display_name || user.email}</span>
            ) : (
              <Link to="/auth" className="text-xs text-primary hover:underline font-heading">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-4">
        <AlertBanner indices={genome.indices} />

        {/* System + Privacy Status */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <SystemStatus mode={mode} isRunning={isRunning} wsConnected={false} lastUpdateMs={lastUpdateMs} traitEngineMode={engineMode} />
          <PrivacyStatus cameraOn={cameraOn} metricsStreaming={isRunning} faceConfidence={faceConfidence} />
        </div>

        <SessionControls
          isRunning={isRunning} mode={mode} persona={persona}
          onStart={handleStart} onPause={handlePause} onEnd={handleEnd}
          onModeChange={handleModeChange} onPersonaChange={setPersona}
        />

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
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-medium capitalize transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-selected={activeTab === tab} role="tab">
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'genome' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col items-center card-premium p-6">
                <GenomeWheel data={genome} size={480} />
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setCategoryFilter(null)}
                    className={`px-3 py-1 rounded-xl text-xs font-heading font-medium border transition-all ${!categoryFilter ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                    All Traits
                  </button>
                  {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-heading font-medium border transition-all ${categoryFilter === cat ? 'text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                      style={categoryFilter === cat ? { borderColor: CATEGORY_COLORS[cat], backgroundColor: CATEGORY_COLORS[cat] + '15' } : {}}>
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
            <TraitGrid data={genome} filter={categoryFilter} />
          </>
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
          <div className="space-y-4">
            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="card-premium p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-heading font-semibold text-foreground">
                        {new Date(s.started_at).toLocaleDateString()} — {s.mode === 'demo' ? `Demo (${s.persona || 'N/A'})` : 'Live'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score: {s.overall_score ? Math.round(s.overall_score) : '—'} | 
                        Confusion: {s.avg_confusion ? Math.round(s.avg_confusion) : '—'} | 
                        Fatigue: {s.avg_fatigue ? Math.round(s.avg_fatigue) : '—'}
                      </div>
                    </div>
                    <Link to={`/replay?session=${s.id}`} className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-heading font-semibold hover:bg-primary/20">
                      Replay →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-4">📋</p>
                <p className="font-heading">{user ? 'No sessions yet. Start one above!' : 'Sign in to save and view session history'}</p>
                {!user && <Link to="/auth" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-heading font-semibold">Sign In</Link>}
                <Link to={`/replay?persona=${persona}`} className="inline-block mt-4 ml-2 px-4 py-2 bg-primary/10 text-primary rounded-2xl text-sm font-heading font-semibold">
                  View Demo Replay
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
