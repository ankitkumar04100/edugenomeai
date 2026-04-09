import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ALL_PERMISSIONS = [
  'manage_org', 'manage_users', 'manage_roles', 'view_all_students',
  'view_replays', 'export_student_data', 'manage_content_bank',
  'manage_integrations', 'manage_models', 'view_audit_logs', 'view_monitoring',
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];

export function usePermissions() {
  const { user, role } = useAuth();

  const { data: permissions = {} } = useQuery({
    queryKey: ['permissions', user?.id, role],
    queryFn: async () => {
      if (!user) return {};
      const [{ data: rolePerms }, { data: overrides }] = await Promise.all([
        supabase.from('role_permissions').select('permission_key, allowed').eq('role', role ?? 'student'),
        supabase.from('user_permissions_override').select('permission_key, allowed').eq('user_id', user.id),
      ]);
      const map: Record<string, boolean> = {};
      for (const p of ALL_PERMISSIONS) map[p] = false;
      rolePerms?.forEach(rp => { map[rp.permission_key] = rp.allowed; });
      overrides?.forEach(o => { map[o.permission_key] = o.allowed; });
      return map;
    },
    enabled: !!user,
  });

  const hasPermission = (key: PermissionKey) => permissions[key] === true;
  const isAdmin = role === 'admin';

  return { permissions, hasPermission, isAdmin, ALL_PERMISSIONS };
}
