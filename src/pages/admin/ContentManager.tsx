import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const DIFFICULTIES = [1, 2, 3, 4, 5];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Computer Science'];

const ContentManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<number | ''>('');

  // Form state
  const [title, setTitle] = useState('');
  const [stem, setStem] = useState('');
  const [type, setType] = useState('mcq');
  const [difficulty, setDifficulty] = useState(2);
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [hintText, setHintText] = useState('');

  const { data: questions = [] } = useQuery({
    queryKey: ['question-bank', filterSubject, filterDifficulty],
    queryFn: async () => {
      let q = supabase.from('question_bank').select('*').order('created_at', { ascending: false });
      if (filterSubject) q = q.eq('subject', filterSubject);
      if (filterDifficulty !== '') q = q.eq('difficulty', filterDifficulty);
      const { data } = await q;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setTitle(''); setStem(''); setType('mcq'); setDifficulty(2); setSubject('Mathematics');
    setTopic(''); setOptions(['', '', '', '']); setCorrectAnswer(''); setHintText('');
    setEditId(null); setShowCreate(false);
  };

  const saveQuestion = async () => {
    if (!title || !stem || !user) return;
    const qData = { title, stem, type, difficulty, subject, topic, created_by: user.id, published: false };

    if (editId) {
      const { error } = await supabase.from('question_bank').update(qData).eq('id', editId);
      if (error) { toast.error(error.message); return; }
      // Update options
      await supabase.from('question_options').delete().eq('question_id', editId);
      await supabase.from('question_options').insert({ question_id: editId, options_json: options.filter(Boolean), correct_answer: correctAnswer });
      if (hintText) {
        await supabase.from('question_hints').delete().eq('question_id', editId);
        await supabase.from('question_hints').insert({ question_id: editId, hint_type: 'text', content: hintText });
      }
      toast.success('Question updated');
    } else {
      const { data: newQ, error } = await supabase.from('question_bank').insert(qData).select().single();
      if (error) { toast.error(error.message); return; }
      await supabase.from('question_options').insert({ question_id: newQ.id, options_json: options.filter(Boolean), correct_answer: correctAnswer });
      if (hintText) {
        await supabase.from('question_hints').insert({ question_id: newQ.id, hint_type: 'text', content: hintText });
      }
      toast.success('Question created');
    }
    resetForm();
    queryClient.invalidateQueries({ queryKey: ['question-bank'] });
  };

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from('question_bank').update({ published: !published }).eq('id', id);
    toast.success(published ? 'Unpublished' : 'Published');
    queryClient.invalidateQueries({ queryKey: ['question-bank'] });
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await supabase.from('question_bank').delete().eq('id', id);
    toast.success('Question deleted');
    queryClient.invalidateQueries({ queryKey: ['question-bank'] });
  };

  const editQuestion = async (q: any) => {
    setEditId(q.id); setTitle(q.title); setStem(q.stem); setType(q.type);
    setDifficulty(q.difficulty); setSubject(q.subject || ''); setTopic(q.topic || '');
    // Load options
    const { data: opts } = await supabase.from('question_options').select('*').eq('question_id', q.id).maybeSingle();
    if (opts) {
      setOptions((opts.options_json as string[]) || ['', '', '', '']);
      setCorrectAnswer(opts.correct_answer);
    }
    const { data: hints } = await supabase.from('question_hints').select('*').eq('question_id', q.id).limit(1);
    if (hints?.[0]) setHintText(hints[0].content);
    setShowCreate(true);
  };

  return (
    <div className="container px-4 py-8 max-w-5xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <div className="flex items-center justify-between mt-1 mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">📚 Content Manager</h1>
        <button onClick={() => { resetForm(); setShowCreate(!showCreate); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold">
          <Plus className="w-3.5 h-3.5" /> New Question
        </button>
      </div>

      {showCreate && (
        <div className="card-premium p-5 mb-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">{editId ? 'Edit Question' : 'Create Question'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-heading block mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-heading block mb-1">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white border border-border rounded-xl px-2 py-2 text-xs font-heading focus:outline-none">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-heading block mb-1">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(+e.target.value)} className="w-full bg-white border border-border rounded-xl px-2 py-2 text-xs font-heading focus:outline-none">
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-heading block mb-1">Topic</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-white border border-border rounded-xl px-2 py-2 text-xs focus:outline-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-heading block mb-1">Question Stem</label>
            <textarea value={stem} onChange={e => setStem(e.target.value)} rows={3} className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-heading block mb-1">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{String.fromCharCode(65 + i)}.</span>
                  <input value={opt} onChange={e => { const copy = [...options]; copy[i] = e.target.value; setOptions(copy); }}
                    className="flex-1 bg-white border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-heading block mb-1">Correct Answer</label>
              <input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} placeholder="e.g. A"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-heading block mb-1">Hint (Text)</label>
              <input value={hintText} onChange={e => setHintText(e.target.value)} placeholder="Optional hint..."
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveQuestion} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold">{editId ? 'Update' : 'Create'}</button>
            <button onClick={resetForm} className="px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-heading font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-xs font-heading focus:outline-none">
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value ? +e.target.value : '')}
          className="bg-white border border-border rounded-xl px-3 py-2 text-xs font-heading focus:outline-none">
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>Level {d}</option>)}
        </select>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {questions.map((q: any) => (
          <div key={q.id} className="card-premium p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-heading font-semibold text-sm text-foreground">{q.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-heading font-semibold ${q.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {q.published ? 'Published' : 'Draft'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">Lv{q.difficulty}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">{q.stem}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{q.subject} • {q.topic || 'General'}</div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button onClick={() => togglePublish(q.id, q.published)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={q.published ? 'Unpublish' : 'Publish'}>
                {q.published ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <button onClick={() => editQuestion(q)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No questions in the bank. Create your first question above.</div>}
      </div>
    </div>
  );
};

export default ContentManager;
