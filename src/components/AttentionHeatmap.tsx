import React from 'react';
import { GRID_SIZE, type HeatmapSnapshot, type HeatmapSummary } from '@/lib/heatmap-engine';

interface Props {
  snapshot: HeatmapSnapshot | null;
  summary?: HeatmapSummary | null;
  width?: number;
  height?: number;
}

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'transparent';
  const intensity = Math.min(value / max, 1);
  // Blue → Cyan → Green → Yellow → Red
  if (intensity < 0.25) {
    const t = intensity / 0.25;
    return `hsla(220, 80%, 60%, ${0.1 + t * 0.3})`;
  } else if (intensity < 0.5) {
    const t = (intensity - 0.25) / 0.25;
    return `hsla(160, 70%, 50%, ${0.3 + t * 0.2})`;
  } else if (intensity < 0.75) {
    const t = (intensity - 0.5) / 0.25;
    return `hsla(45, 90%, 55%, ${0.4 + t * 0.2})`;
  } else {
    const t = (intensity - 0.75) / 0.25;
    return `hsla(0, 80%, 55%, ${0.5 + t * 0.3})`;
  }
}

const AttentionHeatmap: React.FC<Props> = ({ snapshot, summary, width = 240, height = 200 }) => {
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ width, height }}>
        No heatmap data
      </div>
    );
  }

  const cellW = width / GRID_SIZE;
  const cellH = height / GRID_SIZE;
  const maxCount = Math.max(...snapshot.gridCounts, 1);

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/50" style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {snapshot.gridCounts.map((count, idx) => {
            const row = Math.floor(idx / GRID_SIZE);
            const col = idx % GRID_SIZE;
            return (
              <rect
                key={idx}
                x={col * cellW}
                y={row * cellH}
                width={cellW}
                height={cellH}
                fill={getHeatColor(count, maxCount)}
                stroke="hsl(220, 13%, 91%)"
                strokeWidth={0.5}
                strokeOpacity={0.3}
              />
            );
          })}
        </svg>
        <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-sm rounded-lg px-1.5 py-0.5 text-[9px] text-muted-foreground">
          {snapshot.totalSamples} samples
        </div>
      </div>
      {summary && (
        <div className="grid grid-cols-3 gap-1">
          <div className="text-center p-1.5 bg-secondary rounded-lg">
            <div className="text-xs font-heading font-bold text-foreground">{summary.gazeScatterScore}%</div>
            <div className="text-[9px] text-muted-foreground">Scatter</div>
          </div>
          <div className="text-center p-1.5 bg-secondary rounded-lg">
            <div className="text-xs font-heading font-bold text-foreground">{summary.lookAwayFrequency}%</div>
            <div className="text-[9px] text-muted-foreground">Look-away</div>
          </div>
          <div className="text-center p-1.5 bg-secondary rounded-lg">
            <div className="text-xs font-heading font-bold text-foreground">{summary.fixationStability}%</div>
            <div className="text-[9px] text-muted-foreground">Fixation</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttentionHeatmap;
