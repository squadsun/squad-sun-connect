import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Inbox as InboxIcon, CalendarDays,
  CalendarCheck, LogOut, Eye, PanelLeftClose, PanelLeft, Users, UserPlus,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/AuthContext';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import ChatNotificationBanner from '@/components/ChatNotificationBanner';
import AppNotificationBanner from '@/components/AppNotificationBanner';
import AdminNotificationsBell from '@/components/admin/AdminNotificationsBell';
import PortalBackground from '@/components/PortalBackground';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export const csrNav = [
  { to: '/CSR', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/CSR/enroll', label: 'Enroll Customer', icon: UserPlus },
  { to: '/CSR/customers', label: 'Customers', icon: Users },
  { to: '/CSR/projects', label: 'Projects', icon: ClipboardList },
  { to: '/CSR/inbox', label: 'Inbox', icon: InboxIcon },
  { to: '/CSR/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/CSR/calendar', label: 'Calendar', icon: CalendarCheck },
];

const mobileNav = [
  { to: '/CSR', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/CSR/customers', label: 'Customers', icon: Users },
  { to: '/CSR/projects', label: 'Projects', icon: ClipboardList },
  { to: '/CSR/inbox', label: 'Inbox', icon: InboxIcon },
];

export default function CSRLayout() {
  return <CSRLayoutInner />;
}

function CSRLayoutInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isActive = (item) => (item.end ? pathname === item.to : pathname.startsWith(item.to));
  const isInbox = pathname.startsWith('/CSR/inbox');
  const unread = useUnreadMessages('staff');

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col relative">
      <PortalBackground />
      <header className="shrink-0 z-40 bg-background/70 backdrop-blur-md text-foreground safe-top border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:grid place-items-center w-8 h-8 rounded-lg hover:bg-muted">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <Logo size={36} className="rounded-xl bg-white p-1 shadow-md shadow-black/10" />
            <div className="leading-none">
              <div className="font-display font-extrabold tracking-tight text-[15px]">S-QUAD SUN</div>
              <div className="text-[10px] text-muted-foreground">CSR Portal · Customer Service</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminNotificationsBell />
            <button onClick={() => navigate('/CSR/enroll')} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-solar text-ink text-xs font-bold hover:bg-solar/90 transition">
              <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Enroll</span>
            </button>
            <span className="hidden sm:block text-xs text-muted-foreground">{user?.full_name || user?.email || 'CSR'}</span>
            <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"><Eye className="w-4 h-4" /> <span className="hidden lg:inline">Customer Portal</span></Link>
            <button onClick={() => logout()} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"><LogOut className="w-4 h-4" /> <span className="hidden lg:inline">Logout</span></button>
          </div>
        </div>
      </header>
      <aside className={`hidden md:block fixed left-0 top-14 bottom-0 z-30 ${sidebarOpen ? 'w-60' : 'w-0'} shrink-0 border-r border-border/30 bg-background/80 backdrop-blur-md overflow-hidden transition-all duration-200`}>
        <nav className="p-3 space-y-4 overflow-y-auto h-full">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">CSR Console</p>
            <div className="space-y-0.5">
              {csrNav.map((item) => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${isActive(item) ? 'bg-solar text-ink' : 'text-muted-foreground hover:bg-muted'}`}>
                  <item.icon className="w-4 h-4 shrink-0" /> {item.label}
                  {item.to === '/CSR/inbox' && unread > 0 && (
                    <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">{unread > 9 ? '9+' : unread}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>
      <main className={`${sidebarOpen ? 'md:ml-60' : 'md:ml-0'} flex-1 min-h-0 transition-all duration-200 ${isInbox ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'}`}>
        <div className={isInbox
          ? 'h-[calc(100%-3.5rem-env(safe-area-inset-bottom))] md:h-full'
          : 'p-4 md:p-6 max-w-6xl mx-auto w-full pb-28 md:pb-6 min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top))]'}>
          {isInbox ? <Outlet /> : <AnimatedOutlet />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border/30 safe-bottom">
        <div className="grid grid-cols-4">
          {mobileNav.map((item) => (
            <Link key={item.to} to={item.to}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${isActive(item) ? 'text-solar' : 'text-muted-foreground'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
              {item.to === '/CSR/inbox' && unread > 0 && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 translate-x-3 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center border border-background">{unread > 9 ? '9+' : unread}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <ChatNotificationBanner side="staff" inboxBase="/CSR/inbox" />
      <AppNotificationBanner />
    </div>
  );
}