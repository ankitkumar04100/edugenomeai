import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Policies: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState('');

  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs'], queryFn: async () => { const { data } = await supabase.from('orgs').select('id, name'); return data ?? []; }
  });

  const { data: settings } = useQuery({
    queryKey: ['org-settings', selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) return null;
      const { data } = await supabase.from('org_settings').select('*').eq('org_id', selectedOrg).maybeSingle();
      return data;
    },
    enabled: !!selectedOrg,
  });

  const updateSetting = async (field: string, value: any) => {
    if (!settings || !user) return;
    const before = { [field]: (settings as any)[field] };
    await supabase.from('org_settings').update({ [field]: value } as any).eq('id', settings.id);
    await supabase.from('audit_logs').insert({
      actor_user_id: user.id, org_id: selectedOrg, action: 'org_settings.changed',
      target_type: 'org_settings', target_id: settings.id,
      before_json: before, after_json: { [field]: value },
    });
    toast.success('Setting updated');
    queryClient.invalidateQueries({ queryKey: ['org-settings', selectedOrg] });
  };

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-secondary'}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="container px-4 py-8 max-w-3xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">📜 Policies & Privacy</h1>

      <div className="mb-6">
        <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">Select Organization...</option>
          {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {settings && (
        <div className="space-y-4">
          <div className="card-premium p-5 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Feature Toggles</h3>
            {[
              { label: '🎥 Live Mode', field: 'allow_live_mode', value: settings.allow_live_mode },
              { label: '🔊 Voice Features', field: 'allow_voice', value: settings.allow_voice },
              { label: '🔥 Heatmap Tracking', field: 'allow_heatmap', value: settings.allow_heatmap },
              { label: '📝 Store Transcripts', field: 'transcript_storage_default', value: settings.transcript_storage_default },
            ].map(item => (
              <label key={item.field} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                <Toggle value={item.value} onChange={v => updateSetting(item.field, v)} />
              </label>
            ))}
          </div>

          <div className="card-premium p-5 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Data Retention</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Retention Window</span>
              <div className="flex gap-1 bg-secondary rounded-xl p-0.5">
                {[30, 90, 180, 365].map(d => (
                  <button key={d} onClick={() => updateSetting('retention_days', d)}
                    className={`px-3 py-1 rounded-lg text-xs font-heading font-medium transition-all ${settings.retention_days === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-premium p-5">
            <h3 className="font-heading font-semibold text-foreground mb-2">Privacy Notice</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• All webcam processing is local — no video stored or transmitted</p>
              <p>• Only derived behavioral metrics (numbers) are used for analysis</p>
              <p>• Heatmaps store only 12×12 bucket counts, no raw coordinates</p>
              <p>• Voice transcripts are optional and off by default</p>
              <p>• GDPR-compliant with full consent management</p>
            </div>
          </div>
        </div>
      )}

      {!selectedOrg && <div className="text-center py-12 text-sm text-muted-foreground">Select an organization to manage policies</div>}
    </div>
  );
};

export default Policies;
