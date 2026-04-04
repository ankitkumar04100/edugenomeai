import React, { useState, useEffect } from 'react';

interface Props {
  durationSec?: number;
  onResume: () => void;
}

const MicrobreakScreen: React.FC<Props> = ({ durationSec = 90, onResume }) => {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-premium p-8 text-center space-y-6 max-w-md mx-auto">
      <div className="text-5xl animate-float">☕</div>
      <h2 className="font-heading text-xl font-bold text-foreground">Micro-Break</h2>
      <p className="text-sm text-muted-foreground">
        Your fatigue level is high. Take a moment to rest your eyes and stretch.
      </p>

      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(220, 14%, 96%)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(215, 90%, 52%)" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - remaining / durationSec)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-2xl font-bold text-foreground">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>💡 Look away from the screen</p>
        <p>🙆 Stretch your neck and shoulders</p>
        <p>👁️ Blink slowly a few times</p>
      </div>

      <button
        onClick={onResume}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-heading font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        {remaining <= 0 ? 'Resume Session →' : 'Skip & Resume →'}
      </button>
    </div>
  );
};

export default MicrobreakScreen;
