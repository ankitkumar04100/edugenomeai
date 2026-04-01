import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { generateDemoReplayTimeline } from '@/lib/demo-engine';
import { TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory } from '@/lib/genome-types';

const SessionReplay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const persona = searchParams.get('persona') || 'visual_thinker';

  const timeline = useRef(generateDemoReplayTimeline(persona)).current;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => {
        if (prev >= timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, timeline.length]);

  const frame = timeline[currentIdx];
  if (!frame) return null;

  const progress = (currentIdx / (timeline.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/student" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <span className="text-xs text-muted-foreground font-heading">Session Replay</span>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="card-premium p-4 flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-heading font-semibold hover:opacity-90 transition-opacity"
            aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold border transition-all ${speed === s ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="text-sm font-heading text-foreground ml-auto">
            t = {frame.t}s / 120s
          </div>
        </div>

        {/* Scrubber */}
        <div className="card-premium p-4 space-y-3">
          <input
            type="range"
            min={0}
            max={timeline.length - 1}
            value={currentIdx}
            onChange={e => { setCurrentIdx(+e.target.value); setIsPlaying(false); }}
            className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            aria-label="Timeline scrubber"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0s</span>
            <span>{Math.round(progress)}%</span>
            <span>120s</span>
          </div>

          {/* Event markers */}
          {frame.events.length > 0 && (
            <div className="space-y-1">
              {frame.events.map((evt, i) => (
                <div key={i} className="text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                  ⚡ {evt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Indices chart */}
          <div className="card-premium p-5 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Indices at t={frame.t}s</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confusion</span>
                  <span className={`font-semibold ${frame.indices.confusion_index > 60 ? 'text-red-600' : 'text-foreground'}`}>
                    {Math.round(frame.indices.confusion_index)}
                  </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300 bg-red-400" style={{ width: `${frame.indices.confusion_index}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Fatigue</span>
                  <span className={`font-semibold ${frame.indices.fatigue_index > 55 ? 'text-amber-600' : 'text-foreground'}`}>
                    {Math.round(frame.indices.fatigue_index)}
                  </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300 bg-amber-400" style={{ width: `${frame.indices.fatigue_index}%` }} />
                </div>
              </div>
            </div>

            {/* Indices timeline sparkline */}
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-2 font-heading">Timeline</div>
              <svg viewBox="0 0 300 60" className="w-full h-16">
                {/* Confusion line */}
                <polyline
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  points={timeline.map((f, i) => `${(i / (timeline.length - 1)) * 300},${60 - (f.indices.confusion_index / 100) * 55}`).join(' ')}
                />
                {/* Fatigue line */}
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  points={timeline.map((f, i) => `${(i / (timeline.length - 1)) * 300},${60 - (f.indices.fatigue_index / 100) * 55}`).join(' ')}
                />
                {/* Current position */}
                <line x1={(currentIdx / (timeline.length - 1)) * 300} y1="0" x2={(currentIdx / (timeline.length - 1)) * 300} y2="60" stroke="hsl(215, 90%, 52%)" strokeWidth="2" strokeDasharray="3,3" />
              </svg>
              <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Confusion</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> Fatigue</span>
              </div>
            </div>
          </div>

          {/* Traits snapshot */}
          <div className="lg:col-span-2 card-premium p-5 space-y-3">
            <h3 className="font-heading font-semibold text-foreground">24 Traits at t={frame.t}s</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => {
                const catTraits = TRAIT_DEFINITIONS.filter(t => t.category === cat);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="text-xs font-heading font-semibold" style={{ color: CATEGORY_COLORS[cat] }}>
                      {CATEGORY_LABELS[cat]}
                    </div>
                    {catTraits.map(t => (
                      <div key={t.key} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-muted-foreground truncate mr-2">{t.name.split(' ').slice(0, 2).join(' ')}</span>
                        <span className="font-semibold text-foreground">{Math.round(frame.traits[t.key] || 0)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionReplay;
