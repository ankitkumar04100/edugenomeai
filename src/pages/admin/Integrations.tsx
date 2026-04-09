import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Webhook, Key, Plus } from 'lucide-react';

const EVENTS = ['session.completed', 'confusion.spike', 'fatigue.high', 'orchestrator.intervention', 'student.at_risk'];

const Integrations: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showWebhook, setShowWebhook] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [apiKeyName, setApiKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs'], queryFn: async () => { const { data } = await supabase.from('orgs').select('id, name'); return data ?? []; }
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks', selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) return [];
      const { data } = await supabase.from('webhooks').select('*').eq('org_id', selectedOrg);
      return data ?? [];
    },
    enabled: !!selectedOrg,
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys', selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) return [];
      const { data } = await supabase.from('api_keys').select('*').eq('org_id', selectedOrg).order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!selectedOrg,
  });

  const createWebhook = async () => {
    if (!webhookUrl || !selectedOrg || !user) return;
    const secret = crypto.randomUUID();
    const { error } = await supabase.from('webhooks').insert({
      org_id: selectedOrg, url: webhookUrl, secret, events_json: webhookEvents,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ actor_user_id: user.id, org_id: selectedOrg, action: 'webhook.created', target_type: 'webhook', after_json: { url: webhookUrl } });
    toast.success('Webhook created');
    setWebhookUrl(''); setWebhookEvents([]); setShowWebhook(false);
    queryClient.invalidateQueries({ queryKey: ['webhooks', selectedOrg] });
  };

  const createApiKey = async () => {
    if (!apiKeyName || !selectedOrg || !user) return;
    const raw = `edg_${crypto.randomUUID().replace(/-/g, '')}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    const hashed = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const { error } = await supabase.from('api_keys').insert({ org_id: selectedOrg, name: apiKeyName, hashed_key: hashed });
    if (error) { toast.error(error.message); return; }
    await supabase.from('audit_logs').insert({ actor_user_id: user.id, org_id: selectedOrg, action: 'api_key.created', target_type: 'api_key', after_json: { name: apiKeyName } });
    setNewApiKey(raw);
    toast.success('API key created — copy it now, it won\'t be shown again');
    setApiKeyName(''); setShowApiKey(false);
    queryClient.invalidateQueries({ queryKey: ['api-keys', selectedOrg] });
  };

  const revokeApiKey = async (id: string) => {
    await supabase.from('api_keys').update({ revoked: true }).eq('id', id);
    if (user) await supabase.from('audit_logs').insert({ actor_user_id: user.id, org_id: selectedOrg, action: 'api_key.revoked', target_type: 'api_key', target_id: id });
    toast.success('API key revoked');
    queryClient.invalidateQueries({ queryKey: ['api-keys', selectedOrg] });
  };

  return (
    <div className="container px-4 py-8 max-w-4xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">🔌 Integrations</h1>

      <div className="mb-6">
        <label className="text-xs text-muted-foreground font-heading block mb-1">Select Organization</label>
        <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">Choose org...</option>
          {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {selectedOrg && (
        <div className="space-y-6">
          {/* Webhooks */}
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2"><Webhook className="w-4 h-4" /> Webhooks</h3>
              <button onClick={() => setShowWebhook(!showWebhook)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-heading font-semibold">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {showWebhook && (
              <div className="space-y-3 mb-4 p-4 bg-secondary/50 rounded-xl">
                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <div className="flex flex-wrap gap-2">
                  {EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-1.5 text-xs text-foreground">
                      <input type="checkbox" checked={webhookEvents.includes(ev)}
                        onChange={e => setWebhookEvents(e.target.checked ? [...webhookEvents, ev] : webhookEvents.filter(x => x !== ev))} className="accent-primary" />
                      {ev}
                    </label>
                  ))}
                </div>
                <button onClick={createWebhook} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold">Create Webhook</button>
              </div>
            )}
            {webhooks.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg mb-2">
                <div>
                  <div className="text-xs font-heading text-foreground">{w.url}</div>
                  <div className="text-[10px] text-muted-foreground">{(w.events_json as string[])?.join(', ')}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-heading font-semibold ${w.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {w.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>

          {/* API Keys */}
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4" /> API Keys</h3>
              <button onClick={() => setShowApiKey(!showApiKey)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-heading font-semibold">
                <Plus className="w-3 h-3" /> Create
              </button>
            </div>
            {newApiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <div className="text-xs font-heading font-semibold text-amber-800 mb-1">⚠️ Copy this key now — it won't be shown again:</div>
                <code className="text-xs bg-white px-2 py-1 rounded border border-amber-200 block break-all">{newApiKey}</code>
              </div>
            )}
            {showApiKey && (
              <div className="flex gap-3 mb-4">
                <input value={apiKeyName} onChange={e => setApiKeyName(e.target.value)} placeholder="Key name"
                  className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={createApiKey} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold">Generate</button>
              </div>
            )}
            {apiKeys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg mb-2">
                <div>
                  <div className="text-xs font-heading text-foreground">{k.name}</div>
                  <div className="text-[10px] text-muted-foreground">Created {new Date(k.created_at).toLocaleDateString()}</div>
                </div>
                {k.revoked ? (
                  <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded font-heading font-semibold">Revoked</span>
                ) : (
                  <button onClick={() => revokeApiKey(k.id)} className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded font-heading font-semibold hover:bg-destructive/20">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
