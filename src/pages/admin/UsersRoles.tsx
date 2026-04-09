import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const UsersRoles: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data ?? [];
    },
  });

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r ? (r as any).role : 'student';
  };

  const changeRole = async (userId: string, newRole: string) => {
    const oldRole = getRoleForUser(userId);
    const { error } = await supabase.from('user_roles').update({ role: newRole as any }).eq('user_id', userId);
    if (error) { toast.error(error.message); return; }
    // Audit
    if (user) {
      await supabase.from('audit_logs').insert({
        actor_user_id: user.id, action: 'role.changed',
        target_type: 'user', target_id: userId,
        before_json: { role: oldRole }, after_json: { role: newRole },
      });
    }
    toast.success('Role updated');
    queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
  };

  return (
    <div className="container px-4 py-8 max-w-4xl">
      <Link to="/admin" className="text-xs text-primary hover:underline font-heading">← Admin Console</Link>
      <h1 className="font-heading text-2xl font-bold text-foreground mt-1 mb-6">👥 Users & Roles</h1>

      <div className="card-premium overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-heading font-semibold text-foreground text-xs">User</th>
              <th className="text-left px-4 py-3 font-heading font-semibold text-foreground text-xs">Role</th>
              <th className="text-left px-4 py-3 font-heading font-semibold text-foreground text-xs">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p: any) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="font-heading font-medium text-foreground text-xs">{p.display_name || 'Unknown'}</div>
                  <div className="text-[10px] text-muted-foreground">{p.id.slice(0, 12)}...</div>
                </td>
                <td className="px-4 py-3">
                  <select value={getRoleForUser(p.id)} onChange={e => changeRole(p.id, e.target.value)}
                    className="bg-white border border-border rounded-lg px-2 py-1 text-xs font-heading focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No users found</div>}
      </div>
    </div>
  );
};

export default UsersRoles;
