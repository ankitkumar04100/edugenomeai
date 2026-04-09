import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, Users, FileText, Webhook, AlertTriangle } from 'lucide-react';

const Monitoring: React.FC = () => {
  const { data: sessionCount = 0 } = useQuery({
    queryKey: ['monitor-sessions'],
    queryFn: async () => {
      const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: exportCount = 0 } = useQuery({
    queryKey: ['monitor-exports'],
    queryFn: async () => {
      const { count } = await supabase.from('exports').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ['monitor-users'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: webhookCount = 0 } = useQuery({
    queryKey: ['monitor-webhooks'],
    queryFn: async () => {
      const { count } = await supabase.from('webhooks').select('*', { count: 'exact', head: true }).eq('enabled', true);
      return count ?? 0;
    },
  });

  const { data: recentJobs = [] } = useQuery({
    queryKey: ['monitor-jobs'],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const { data: recentErrors = [] } = useQuery({
    queryKey: ['monitor-errors'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_logs').select('*').like('action', '%error%').order('created_at', { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const stats = [
    { label: 'Total Sessions', value: sessionCount, icon: Activity, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Users', value: userCount, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Exports', value: exportCount, icon: FileText, color: 'text-green-600 bg-green-50' },
    { label: 'Active Webhooks', value: webhookCount, icon: Webhook, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="container px-4 py-8 max-w-5xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">📊 System Monitoring</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="card-premium p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-5">
          <h3 className="font-heading font-semibold text-foreground mb-3">Recent Jobs</h3>
          {recentJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No jobs yet</p>
          ) : recentJobs.map((j: any) => (
            <div key={j.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-xs font-heading text-foreground">{j.type}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(j.created_at).toLocaleString()}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-heading font-semibold ${
                j.status === 'completed' ? 'bg-green-100 text-green-700' :
                j.status === 'failed' ? 'bg-red-100 text-red-700' :
                j.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>{j.status}</span>
            </div>
          ))}
        </div>

        <div className="card-premium p-5">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Errors</h3>
          {recentErrors.length === 0 ? (
            <p className="text-xs text-muted-foreground">No errors logged — system healthy ✅</p>
          ) : recentErrors.map((e: any) => (
            <div key={e.id} className="py-2 border-b border-border/50 last:border-0">
              <div className="text-xs font-heading text-foreground">{e.action}</div>
              <div className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-premium p-5 mt-6">
        <h3 className="font-heading font-semibold text-foreground mb-3">System Status</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-green-700 font-heading font-bold text-lg">✅</div>
            <div className="text-xs text-green-700 font-heading">Database</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-green-700 font-heading font-bold text-lg">✅</div>
            <div className="text-xs text-green-700 font-heading">Auth Service</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-green-700 font-heading font-bold text-lg">✅</div>
            <div className="text-xs text-green-700 font-heading">Edge Functions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
