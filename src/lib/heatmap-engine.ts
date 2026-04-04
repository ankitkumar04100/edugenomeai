// Attention Heatmap Engine — coarse 12x12 grid buckets (privacy-safe)
// No raw coordinates saved, only bucket counts

export const GRID_SIZE = 12;
export const TOTAL_BUCKETS = GRID_SIZE * GRID_SIZE;

export interface HeatmapSnapshot {
  questionId: string;
  gridCounts: number[]; // 144 values (12x12)
  totalSamples: number;
  timestamp: number;
}

export interface HeatmapSummary {
  gazeScatterScore: number;    // 0-100: how scattered the gaze is
  lookAwayFrequency: number;   // 0-100
  fixationStability: number;   // 0-100
}

// Deterministic heatmap patterns per persona
const DEMO_PATTERNS: Record<string, (qIdx: number) => number[]> = {
  visual_thinker: (qIdx: number) => {
    // Concentrated on center-left (diagram area)
    const grid = new Array(TOTAL_BUCKETS).fill(0);
    const seed = (qIdx * 7 + 3) % 10;
    // Focus on rows 3-8, cols 1-6 (diagram region)
    for (let r = 3; r <= 8; r++) {
      for (let c = 1; c <= 6; c++) {
        const idx = r * GRID_SIZE + c;
        const dist = Math.abs(r - 5.5) + Math.abs(c - 3.5);
        grid[idx] = Math.max(1, Math.round(20 - dist * 3 + (seed % 3)));
      }
    }
    // Some attention on answer area (rows 9-11, cols 3-8)
    for (let r = 9; r <= 11; r++) {
      for (let c = 3; c <= 8; c++) {
        grid[r * GRID_SIZE + c] = 3 + (seed % 2);
      }
    }
    return grid;
  },
  text_analyst: (qIdx: number) => {
    // Concentrated on right side (text area)
    const grid = new Array(TOTAL_BUCKETS).fill(0);
    const seed = (qIdx * 11 + 5) % 10;
    // Focus on rows 2-9, cols 5-11 (text region)
    for (let r = 2; r <= 9; r++) {
      for (let c = 5; c <= 11; c++) {
        const idx = r * GRID_SIZE + c;
        const dist = Math.abs(r - 5) + Math.abs(c - 8);
        grid[idx] = Math.max(1, Math.round(18 - dist * 2 + (seed % 4)));
      }
    }
    return grid;
  },
  fast_risk_taker: (qIdx: number) => {
    // Scattered pattern + more peripheral
    const grid = new Array(TOTAL_BUCKETS).fill(0);
    const seed = (qIdx * 13 + 7) % 10;
    // Scattered across all cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const idx = r * GRID_SIZE + c;
        grid[idx] = Math.max(0, Math.round(5 + ((r * 3 + c * 7 + seed) % 8) - 3));
      }
    }
    // Slight center bias
    for (let r = 4; r <= 7; r++) {
      for (let c = 4; c <= 7; c++) {
        grid[r * GRID_SIZE + c] += 4;
      }
    }
    return grid;
  },
};

export class HeatmapCollector {
  private grid: number[] = new Array(TOTAL_BUCKETS).fill(0);
  private totalSamples = 0;
  private lookAwayCount = 0;
  private currentQuestionId = '';

  reset(questionId: string) {
    this.grid = new Array(TOTAL_BUCKETS).fill(0);
    this.totalSamples = 0;
    this.lookAwayCount = 0;
    this.currentQuestionId = questionId;
  }

  // Convert normalized gaze coordinates (0-1) to bucket and increment
  addGazePoint(normalizedX: number, normalizedY: number) {
    if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) {
      this.lookAwayCount++;
      return;
    }
    const col = Math.min(GRID_SIZE - 1, Math.floor(normalizedX * GRID_SIZE));
    const row = Math.min(GRID_SIZE - 1, Math.floor(normalizedY * GRID_SIZE));
    this.grid[row * GRID_SIZE + col]++;
    this.totalSamples++;
  }

  getSnapshot(): HeatmapSnapshot {
    return {
      questionId: this.currentQuestionId,
      gridCounts: [...this.grid],
      totalSamples: this.totalSamples,
      timestamp: Date.now(),
    };
  }

  getSummary(): HeatmapSummary {
    const total = this.totalSamples || 1;
    const nonZeroBuckets = this.grid.filter(v => v > 0).length;

    // Scatter: what fraction of buckets have counts vs concentrated
    const gazeScatterScore = Math.round((nonZeroBuckets / TOTAL_BUCKETS) * 100);

    // Look-away frequency
    const lookAwayFrequency = Math.round((this.lookAwayCount / (total + this.lookAwayCount)) * 100);

    // Fixation stability: how concentrated in top buckets
    const sorted = [...this.grid].sort((a, b) => b - a);
    const top5Sum = sorted.slice(0, 5).reduce((a, b) => a + b, 0);
    const fixationStability = Math.round((top5Sum / total) * 100);

    return { gazeScatterScore, lookAwayFrequency, fixationStability };
  }

  // Generate deterministic heatmap for demo mode
  static generateDemoHeatmap(persona: string, questionIdx: number): HeatmapSnapshot {
    const fn = DEMO_PATTERNS[persona] || DEMO_PATTERNS.visual_thinker;
    const grid = fn(questionIdx);
    return {
      questionId: `q${questionIdx + 1}`,
      gridCounts: grid,
      totalSamples: grid.reduce((a, b) => a + b, 0),
      timestamp: Date.now(),
    };
  }

  static getDemoSummary(persona: string): HeatmapSummary {
    const summaries: Record<string, HeatmapSummary> = {
      visual_thinker: { gazeScatterScore: 28, lookAwayFrequency: 8, fixationStability: 72 },
      text_analyst: { gazeScatterScore: 22, lookAwayFrequency: 5, fixationStability: 81 },
      fast_risk_taker: { gazeScatterScore: 65, lookAwayFrequency: 22, fixationStability: 35 },
    };
    return summaries[persona] || summaries.visual_thinker;
  }
}

export const heatmapCollector = new HeatmapCollector();
