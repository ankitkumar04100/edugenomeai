import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Admin: React.FC = () => {
  const { user, role } = useAuth();
  const [eyeTracking, setEyeTracking] = useState(true);
  const [sessionLength, setSessionLength] = useState(30);
  const [updateFreq, setUpdateFreq] = useState(1.5);
  const [confusionThreshold, setConfusionThreshold] = useState(70);
  const [fatigueThreshold, setFatigueThreshold] = useState(65);
  const [realtimeMode, setRealtimeMode] = useState<'ws' | 'poll'>('poll');
  const [traitEngineMode, setTraitEngineMode] = useState<'demo' | 'rule-based' | 'ml'>('demo');
  const [retentionDays, setRetentionDays] = useState(90);

  const handleDeleteData = async () => {
    if (!user) return;
    if (!confirm('This will permanently delete all your sessions, metrics, and genome data. Continue?')) return;
    // Delete all user sessions (cascades to metrics, snapshots, events)
    const { error } = await supabase.from('sessions').delete().eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success('All your data has been deleted');
  };

  const handleExportData = async () => {
    if (!user) return;
    const { data: sessions } = await supabase.from('sessions').select('*').eq('user_id', user.id);
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edugenome-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <span className="text-xs text-muted-foreground font-heading">Admin Settings</span>
        </div>
      </header>

      <div className="container px-4 py-8 max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Settings</h1>

        <div className="card-premium p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Module Toggles</h3>
          <label className="flex items-center justify-between">
            <span className="text-sm text-foreground">Eye Tracking</span>
            <button onClick={() => setEyeTracking(!eyeTracking)}
              className={`w-10 h-5 rounded-full transition-colors ${eyeTracking ? 'bg-success' : 'bg-secondary'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${eyeTracking ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>
          <div className="text-xs text-muted-foreground">Theme: Light Mode Only (enforced)</div>
        </div>

        {/* Trait Engine Mode */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">🧠 Trait Engine Mode</h3>
          <div className="flex gap-1 bg-secondary rounded-xl p-0.5">
            {(['demo', 'rule-based', 'ml'] as const).map(m => (
              <button key={m} onClick={() => setTraitEngineMode(m)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-all capitalize ${traitEngineMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                {m === 'ml' ? 'ML Model' : m}
              </button>
            ))}
          </div>
          {traitEngineMode === 'ml' && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-xs text-foreground">
              ⚠️ No ML model loaded. Using rule-based fallback. Upload a model file (.joblib/.onnx) to /models/ to enable ML inference.
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Demo: deterministic fixed data. Rule-based: real metrics → trait scoring. ML: pre-trained model inference.
          </div>
        </div>

        <div className="card-premium p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Session Settings</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Default Session Length (min)</span>
            <input type="number" value={sessionLength} onChange={e => setSessionLength(+e.target.value)}
              className="w-20 bg-white border border-border rounded-xl px-2 py-1.5 text-sm text-foreground text-center font-heading focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Update Frequency (sec)</span>
            <input type="number" value={updateFreq} step={0.5} onChange={e => setUpdateFreq(+e.target.value)}
              className="w-20 bg-white border border-border rounded-xl px-2 py-1.5 text-sm text-foreground text-center font-heading focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Real-time Mode</span>
            <div className="flex gap-1 bg-secondary rounded-xl p-0.5">
              {(['ws', 'poll'] as const).map(m => (
                <button key={m} onClick={() => setRealtimeMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-heading font-medium transition-all ${realtimeMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {m === 'ws' ? 'WebSocket' : 'Polling'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-premium p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Alert Thresholds</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Confusion Index Alert</span>
            <input type="number" value={confusionThreshold} onChange={e => setConfusionThreshold(+e.target.value)}
              className="w-20 bg-white border border-border rounded-xl px-2 py-1.5 text-sm text-foreground text-center font-heading focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Fatigue Index Alert</span>
            <input type="number" value={fatigueThreshold} onChange={e => setFatigueThreshold(+e.target.value)}
              className="w-20 bg-white border border-border rounded-xl px-2 py-1.5 text-sm text-foreground text-center font-heading focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* Data Retention */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">📊 Data Retention</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Retention Window</span>
            <div className="flex gap-1 bg-secondary rounded-xl p-0.5">
              {[30, 90, 180].map(d => (
                <button key={d} onClick={() => setRetentionDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-heading font-medium transition-all ${retentionDays === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-premium p-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">🔒 Privacy & Data Controls</h3>
          <p className="text-xs text-muted-foreground">Data retention: Metrics only (no raw video or frames). Consent management enabled.</p>
          <p className="text-xs text-muted-foreground">All webcam processing is local. Only derived behavioral metrics are transmitted.</p>
          <p className="text-xs text-muted-foreground">Demo Mode uses deterministic, fixed data — no randomness.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleExportData} className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-xl text-xs font-heading font-semibold hover:bg-primary/20 transition-colors">
              📥 Export My Data (JSON)
            </button>
            <button onClick={handleDeleteData} className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl text-xs font-heading font-semibold hover:bg-destructive/20 transition-colors">
              🗑️ Delete All My Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
