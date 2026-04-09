import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('notifications')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20);
      return (data ?? []) as Notification[];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('notifs-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => { queryClient.invalidateQueries({ queryKey: ['notifications', user.id] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-lg hover:bg-secondary transition-colors">
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-heading font-semibold text-sm text-foreground">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-heading">Mark all read</button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground text-center">No notifications</div>
              ) : notifications.map(n => (
                <div key={n.id} onClick={() => { markRead(n.id); setOpen(false); }}
                  className={`px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-heading font-semibold text-foreground truncate">{n.title}</div>
                      {n.body && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <Link to="/notifications" onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary font-heading py-2 border-t border-border hover:bg-secondary/50 transition-colors">
              View All
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
