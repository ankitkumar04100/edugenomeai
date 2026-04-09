import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const AuditLogs: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: async () => {
      let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (actionFilter) q = q.eq('action', actionFilter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const actions = [...new Set(logs.map((l: any) => l.action))];
  const filtered = search ? logs.filter((l: any) =>
    l.target_id?.includes(search) || l.action.includes(search) || l.actor_user_id?.includes(search)
  ) : logs;

  return (
    <div className="container px-4 py-8 max-w-5xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">📋 Audit Logs</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by target ID or action..."
          className="flex-1 min-w-[200px] bg-white border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((log: any) => (
          <div key={log.id} className="card-premium p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-heading font-semibold">{log.action}</span>
                  {log.target_type && <span className="text-[10px] text-muted-foreground">{log.target_type}</span>}
                </div>
                <div className="text-xs text-muted-foreground">Actor: {log.actor_user_id?.slice(0, 12)}...</div>
                {log.target_id && <div className="text-xs text-muted-foreground">Target: {log.target_id.slice(0, 20)}</div>}
              </div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
            {(log.before_json || log.after_json) && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                {log.before_json && (
                  <div className="bg-red-50 rounded-lg p-2">
                    <div className="font-heading font-semibold text-red-700 mb-1">Before</div>
                    <pre className="text-red-600 whitespace-pre-wrap">{JSON.stringify(log.before_json, null, 1)}</pre>
                  </div>
                )}
                {log.after_json && (
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="font-heading font-semibold text-green-700 mb-1">After</div>
                    <pre className="text-green-600 whitespace-pre-wrap">{JSON.stringify(log.after_json, null, 1)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No audit logs found</div>}
      </div>
    </div>
  );
};

export default AuditLogs;
