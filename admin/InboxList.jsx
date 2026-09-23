import { useEffect, useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input-label-fix';
import { Spinner, Empty } from '@/components/customer/ui';
import { formatShortDate } from '@/lib/format';

export default function InboxList({ activeTicketId, basePath = '/admin/inbox' }) {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    const [tickets, customers, messages] = await Promise.all([
      base44.entities.SupportTicket.list('-created_date', 300),
      base44.entities.Customer.list('-created_date', 300),
      base44.entities.SupportMessage.list('-created_date', 500),
    ]);
    const cmap = {};
    (customers || []).forEach((c) => { cmap[c.id] = c; });
    const latestByTicket = {};
    const msgs = messages || [];
    msgs.forEach((m) => {
      const tid = m.ticket_id;
      if (!tid) return;
      if (!latestByTicket[tid] || new Date(m.created_date) > new Date(latestByTicket[tid].created_date)) {
        latestByTicket[tid] = m;
      }
    });
    setItems((tickets || []).map((t) => ({
      ...t,
      _customer: cmap[t.customer_id],
      _last: latestByTicket[t.id] || null,
      _unread: msgs.filter((m) => m.ticket_id === t.id && m.sender === 'customer' && !m.read).length,
    })));
  };

  useEffect(() => {
    load().catch(() => setItems([]));
    const unsubMsg = base44.entities.SupportMessage.subscribe(() => load());
    const unsubTicket = base44.entities.SupportTicket.subscribe(() => load());
    return () => { unsubMsg?.(); unsubTicket?.(); };
  }, []);

  if (!items) return <div className="flex-1 flex items-center justify-center"><Spinner label="Loading chats…" /></div>;

  const filtered = items.filter((t) =>
    `${t.subject || ''} ${t.ticket_number || ''} ${t._customer?.full_name || ''}`.toLowerCase().includes(q.toLowerCase())
  );
  const totalUnread = items.filter((t) => t._unread > 0).length;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-4 pb-1 flex items-center justify-between">
        <h2 className="font-display font-extrabold text-xl tracking-tight">Chats</h2>
        {totalUnread > 0 && <span className="text-xs font-semibold text-red-500">{totalUnread} unread</span>}
      </div>
      <div className="shrink-0 px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Messenger" className="pl-9 h-10 rounded-xl bg-muted/50 border-0" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <Empty icon={MessageSquare} title="No messages" description="Customer support messages will appear here in real time." />
        ) : (
          <div className="space-y-0.5">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(basePath + '/' + t.id)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition ring-1 ${activeTicketId === t.id ? 'bg-white ring-solar shadow-md' : t._unread > 0 ? 'bg-red-50 dark:bg-red-950/30 ring-red-200 dark:ring-red-900' : 'ring-transparent hover:bg-muted'}`}
              >
                <div className="w-10 h-10 rounded-full bg-solar/15 grid place-items-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-solar" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{t._customer?.full_name || 'Customer'}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{t._last ? formatShortDate(t._last.created_date) : formatShortDate(t.created_date)}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground truncate">{t.subject}</p>
                  {t._last ? (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{t._last.sender === 'customer' ? '' : 'You: '}{t._last.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-0.5">No messages yet</p>
                  )}
                </div>
                {t._unread > 0 && <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">{t._unread}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}