import React from 'react';

interface SystemStatusProps {
  mode: 'live' | 'demo';
  isRunning: boolean;
  wsConnected: boolean;
  lastUpdateMs?: number;
  traitEngineMode: 'demo' | 'rule-based' | 'ml';
}

const SystemStatus: React.FC<SystemStatusProps> = ({ mode, isRunning, wsConnected, lastUpdateMs, traitEngineMode }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-heading text-muted-foreground">
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary">
        Mode: <span className="font-semibold text-foreground capitalize">{mode}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary">
        Engine: <span className="font-semibold text-foreground capitalize">{traitEngineMode}</span>
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isRunning ? 'bg-success/10' : 'bg-secondary'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
        {isRunning ? 'Active' : 'Idle'}
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${wsConnected ? 'bg-success/10' : 'bg-warning/10'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-success' : 'bg-warning'}`} />
        {wsConnected ? 'Connected' : 'Polling'}
      </div>
      {lastUpdateMs !== undefined && (
        <div className="px-2 py-1 rounded-lg bg-secondary">
          Latency: {lastUpdateMs}ms
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
