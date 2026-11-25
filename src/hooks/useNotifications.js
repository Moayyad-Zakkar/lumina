// src/hooks/useNotifications.js
// Inbox for the signed-in user: the list, the unread count, live updates (Realtime),
// and mark-as-read. Only notifications that have a title are shown; the old badge-only
// case rows (no title) keep counting in the Cases badge but never appear here.
import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from '../helper/supabaseClient';

export function useNotifications({ limit = 50 } = {}) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const instance = useRef(Math.random().toString(36).slice(2)); // unique channel per component

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setUserId(data.session?.user?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    const [list, count] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, title, body, status, created_at, case_id, data')
        .eq('recipient_id', userId)
        .not('title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('status', 'unread')
        .not('title', 'is', null),
    ]);
    if (!list.error) setItems(list.data);
    if (!count.error) setUnread(count.count || 0);
    setLoading(false);
  }, [userId, limit]);

  useEffect(() => {
    if (!userId) return undefined;
    load();

    const channel = supabase
      .channel(`notifications-${userId}-${instance.current}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => load(),
      )
      .subscribe();

    // The socket can sleep while the app is in the background: refresh when it comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const markRead = useCallback(
    async (id) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)));
      await supabase.from('notifications').update({ status: 'read' }).eq('id', id);
      load();
    },
    [load],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => ({ ...n, status: 'read' })));
    setUnread(0);
    await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('recipient_id', userId)
      .eq('status', 'unread')
      .not('title', 'is', null);
    load();
  }, [userId, load]);

  return { userId, items, unread, loading, markRead, markAllRead };
}