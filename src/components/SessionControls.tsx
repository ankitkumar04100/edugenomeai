import React from 'react';
import { PERSONAS } from '@/lib/demo-engine';

interface SessionControlsProps {
  isRunning: boolean;
  mode: 'live' | 'demo';
  persona: string;
  onStart: () => void;
  onPause: () => void;
  onEnd: () => void;
  onModeChange: (mode: 'live' | 'demo') => void;
  onPersonaChange: (persona: string) => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  isRunning, mode, persona, onStart, onPause, onEnd, onModeChange, onPersonaChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
        <button
          onClick={() => onModeChange('demo')}
          className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium transition-all ${mode === 'demo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Demo Mode
        </button>
        <button
          onClick={() => onModeChange('live')}
          className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium transition-all ${mode === 'live' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Live Mode
        </button>
      </div>

      {mode === 'demo' && (
        <select
          value={persona}
          onChange={(e) => onPersonaChange(e.target.value)}
          className="bg-secondary border border-border text-foreground rounded-lg px-3 py-1.5 text-xs font-mono"
        >
          {Object.entries(PERSONAS).map(([key, p]) => (
            <option key={key} value={key}>{p.name}</option>
          ))}
        </select>
      )}

      <div className="flex gap-2 ml-auto">
        {!isRunning ? (
          <button onClick={onStart} className="px-4 py-1.5 bg-genome-learning text-primary-foreground rounded-lg text-xs font-heading font-semibold hover:opacity-90 transition-opacity">
            ▶ Start Session
          </button>
        ) : (
          <>
            <button onClick={onPause} className="px-4 py-1.5 bg-genome-performance text-primary-foreground rounded-lg text-xs font-heading font-semibold hover:opacity-90 transition-opacity">
              ⏸ Pause
            </button>
            <button onClick={onEnd} className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs font-heading font-semibold hover:opacity-90 transition-opacity">
              ⏹ End
            </button>
          </>
        )}
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-genome-learning animate-pulse" />
          <span className="font-mono">Session active</span>
        </div>
      )}
    </div>
  );
};

export default SessionControls;
