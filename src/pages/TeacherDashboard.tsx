import React, { useState, useEffect } from 'react';
import GenomeWheel from '@/components/GenomeWheel';
import ConfusionFatigueBadges from '@/components/ConfusionFatigueBadges';
import { generateDemoPayload, PERSONAS } from '@/lib/demo-engine';
import { GenomePayload, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory } from '@/lib/genome-types';
import { Link } from 'react-router-dom';

const mockStudents = [
  { id: '1', name: 'Aisha Patel', persona: 'visual_thinker', grade: 'A-', sessions: 12 },
  { id: '2', name: 'Marcus Chen', persona: 'text_analyst', grade: 'B+', sessions: 8 },
  { id: '3', name: 'Sofia Rodriguez', persona: 'fast_risk_taker', grade: 'B', sessions: 15 },
  { id: '4', name: 'James Kim', persona: 'visual_thinker', grade: 'A', sessions: 20 },
  { id: '5', name: 'Priya Sharma', persona: 'text_analyst', grade: 'A+', sessions: 18 },
  { id: '6', name: 'Liam O\'Brien', persona: 'fast_risk_taker', grade: 'C+', sessions: 6 },
];

const TeacherDashboard: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [studentData, setStudentData] = useState<Record<string, GenomePayload>>({});

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const data: Record<string, GenomePayload> = {};
    mockStudents.forEach((s, i) => {
      data[s.id] = generateDemoPayload(s.persona, tick + i * 10);
    });
    setStudentData(data);
  }, [tick]);

  const selected = selectedStudent ? mockStudents.find(s => s.id === selectedStudent) : null;
  const selectedGenome = selectedStudent ? studentData[selectedStudent] : null;

  // Watchlist: students with high confusion or fatigue
  const watchlist = mockStudents.filter(s => {
    const g = studentData[s.id];
    return g && (g.indices.confusion_index > 50 || g.indices.fatigue_index > 50);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🧬</span>
            <span className="font-heading font-bold text-foreground">EduGenome AI</span>
          </Link>
          <span className="text-xs text-muted-foreground font-heading">Teacher Dashboard</span>
        </div>
      </header>

      <div className="container px-4 py-6">
        {!selectedStudent ? (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Class Overview</h1>

            {/* Watchlist */}
            {watchlist.length > 0 && (
              <div className="card-premium p-4 mb-6 border-amber-200 bg-amber-50/50">
                <h3 className="font-heading font-semibold text-sm text-amber-800 mb-2">⚠️ Attention Watchlist</h3>
                <div className="flex flex-wrap gap-2">
                  {watchlist.map(s => {
                    const g = studentData[s.id];
                    return (
                      <button key={s.id} onClick={() => setSelectedStudent(s.id)}
                        className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs text-foreground hover:bg-amber-50 transition-colors">
                        {s.name} — C:{Math.round(g?.indices.confusion_index || 0)} F:{Math.round(g?.indices.fatigue_index || 0)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockStudents.map(student => {
                const genome = studentData[student.id];
                if (!genome) return null;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className="card-premium p-4 hover:border-primary/40 transition-all text-left group hover-lift"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-heading font-semibold text-foreground">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{PERSONAS[student.persona].name}</div>
                      </div>
                      <span className="text-sm font-heading font-bold text-primary">{student.grade}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <GenomeWheel data={genome} size={120} interactive={false} />
                      <div className="space-y-2 flex-1">
                        <ConfusionFatigueBadges indices={genome.indices} />
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
                            <div key={cat} className="text-center p-1 rounded-lg bg-secondary">
                              <div className="text-xs font-bold" style={{ color: CATEGORY_COLORS[cat] }}>
                                {Math.round(genome.categories[cat])}
                              </div>
                              <div className="text-[8px] text-muted-foreground">{CATEGORY_LABELS[cat].slice(0, 4)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{student.sessions} sessions</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setSelectedStudent(null)} className="text-xs text-primary hover:underline font-heading mb-4 inline-block">
              ← Back to Class
            </button>
            {selected && selectedGenome && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{selected.name}</h1>
                  <ConfusionFatigueBadges indices={selectedGenome.indices} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-premium p-6 flex justify-center">
                    <GenomeWheel data={selectedGenome} size={420} />
                  </div>
                  <div className="space-y-4">
                    <div className="card-premium p-4">
                      <h3 className="font-heading font-semibold text-sm mb-3 text-foreground">Category Scores</h3>
                      {(Object.keys(CATEGORY_COLORS) as GenomeCategory[]).map(cat => (
                        <div key={cat} className="flex items-center gap-3 mb-2">
                          <span className="text-xs w-24 font-heading" style={{ color: CATEGORY_COLORS[cat] }}>{CATEGORY_LABELS[cat]}</span>
                          <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${selectedGenome.categories[cat]}%`, backgroundColor: CATEGORY_COLORS[cat] }} />
                          </div>
                          <span className="text-xs font-heading font-bold text-foreground w-8 text-right">{Math.round(selectedGenome.categories[cat])}</span>
                        </div>
                      ))}
                    </div>
                    <div className="card-premium p-4">
                      <h3 className="font-heading font-semibold text-sm mb-2 text-foreground">Student Info</h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Profile: {PERSONAS[selected.persona].name}</div>
                        <div>Sessions: {selected.sessions}</div>
                        <div>Grade: {selected.grade}</div>
                        <div>Overall Genome Score: <span className="font-bold text-foreground">{Math.round(selectedGenome.overall_genome_score)}</span></div>
                      </div>
                    </div>
                    <Link to={`/replay?persona=${selected.persona}`} className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-heading font-semibold hover:opacity-90">
                      🔄 View Session Replay
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
