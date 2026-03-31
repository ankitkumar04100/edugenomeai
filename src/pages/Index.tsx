import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GenomeWheel from '@/components/GenomeWheel';
import { generateDemoPayload } from '@/lib/demo-engine';
import { TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory } from '@/lib/genome-types';

const Index: React.FC = () => {
  const [tick, setTick] = useState(0);
  const demoData = generateDemoPayload('visual_thinker', tick);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧬</span>
            <span className="font-heading font-bold text-lg text-foreground">EduGenome AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/student" className="text-xs text-muted-foreground hover:text-foreground font-heading transition-colors">Student</Link>
            <Link to="/teacher" className="text-xs text-muted-foreground hover:text-foreground font-heading transition-colors">Teacher</Link>
            <Link to="/docs" className="text-xs text-muted-foreground hover:text-foreground font-heading transition-colors">Docs</Link>
            <Link to="/auth" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-heading font-semibold hover:opacity-90 transition-opacity">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 relative">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="container px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight text-foreground mb-4">
                🧬 EduGenome AI
              </h1>
              <p className="text-xl md:text-2xl text-gradient-genome font-heading font-semibold mb-4">
                Decoding the Learning Genome of Every Student
              </p>
              <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-lg leading-relaxed">
                A Behavioral Intelligence Layer that decodes how each student learns. Eye Tracking + ML + Genome Visualization → a 24-trait Learning Genome, updated in real-time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/student" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity">
                  🚀 Try Demo Mode
                </Link>
                <Link to="/student" className="px-6 py-3 border border-border text-foreground rounded-xl font-heading font-semibold hover:bg-secondary transition-colors">
                  Student Dashboard
                </Link>
                <Link to="/teacher" className="px-6 py-3 border border-border text-foreground rounded-xl font-heading font-semibold hover:bg-secondary transition-colors">
                  Teacher Dashboard
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center animate-float"
            >
              <GenomeWheel data={demoData} size={420} interactive={false} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 border-t border-border">
        <div className="container px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">The Problem</h2>
            <p className="text-muted-foreground leading-relaxed">
              Education measures answers, not thinking. No real-time behavior tracking, no learning style detection, one-size-fits-all approaches. Students struggle in silence while the system looks at grades.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">The Solution</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A 24-trait Learning Genome built from eye tracking + response analytics + ML, visualized as a real-time Genome Wheel. Micro-behaviors become traits. Confusion and fatigue are detected instantly. Every student gets a personalized learning blueprint.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 24 Traits */}
      <section className="py-16 border-t border-border">
        <div className="container px-4">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-8 text-center">24 Learning Traits</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
              <div key={cat} className="space-y-1">
                <div className="font-heading font-semibold text-sm mb-2" style={{ color: CATEGORY_COLORS[cat] }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                {TRAIT_DEFINITIONS.filter(t => t.category === cat).map(t => (
                  <div key={t.key} className="text-xs text-muted-foreground py-1 border-b border-border/50">
                    {t.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container px-4 max-w-4xl">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Capture', desc: 'Browser eye-tracking via Mediapipe FaceMesh' },
              { step: '2', title: 'Extract', desc: '40+ behavioral metrics computed locally' },
              { step: '3', title: 'Analyze', desc: 'ML models infer 24 trait scores + indices' },
              { step: '4', title: 'Visualize', desc: 'Real-time Genome Wheel updates every 1–2s' },
              { step: '5', title: 'Recommend', desc: 'Actionable insights personalized per student' },
            ].map(s => (
              <div key={s.step} className="text-center bg-card border border-border rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-heading font-bold">{s.step}</div>
                <div className="font-heading font-semibold text-sm text-foreground mb-1">{s.title}</div>
                <div className="text-[11px] text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 border-t border-border">
        <div className="container px-4 max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">🔒 Privacy by Design</h2>
          <p className="text-muted-foreground leading-relaxed">
            Webcam processed locally. No video stored. No frames leave your device. Only derived behavioral metrics (numbers) are used for analysis. GDPR-friendly. Full consent management.
          </p>
        </div>
      </section>

      {/* What's Unique */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container px-4 max-w-4xl">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 text-center">What Makes EduGenome Unique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Micro-behaviors → Traits', desc: 'Not quizzes or surveys—actual behavioral signals decoded into learning traits.' },
              { title: 'Real-time Confusion Detection', desc: 'Spot confusion and fatigue as they happen, not after the exam.' },
              { title: 'Actionable Insights', desc: 'Every update comes with personalized, evidence-based recommendations.' },
              { title: 'Not a chatbot', desc: 'A behavioral intelligence layer—not a chatbot, not a quiz app. A true learning genome.' },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="font-heading font-semibold text-sm text-foreground mb-1">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🧬</span>
            <span className="font-heading font-bold text-sm text-foreground">EduGenome AI</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
