import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Admin: React.FC = () => {
  const [eyeTracking, setEyeTracking] = useState(true);
  const [sessionLength, setSessionLength] = useState(30);
  const [updateFreq, setUpdateFreq] = useState(1.5);
  const [confusionThreshold, setConfusionThreshold] = useState(70);
  const [fatigueThreshold, setFatigueThreshold] = useState(65);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <span className="text-xs font-mono text-muted-foreground">Admin Settings</span>
        </div>
      </header>

      <div className="container px-4 py-8 max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Settings</h1>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Module Toggles</h3>
          <label className="flex items-center justify-between">
            <span className="text-sm text-foreground">Eye Tracking</span>
            <button onClick={() => setEyeTracking(!eyeTracking)}
              className={`w-10 h-5 rounded-full transition-colors ${eyeTracking ? 'bg-genome-learning' : 'bg-secondary'}`}>
              <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${eyeTracking ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Session Settings</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Default Session Length (min)</span>
            <input type="number" value={sessionLength} onChange={e => setSessionLength(+e.target.value)}
              className="w-20 bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-foreground text-center font-mono" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Update Frequency (sec)</span>
            <input type="number" value={updateFreq} step={0.5} onChange={e => setUpdateFreq(+e.target.value)}
              className="w-20 bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-foreground text-center font-mono" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Thresholds</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Confusion Index Alert Threshold</span>
            <input type="number" value={confusionThreshold} onChange={e => setConfusionThreshold(+e.target.value)}
              className="w-20 bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-foreground text-center font-mono" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Fatigue Index Alert Threshold</span>
            <input type="number" value={fatigueThreshold} onChange={e => setFatigueThreshold(+e.target.value)}
              className="w-20 bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-foreground text-center font-mono" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">🔒 Privacy Settings</h3>
          <p className="text-xs text-muted-foreground">Data retention: Metrics only (no raw video or frames). Consent management enabled.</p>
          <p className="text-xs text-muted-foreground">All webcam processing is local. Only derived behavioral metrics are transmitted.</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
