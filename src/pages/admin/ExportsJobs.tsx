import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const ExportsJobs: React.FC = () => {
  const { data: jobs = [] } = useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(50);
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const { data: exports = [] } = useQuery({
    queryKey: ['all-exports'],
    queryFn: async () => {
      const { data } = await supabase.from('exports').select('*').order('created_at', { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="container px-4 py-8 max-w-5xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">📦 Exports & Jobs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-3">Job Queue</h2>
          <div className="space-y-2">
            {jobs.map((j: any) => (
              <div key={j.id} className="card-premium p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-heading font-semibold text-foreground">{j.type}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-heading font-semibold ${
                    j.status === 'completed' ? 'bg-green-100 text-green-700' :
                    j.status === 'failed' ? 'bg-red-100 text-red-700' :
                    j.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>{j.status}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Retry {j.retry_count}/{j.max_retries} • {new Date(j.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {jobs.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No jobs in queue</div>}
          </div>
        </div>

        <div>
          <h2 className="font-heading font-semibold text-foreground mb-3">Recent Exports</h2>
          <div className="space-y-2">
            {exports.map((e: any) => (
              <div key={e.id} className="card-premium p-4">
                <div className="text-xs font-heading font-semibold text-foreground">Session {e.session_id.slice(0, 8)}...</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {e.file_path ? '✅ Complete' : '⏳ Processing'} • {new Date(e.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {exports.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No exports yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportsJobs;
