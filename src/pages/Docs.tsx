import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory } from '@/lib/genome-types';

const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'traits' | 'indices' | 'pipeline' | 'privacy'>('traits');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <span className="text-xs text-muted-foreground font-heading">Documentation</span>
        </div>
      </header>
      <div className="container px-4 py-8">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Documentation</h1>

        <div className="flex gap-1 bg-secondary rounded-2xl p-1 w-fit mb-8">
          {(['traits', 'indices', 'pipeline', 'privacy'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-heading font-medium capitalize transition-all ${activeSection === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              role="tab" aria-selected={activeSection === s}>
              {s === 'traits' ? '24 Traits' : s === 'indices' ? 'Indices' : s === 'pipeline' ? 'Pipeline' : 'Privacy'}
            </button>
          ))}
        </div>

        {activeSection === 'traits' && (
          <div className="space-y-6">
            {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
              <div key={cat}>
                <h3 className="font-heading font-bold text-lg mb-3" style={{ color: CATEGORY_COLORS[cat] }}>
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TRAIT_DEFINITIONS.filter(t => t.category === cat).map(trait => (
                    <div key={trait.key} className="card-premium p-4">
                      <div className="font-heading font-semibold text-sm text-foreground mb-1">{trait.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">{trait.definition}</div>
                      <div className="text-xs text-muted-foreground"><strong className="text-foreground">Why it matters:</strong> {trait.whyItMatters}</div>
                      <div className="text-xs text-muted-foreground mt-1"><strong className="text-foreground">Signals:</strong> {trait.signals.join(', ')}</div>
                      <div className="text-xs text-primary mt-1">💡 {trait.tip}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'indices' && (
          <div className="max-w-2xl space-y-6">
            <div className="card-premium p-6">
              <h3 className="font-heading font-semibold text-foreground mb-2">❓ Confusion Index (0–100)</h3>
              <p className="text-sm text-muted-foreground mb-2">&gt;70: High confusion. 50–70: Moderate. &lt;50: Low.</p>
              <p className="text-xs text-muted-foreground"><strong className="text-foreground">Signals:</strong> Hesitation peaks, gaze variance, wrong-after-delay patterns, increased blink rate during complex tasks.</p>
            </div>
            <div className="card-premium p-6">
              <h3 className="font-heading font-semibold text-foreground mb-2">😴 Fatigue Index (0–100)</h3>
              <p className="text-sm text-muted-foreground mb-2">&gt;65: High fatigue. 45–65: Moderate. &lt;45: Low.</p>
              <p className="text-xs text-muted-foreground"><strong className="text-foreground">Signals:</strong> Blink rate spikes, response time slowdown, session duration, decreased eye openness.</p>
            </div>
          </div>
        )}

        {activeSection === 'pipeline' && (
          <div className="max-w-2xl space-y-4">
            <div className="card-premium p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">🔬 Under the Hood</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3"><span className="font-heading font-bold text-primary">1.</span> <span><strong className="text-foreground">Capture</strong> — Browser webcam → Mediapipe FaceMesh/Iris extracts eye landmarks locally</span></li>
                <li className="flex gap-3"><span className="font-heading font-bold text-primary">2.</span> <span><strong className="text-foreground">Extract</strong> — 40+ features computed: blink rate, gaze drift, fixation, saccades, response times</span></li>
                <li className="flex gap-3"><span className="font-heading font-bold text-primary">3.</span> <span><strong className="text-foreground">Transmit</strong> — Only numerical metrics sent to backend (no video frames)</span></li>
                <li className="flex gap-3"><span className="font-heading font-bold text-primary">4.</span> <span><strong className="text-foreground">Infer</strong> — LightGBM multi-output → 24 traits; SVM → Confusion; ElasticNet → Fatigue</span></li>
                <li className="flex gap-3"><span className="font-heading font-bold text-primary">5.</span> <span><strong className="text-foreground">Visualize</strong> — D3.js Genome Wheel updates every 1–2s with spring animations</span></li>
              </ol>
              <div className="mt-4 text-xs text-muted-foreground">
                <strong className="text-foreground">Demo Mode:</strong> Uses deterministic, fixed time-series data — identical on every run, no randomness. Three personas available for demonstration.
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="max-w-2xl">
            <div className="card-premium p-6 text-sm text-muted-foreground space-y-3">
              <p>All webcam processing is local. No video frames or audio are stored or transmitted.</p>
              <p>Only derived behavioral metrics (numerical values) are sent to the backend.</p>
              <p>TLS encryption for all API communications. JWT authentication with role-based access.</p>
              <p>GDPR-compliant: consent screen, data export, data deletion.</p>
              <p>Demo Mode uses deterministic fixed data — no user data is generated or stored.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Docs;
