import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ROLES = ['admin', 'teacher', 'student'];

const Permissions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions-list'],
    queryFn: async () => {
      const { data } = await supabase.from('permissions').select('*').order('key');
      return data ?? [];
    },
  });

  const { data: rolePerms = [] } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data } = await supabase.from('role_permissions').select('*');
      return data ?? [];
    },
  });

  const isAllowed = (role: string, key: string) => {
    const rp = rolePerms.find((r: any) => r.role === role && r.permission_key === key);
    return rp ? (rp as any).allowed : false;
  };

  const togglePermission = async (role: string, key: string) => {
    const current = isAllowed(role, key);
    const existing = rolePerms.find((r: any) => r.role === role && r.permission_key === key);
    if (existing) {
      await supabase.from('role_permissions').update({ allowed: !current }).eq('id', (existing as any).id);
    } else {
      await supabase.from('role_permissions').insert({ role, permission_key: key, allowed: true });
    }
    if (user) {
      await supabase.from('audit_logs').insert({
        actor_user_id: user.id, action: 'permission.changed',
        target_type: 'role_permission', target_id: `${role}:${key}`,
        before_json: { allowed: current }, after_json: { allowed: !current },
      });
    }
    toast.success('Permission updated');
    queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
  };

  return (
    <div className="container px-4 py-8 max-w-5xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">🛡️ Permissions Matrix</h1>

      <div className="card-premium overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-heading font-semibold text-foreground">Permission</th>
              {ROLES.map(r => (
                <th key={r} className="text-center px-4 py-3 font-heading font-semibold text-foreground capitalize">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((p: any) => (
              <tr key={p.key} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="font-heading font-medium text-foreground">{p.key.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] text-muted-foreground">{p.description}</div>
                </td>
                {ROLES.map(r => (
                  <td key={r} className="text-center px-4 py-3">
                    <button onClick={() => togglePermission(r, p.key)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                        isAllowed(r, p.key) ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'
                      }`}>
                      {isAllowed(r, p.key) ? '✅' : '❌'}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Permissions;
