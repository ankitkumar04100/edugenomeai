import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['all-notifications', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  return (
    <div className="container px-4 py-8 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">🔔 Notifications</h1>
      <div className="space-y-2">
        {notifications.map((n: any) => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={`card-premium p-4 cursor-pointer transition-all ${!n.read ? 'ring-1 ring-primary/30 bg-primary/5' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-heading font-semibold text-foreground">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-1">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
            </div>
          </div>
        ))}
        {notifications.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">No notifications yet</div>}
      </div>
    </div>
  );
};

export default Notifications;
