import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { generateDemoReplayTimeline, DEMO_EVENTS } from '@/lib/demo-engine';
import { TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory } from '@/lib/genome-types';
import { HeatmapCollector } from '@/lib/heatmap-engine';
import AttentionHeatmap from '@/components/AttentionHeatmap';
import AIChatBot from '@/components/AIChatBot';

// Generate session narrative from timeline
function generateNarrative(timeline: ReturnType<typeof generateDemoReplayTimeline>): string {
  const parts: string[] = [];
  let lastState = 'stable';
  
  for (let i = 0; i < timeline.length; i++) {
    const f = timeline[i];
    const ci = f.indices.confusion_index;
    const fi = f.indices.fatigue_index;
    
    if (ci > 70 && lastState !== 'confusion') {
      parts.push(`confusion spike at ${f.t}s`);
      lastState = 'confusion';
    } else if (fi > 65 && lastState !== 'fatigue') {
      parts.push(`fatigue rising at ${f.t}s`);
      lastState = 'fatigue';
    } else if (ci < 40 && fi < 40 && lastState !== 'stable' && lastState !== 'start') {
      parts.push(`recovery at ${f.t}s`);
      lastState = 'stable';
    }
    
    if (f.events.length > 0) {
      f.events.forEach(evt => {
        if (evt.toLowerCase().includes('microbreak')) parts.push(`microbreak at ${f.t}s`);
        if (evt.toLowerCase().includes('intervention')) parts.push(`intervention at ${f.t}s`);
      });
    }
  }
  
  const last = timeline[timeline.length - 1];
  const finalScore = last.indices.confusion_index < 40 && last.indices.fatigue_index < 50 ? 'finish strong' : 'finish with elevated signals';
  
  return `Start stable → ${parts.join(' → ')} → ${finalScore}`;
}

const SessionReplay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const persona = searchParams.get('persona') || 'visual_thinker';

  const timeline = useRef(generateDemoReplayTimeline(persona)).current;
  const narrative = useRef(generateNarrative(timeline)).current;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => {
        if (prev >= timeline.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 1500 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, timeline.length]);

  const frame = timeline[currentIdx];
  if (!frame) return null;

  const progress = (currentIdx / (timeline.length - 1)) * 100;
  const heatmap = HeatmapCollector.generateDemoHeatmap(persona, Math.floor(currentIdx / 5));
  const heatmapSummary = HeatmapCollector.getDemoSummary(persona);

  return (
    <div>
      <div className="container px-4 py-6 space-y-6">
        {/* Session Narrative */}
        <div className="card-premium p-4">
          <button onClick={() => setShowNarrative(!showNarrative)} className="flex items-center justify-between w-full">
            <h3 className="font-heading font-semibold text-sm text-foreground">📖 Session Narrative</h3>
            <span className="text-[10px] text-primary font-heading">{showNarrative ? 'Hide' : 'Show'}</span>
          </button>
          {showNarrative && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed italic bg-secondary/50 rounded-xl p-3">
              {narrative}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="card-premium p-4 flex items-center gap-4">
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-heading font-semibold hover:opacity-90 transition-opacity">
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold border transition-all ${speed === s ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>
                {s}×
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded-lg text-[10px] font-heading border ${showHeatmap ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground'}`}>
              🔥 Heatmap
            </button>
          </div>
          <div className="text-sm font-heading text-foreground">t = {frame.t}s / 120s</div>
        </div>

        {/* Scrubber with event markers */}
        <div className="card-premium p-4 space-y-3">
          <div className="relative">
            <input type="range" min={0} max={timeline.length - 1} value={currentIdx}
              onChange={e => { setCurrentIdx(+e.target.value); setIsPlaying(false); }}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary" />
            {/* Event markers on scrubber */}
            <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
              {timeline.map((f, i) => f.events.length > 0 ? (
                <div key={i} className="absolute w-1 h-3 bg-amber-400 rounded-full -top-0.5"
                  style={{ left: `${(i / (timeline.length - 1)) * 100}%` }}
                  title={f.events.join(', ')} />
              ) : null)}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0s</span><span>{Math.round(progress)}%</span><span>120s</span>
          </div>
          {frame.events.length > 0 && (
            <div className="space-y-1">
              {frame.events.map((evt, i) => (
                <div key={i} className="text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl animate-fade-in">⚡ {evt}</div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indices */}
          <div className="card-premium p-5 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Indices at t={frame.t}s</h3>
            <div className="space-y-3">
              {[{ label: 'Confusion', value: frame.indices.confusion_index, threshold: 60, color: '#EF4444' },
                { label: 'Fatigue', value: frame.indices.fatigue_index, threshold: 55, color: '#F59E0B' }].map(idx => (
                <div key={idx.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{idx.label}</span>
                    <span className={`font-semibold ${idx.value > idx.threshold ? '' : 'text-foreground'}`} style={idx.value > idx.threshold ? { color: idx.color } : {}}>
                      {Math.round(idx.value)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${idx.value}%`, backgroundColor: idx.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-2 font-heading">Timeline</div>
              <svg viewBox="0 0 300 60" className="w-full h-16">
                <polyline fill="none" stroke="#EF4444" strokeWidth="2"
                  points={timeline.map((f, i) => `${(i / (timeline.length - 1)) * 300},${60 - (f.indices.confusion_index / 100) * 55}`).join(' ')} />
                <polyline fill="none" stroke="#F59E0B" strokeWidth="2"
                  points={timeline.map((f, i) => `${(i / (timeline.length - 1)) * 300},${60 - (f.indices.fatigue_index / 100) * 55}`).join(' ')} />
                <line x1={(currentIdx / (timeline.length - 1)) * 300} y1="0" x2={(currentIdx / (timeline.length - 1)) * 300} y2="60" stroke="hsl(215, 90%, 52%)" strokeWidth="2" strokeDasharray="3,3" />
              </svg>
              <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Confusion</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> Fatigue</span>
              </div>
            </div>

            {/* Heatmap */}
            {showHeatmap && (
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-2 font-heading">🔥 Attention Heatmap</div>
                <AttentionHeatmap snapshot={heatmap} summary={heatmapSummary} width={220} height={180} />
              </div>
            )}
          </div>

          {/* Traits snapshot */}
          <div className="card-premium p-5 space-y-3">
            <h3 className="font-heading font-semibold text-foreground">24 Traits at t={frame.t}s</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => {
                const catTraits = TRAIT_DEFINITIONS.filter(t => t.category === cat);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="text-xs font-heading font-semibold" style={{ color: CATEGORY_COLORS[cat] }}>{CATEGORY_LABELS[cat]}</div>
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

      <AIChatBot context="Student is reviewing a session replay" />
    </div>
  );
};

export default SessionReplay;
