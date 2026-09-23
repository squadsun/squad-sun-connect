import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function AdminNotificationsBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const ref = useRef(null);

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      const list = await base44.entities.AppNotification.filter({ read: false, user_id: user.id }, '-created_date', 50);
      setNotifications(list || []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
    const unsub = base44.entities.AppNotification.subscribe(() => loadNotifications());
    return () => unsub?.();
  }, [user?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (!notifications.length) return;
    const targets = notifications;
    setNotifications([]);
    try {
      await base44.entities.AppNotification.bulkUpdate(targets.map((n) => ({ id: n.id, read: true })));
    } catch {
      setNotifications(targets);
    }
  };

  const handleClick = async (n) => {
    setSelectedId(n.id);
    setNotifications((prev) => (prev || []).filter((x) => x.id !== n.id));
    try {
      await base44.entities.AppNotification.update(n.id, { read: true });
    } catch (e) {}
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative w-8 h-8 grid place-items-center rounded-lg hover:bg-muted">
        <Bell className="w-4 h-4 text-foreground" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-solar text-ink text-[10px] font-bold grid place-items-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-display font-bold text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-solar font-semibold hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No new notifications</p>
            ) : notifications.map((n) => (
              <button key={n.id} onClick={() => handleClick(n)} className={`w-full text-left px-4 py-3 border-b border-border last:border-0 block transition-colors ${selectedId === n.id ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-100' : 'hover:bg-muted/50'}`}>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-solar mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(n.created_date).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}