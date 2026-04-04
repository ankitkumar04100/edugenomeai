import React, { useState } from 'react';
import { generateDemoPayload, PERSONAS } from '@/lib/demo-engine';
import { CATEGORY_COLORS, CATEGORY_LABELS, TRAIT_DEFINITIONS, type GenomeCategory } from '@/lib/genome-types';

// Deterministic clustering based on persona traits
interface Cluster {
  id: string;
  name: string;
  icon: string;
  description: string;
  strategy: string;
  students: Array<{ name: string; persona: string }>;
}

const mockStudents = [
  { name: 'Aisha Patel', persona: 'visual_thinker' },
  { name: 'Marcus Chen', persona: 'text_analyst' },
  { name: 'Sofia Rodriguez', persona: 'fast_risk_taker' },
  { name: 'James Kim', persona: 'visual_thinker' },
  { name: 'Priya Sharma', persona: 'text_analyst' },
  { name: 'Liam O\'Brien', persona: 'fast_risk_taker' },
];

const CLUSTERS: Cluster[] = [
  {
    id: 'visual-heavy',
    name: 'Visual Learners',
    icon: '🎨',
    description: 'High visual learning, strong pattern recognition, prefer diagrams',
    strategy: 'Use concept maps, diagrams-first explanations, visual problem sets',
    students: mockStudents.filter(s => s.persona === 'visual_thinker'),
  },
  {
    id: 'text-heavy',
    name: 'Text-Oriented',
    icon: '📖',
    description: 'High textual affinity, precise, methodical, low confusion',
    strategy: 'Provide detailed written explanations, structured reading, long-form analysis',
    students: mockStudents.filter(s => s.persona === 'text_analyst'),
  },
  {
    id: 'fast-risk',
    name: 'Fast Risk-Takers',
    icon: '⚡',
    description: 'Fast responses, higher error rate, needs pacing support',
    strategy: 'Add speed bumps, enforce review steps, gamify accuracy rewards',
    students: mockStudents.filter(s => s.persona === 'fast_risk_taker'),
  },
];

const CohortAnalytics: React.FC = () => {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Compute deterministic class-wide stats
  const allGenomes = mockStudents.map((s, i) => generateDemoPayload(s.persona, 40 + i * 5));
  const n = allGenomes.length;

  // Category averages
  const catAvgs: Record<GenomeCategory, number> = { cognitive: 0, behavioral: 0, learning_style: 0, performance: 0 };
  (Object.keys(catAvgs) as GenomeCategory[]).forEach(cat => {
    catAvgs[cat] = allGenomes.reduce((a, g) => a + g.categories[cat], 0) / n;
  });

  // Confusion/Fatigue distributions (bucket into ranges)
  const confusionBuckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
  const fatigueBuckets = [0, 0, 0, 0, 0];
  allGenomes.forEach(g => {
    confusionBuckets[Math.min(4, Math.floor(g.indices.confusion_index / 20))]++;
    fatigueBuckets[Math.min(4, Math.floor(g.indices.fatigue_index / 20))]++;
  });

  // Weakest traits
  const traitSums: Record<string, number> = {};
  allGenomes.forEach(g => {
    Object.entries(g.traits).forEach(([k, v]) => { traitSums[k] = (traitSums[k] || 0) + (v as number); });
  });
  const sortedTraits = Object.entries(traitSums).map(([k, v]) => ({ key: k, avg: v / n })).sort((a, b) => a.avg - b.avg);
  const weakest5 = sortedTraits.slice(0, 5);
  const improving5 = sortedTraits.slice(-5).reverse();

  const cluster = selectedCluster ? CLUSTERS.find(c => c.id === selectedCluster) : null;

  if (cluster) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedCluster(null)} className="text-xs text-primary hover:underline font-heading">← Back to Cohort</button>
        <div className="card-premium p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{cluster.icon}</span>
            <div>
              <h3 className="font-heading font-bold text-foreground">{cluster.name}</h3>
              <p className="text-xs text-muted-foreground">{cluster.description}</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
            <div className="text-xs font-heading font-semibold text-primary mb-1">💡 Recommended Strategy</div>
            <p className="text-xs text-foreground">{cluster.strategy}</p>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-heading font-semibold text-muted-foreground">Students ({cluster.students.length})</div>
            {cluster.students.map(s => (
              <div key={s.name} className="flex items-center justify-between p-2 bg-secondary rounded-xl">
                <span className="text-sm font-heading text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">{PERSONAS[s.persona].name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bucketLabels = ['0-20', '20-40', '40-60', '60-80', '80+'];

  return (
    <div className="space-y-4">
      {/* Category averages */}
      <div className="card-premium p-4">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Category Averages</h3>
        {(Object.keys(catAvgs) as GenomeCategory[]).map(cat => (
          <div key={cat} className="flex items-center gap-3 mb-2">
            <span className="text-xs w-24 font-heading" style={{ color: CATEGORY_COLORS[cat] }}>{CATEGORY_LABELS[cat]}</span>
            <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${catAvgs[cat]}%`, backgroundColor: CATEGORY_COLORS[cat] }} />
            </div>
            <span className="text-xs font-heading font-bold text-foreground w-8 text-right">{Math.round(catAvgs[cat])}</span>
          </div>
        ))}
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-premium p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-2">Confusion Distribution</h3>
          <div className="flex items-end gap-1 h-16">
            {confusionBuckets.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-red-400/60 rounded-t" style={{ height: `${(count / n) * 60}px` }} />
                <span className="text-[8px] text-muted-foreground mt-1">{bucketLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-premium p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-2">Fatigue Distribution</h3>
          <div className="flex items-end gap-1 h-16">
            {fatigueBuckets.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-amber-400/60 rounded-t" style={{ height: `${(count / n) * 60}px` }} />
                <span className="text-[8px] text-muted-foreground mt-1">{bucketLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weakest + Improving traits */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-premium p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-2">5 Weakest Traits</h3>
          {weakest5.map(t => (
            <div key={t.key} className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground truncate mr-2">{t.key.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-red-600">{Math.round(t.avg)}</span>
            </div>
          ))}
        </div>
        <div className="card-premium p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-2">5 Strongest Traits</h3>
          {improving5.map(t => (
            <div key={t.key} className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground truncate mr-2">{t.key.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-green-600">{Math.round(t.avg)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clusters */}
      <div className="card-premium p-4">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Learning Clusters</h3>
        <div className="grid grid-cols-3 gap-3">
          {CLUSTERS.map(c => (
            <button key={c.id} onClick={() => setSelectedCluster(c.id)}
              className="p-3 bg-secondary rounded-xl text-center hover:bg-secondary/80 transition-colors hover-lift">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-xs font-heading font-semibold text-foreground">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">{c.students.length} students</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CohortAnalytics;
