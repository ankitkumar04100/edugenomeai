// Session persistence service — save/load sessions to Supabase
import { supabase } from '@/integrations/supabase/client';
import type { GenomePayload } from './genome-types';

export interface SessionRecord {
  id: string;
  mode: string;
  persona: string | null;
  started_at: string;
  ended_at: string | null;
  overall_score: number | null;
  avg_confusion: number | null;
  avg_fatigue: number | null;
}

export async function startSession(userId: string, mode: 'demo' | 'live', persona?: string): Promise<string | null> {
  const { data, error } = await supabase.from('sessions').insert({
    user_id: userId,
    mode,
    persona: persona || null,
  }).select('id').single();
  if (error) { console.error('[Session] Start error:', error); return null; }
  return data.id;
}

export async function endSession(sessionId: string, genome: GenomePayload) {
  const { error } = await supabase.from('sessions').update({
    ended_at: new Date().toISOString(),
    overall_score: genome.overall_genome_score,
    avg_confusion: genome.indices.confusion_index,
    avg_fatigue: genome.indices.fatigue_index,
  }).eq('id', sessionId);
  if (error) console.error('[Session] End error:', error);
}

export async function saveMetricsBatch(sessionId: string, metrics: Record<string, any>) {
  const { error } = await supabase.from('metrics').insert({
    session_id: sessionId,
    timestamp_ms: Date.now(),
    data: metrics as any,
  });
  if (error) console.error('[Session] Metrics error:', error);
}

export async function saveGenomeSnapshot(sessionId: string, genome: GenomePayload) {
  const { error } = await supabase.from('genome_snapshots').insert({
    session_id: sessionId,
    timestamp_ms: Date.now(),
    traits: genome.traits as any,
    categories: genome.categories as any,
    indices: genome.indices as any,
    overall_score: genome.overall_genome_score,
  });
  if (error) console.error('[Session] Snapshot error:', error);
}

export async function saveSessionEvent(sessionId: string, eventType: string, payload: Record<string, any> = {}) {
  const { error } = await supabase.from('session_events').insert({
    session_id: sessionId,
    timestamp_ms: Date.now(),
    event_type: eventType,
    payload: payload as any,
  });
  if (error) console.error('[Session] Event error:', error);
}

export async function getUserSessions(userId: string): Promise<SessionRecord[]> {
  const { data, error } = await supabase.from('sessions')
    .select('id, mode, persona, started_at, ended_at, overall_score, avg_confusion, avg_fatigue')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) { console.error('[Session] List error:', error); return []; }
  return (data || []) as SessionRecord[];
}

export async function getSessionSnapshots(sessionId: string) {
  const { data, error } = await supabase.from('genome_snapshots')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp_ms', { ascending: true });
  if (error) { console.error('[Session] Snapshots error:', error); return []; }
  return data || [];
}

export async function getSessionEvents(sessionId: string) {
  const { data, error } = await supabase.from('session_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp_ms', { ascending: true });
  if (error) { console.error('[Session] Events error:', error); return []; }
  return data || [];
}

// Realtime subscription for genome updates
export function subscribeToGenomeUpdates(sessionId: string, onUpdate: (snapshot: any) => void) {
  const channel = supabase.channel(`genome-${sessionId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'genome_snapshots',
      filter: `session_id=eq.${sessionId}`,
    }, (payload) => {
      onUpdate(payload.new);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
