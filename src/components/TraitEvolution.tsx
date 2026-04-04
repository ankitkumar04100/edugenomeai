import React, { useState } from 'react';
import { TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, type GenomeCategory } from '@/lib/genome-types';

// Deterministic trait evolution data for demo
const DEMO_SESSIONS_DATA: Array<{ date: string; traits: Record<string, number>; score: number }> = [
  { date: '2026-03-28', traits: { pattern_recognition: 72, concept_absorption: 60, visual_learning: 78, focus_stability: 66, speed_accuracy_balance: 68, confusion_sensitivity: 48 }, score: 64 },
  { date: '2026-03-29', traits: { pattern_recognition: 74, concept_absorption: 63, visual_learning: 79, focus_stability: 68, speed_accuracy_balance: 70, confusion_sensitivity: 45 }, score: 66 },
  { date: '2026-03-30', traits: { pattern_recognition: 71, concept_absorption: 62, visual_learning: 80, focus_stability: 64, speed_accuracy_balance: 67, confusion_sensitivity: 50 }, score: 65 },
  { date: '2026-03-31', traits: { pattern_recognition: 76, concept_absorption: 65, visual_learning: 82, focus_stability: 70, speed_accuracy_balance: 73, confusion_sensitivity: 42 }, score: 69 },
  { date: '2026-04-01', traits: { pattern_recognition: 78, concept_absorption: 66, visual_learning: 83, focus_stability: 71, speed_accuracy_balance: 74, confusion_sensitivity: 40 }, score: 71 },
  { date: '2026-04-02', traits: { pattern_recognition: 75, concept_absorption: 68, visual_learning: 84, focus_stability: 69, speed_accuracy_balance: 72, confusion_sensitivity: 43 }, score: 70 },
  { date: '2026-04-03', traits: { pattern_recognition: 79, concept_absorption: 70, visual_learning: 85, focus_stability: 73, speed_accuracy_balance: 76, confusion_sensitivity: 38 }, score: 73 },
];

function getSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((a, v, i) => a + i * v, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function getStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
}

const TraitEvolution: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<GenomeCategory>('cognitive');
  const [selectedTrait, setSelectedTrait] = useState<string>('pattern_recognition');
  const [timeRange, setTimeRange] = useState<'last' | '7' | '30'>('7');

  const categoryTraits = TRAIT_DEFINITIONS.filter(t => t.category === selectedCategory);
  const data = DEMO_SESSIONS_DATA;

  // Extract values for selected trait
  const traitValues = data.map(d => d.traits[selectedTrait] ?? 60);
  const slope = getSlope(traitValues);
  const volatility = getStdDev(traitValues);
  const trend = slope > 0.3 ? 'improving' : slope < -0.3 ? 'declining' : 'stable';
  const stability = volatility > 4 ? 'unstable' : 'stable';

  // SVG chart dimensions
  const chartW = 400;
  const chartH = 120;
  const padding = 20;

  const minVal = Math.min(...traitValues) - 5;
  const maxVal = Math.max(...traitValues) + 5;
  const range = maxVal - minVal || 1;

  const points = traitValues.map((v, i) => {
    const x = padding + (i / (traitValues.length - 1)) * (chartW - padding * 2);
    const y = chartH - padding - ((v - minVal) / range) * (chartH - padding * 2);
    return { x, y, v };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Trendline
  const firstY = chartH - padding - ((traitValues[0] - minVal) / range) * (chartH - padding * 2);
  const lastY = chartH - padding - ((traitValues[0] + slope * (traitValues.length - 1) - minVal) / range) * (chartH - padding * 2);

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); setSelectedTrait(TRAIT_DEFINITIONS.find(t => t.category === cat)?.key || ''); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-medium border transition-all ${
              selectedCategory === cat ? 'text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
            style={selectedCategory === cat ? { borderColor: CATEGORY_COLORS[cat], backgroundColor: CATEGORY_COLORS[cat] + '15' } : {}}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Trait selector */}
      <div className="flex flex-wrap gap-1">
        {categoryTraits.map(t => (
          <button
            key={t.key}
            onClick={() => setSelectedTrait(t.key)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-heading transition-all ${
              selectedTrait === t.key
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.name.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      {/* Time range */}
      <div className="flex gap-1 bg-secondary rounded-xl p-0.5 w-fit">
        {[{ k: 'last', l: 'Last Session' }, { k: '7', l: 'Last 7' }, { k: '30', l: 'Last 30d' }].map(r => (
          <button key={r.k} onClick={() => setTimeRange(r.k as any)}
            className={`px-3 py-1 rounded-lg text-xs font-heading font-medium transition-all ${timeRange === r.k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {r.l}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="card-premium p-4">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-32">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = chartH - padding - f * (chartH - padding * 2);
            return <line key={f} x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="hsl(220, 13%, 91%)" strokeWidth={0.5} />;
          })}
          {/* Trendline */}
          <line x1={points[0].x} y1={firstY} x2={points[points.length - 1].x} y2={lastY}
            stroke={slope > 0.3 ? '#10B981' : slope < -0.3 ? '#EF4444' : '#94A3B8'} strokeWidth={1.5} strokeDasharray="4,4" opacity={0.6} />
          {/* Data line */}
          <polyline fill="none" stroke={CATEGORY_COLORS[selectedCategory]} strokeWidth={2} points={polyline} />
          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill={CATEGORY_COLORS[selectedCategory]} />
          ))}
          {/* Y-axis labels */}
          <text x={2} y={padding + 4} fontSize={8} fill="#94A3B8">{Math.round(maxVal)}</text>
          <text x={2} y={chartH - padding + 4} fontSize={8} fill="#94A3B8">{Math.round(minVal)}</text>
        </svg>

        {/* Date labels */}
        <div className="flex justify-between text-[9px] text-muted-foreground px-5">
          {data.map((d, i) => (
            <span key={i}>{d.date.slice(5)}</span>
          ))}
        </div>
      </div>

      {/* Markers */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`card-premium p-3 text-center ${trend === 'improving' ? 'border-green-200 bg-green-50/50' : trend === 'declining' ? 'border-red-200 bg-red-50/50' : ''}`}>
          <div className="text-lg">{trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'}</div>
          <div className="text-xs font-heading font-semibold text-foreground capitalize">{trend}</div>
          <div className="text-[10px] text-muted-foreground">Slope: {slope.toFixed(2)}/session</div>
        </div>
        <div className={`card-premium p-3 text-center ${stability === 'unstable' ? 'border-amber-200 bg-amber-50/50' : ''}`}>
          <div className="text-lg">{stability === 'unstable' ? '⚡' : '🎯'}</div>
          <div className="text-xs font-heading font-semibold text-foreground capitalize">{stability}</div>
          <div className="text-[10px] text-muted-foreground">σ = {volatility.toFixed(1)}</div>
        </div>
        <div className="card-premium p-3 text-center">
          <div className="text-lg">📊</div>
          <div className="text-xs font-heading font-semibold text-foreground">{Math.round(traitValues[traitValues.length - 1])}</div>
          <div className="text-[10px] text-muted-foreground">Current</div>
        </div>
      </div>
    </div>
  );
};

export default TraitEvolution;
