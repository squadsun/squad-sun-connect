import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, CalendarDays, Inbox, Menu } from 'lucide-react';
import MoreNavSheet from '@/components/MoreNavSheet';
import { navGroups } from '@/components/admin/AdminLayout';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/projects', label: 'Projects', icon: ClipboardList },
  { to: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
];

export const ADMIN_NAV_HEIGHT = '3.5rem';
export const ADMIN_NAV_BOTTOM = `calc(${ADMIN_NAV_HEIGHT} + max(env(safe-area-inset-bottom) - 1.5rem, 0px))`;

export default function AdminBottomNav() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (item) => (item.end ? pathname === item.to : pathname.startsWith(item.to));
  const unread = useUnreadMessages('staff');

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="grid grid-cols-6">
          {items.map(({ to, label, icon: Icon, end }) => {
            const active = isActive({ to, end });
            return (
              <Link key={to} to={to}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 transition ${active ? 'text-solar' : 'text-muted-foreground'}`}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
                {to === '/admin/inbox' && unread > 0 && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 translate-x-3 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center border border-background">{unread > 9 ? '9+' : unread}</span>
                )}
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground">
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </nav>
      <MoreNavSheet open={moreOpen} onOpenChange={setMoreOpen} groups={navGroups} />
    </>
  );
}