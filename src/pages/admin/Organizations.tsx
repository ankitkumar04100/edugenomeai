import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Plus, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Organizations: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const { data } = await supabase.from('orgs').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['org-members', selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) return [];
      const { data } = await supabase.from('org_members').select('*').eq('org_id', selectedOrg);
      return data ?? [];
    },
    enabled: !!selectedOrg,
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

  const createOrg = async () => {
    if (!name.trim() || !user) return;
    const { data: org, error } = await supabase.from('orgs').insert({ name: name.trim(), created_by: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    // Add creator as org admin
    await supabase.from('org_members').insert({ org_id: org.id, user_id: user.id, role_in_org: 'admin' });
    // Create default settings
    await supabase.from('org_settings').insert({ org_id: org.id });
    // Audit log
    await supabase.from('audit_logs').insert({ actor_user_id: user.id, org_id: org.id, action: 'org.created', target_type: 'org', target_id: org.id, after_json: { name: org.name } });
    toast.success('Organization created');
    setName(''); setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ['orgs'] });
  };

  return (
    <div className="container px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-1">🏢 Organizations</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold">
          <Plus className="w-3.5 h-3.5" /> New Org
        </button>
      </div>

      {showCreate && (
        <div className="card-premium p-4 mb-4 flex gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Organization name"
            className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={createOrg} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold">Create</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map((org: any) => (
          <div key={org.id} onClick={() => setSelectedOrg(selectedOrg === org.id ? null : org.id)}
            className={`card-premium p-4 cursor-pointer transition-all ${selectedOrg === org.id ? 'ring-2 ring-primary' : 'hover-lift'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{org.name}</h3>
                <p className="text-[10px] text-muted-foreground">Created {new Date(org.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
        {orgs.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">No organizations yet. Create one to get started.</div>
        )}
      </div>

      {selectedOrg && (
        <div className="mt-6 space-y-4">
          <div className="card-premium p-4">
            <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Members</h3>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                    <span className="text-xs text-foreground font-heading">{m.user_id.slice(0, 8)}...</span>
                    <span className="text-[10px] capitalize px-2 py-0.5 rounded bg-primary/10 text-primary font-heading font-semibold">{m.role_in_org}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {settings && (
            <div className="card-premium p-4">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Settings className="w-4 h-4" /> Org Settings</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-muted-foreground">Retention</div>
                  <div className="font-heading font-semibold text-foreground">{settings.retention_days} days</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-muted-foreground">Live Mode</div>
                  <div className="font-heading font-semibold text-foreground">{settings.allow_live_mode ? '✅ Enabled' : '❌ Disabled'}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-muted-foreground">Voice</div>
                  <div className="font-heading font-semibold text-foreground">{settings.allow_voice ? '✅ Enabled' : '❌ Disabled'}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-muted-foreground">Heatmap</div>
                  <div className="font-heading font-semibold text-foreground">{settings.allow_heatmap ? '✅ Enabled' : '❌ Disabled'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Organizations;
