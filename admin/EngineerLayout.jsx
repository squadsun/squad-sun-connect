import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  ClipboardList, Wrench, Settings2, Sparkles, FileText,
  CalendarDays, CalendarClock, LogOut, Eye, Home as HomeIcon, Menu,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/AuthContext';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import MoreNavSheet from '@/components/MoreNavSheet';
import PortalBackground from '@/components/PortalBackground';
import AdminNotificationsBell from '@/components/admin/AdminNotificationsBell';
import AppNotificationBanner from '@/components/AppNotificationBanner';

export const nav = [
  { to: '/engineer', label: 'Overview', icon: HomeIcon, end: true },
  { to: '/engineer/projects', label: 'Projects', icon: ClipboardList },
  { to: '/engineer/tickets', label: 'Tickets', icon: Wrench },
  { to: '/engineer/maintenance', label: 'Maintenance', icon: Settings2 },
  { to: '/engineer/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/engineer/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/engineer/cleaning', label: 'Cleaning', icon: Sparkles },
  { to: '/engineer/service-reports', label: 'Service Reports', icon: FileText },
];

const mobileNav = [
  { to: '/engineer', label: 'Overview', icon: HomeIcon, end: true },
  { to: '/engineer/projects', label: 'Projects', icon: ClipboardList },
  { to: '/engineer/tickets', label: 'Tickets', icon: Wrench },
  { to: '/engineer/calendar', label: 'Calendar', icon: CalendarDays },
];

export default function EngineerLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isActive = (item) => (item.end ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <div className="min-h-[100dvh] relative">
      <PortalBackground />
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-md text-foreground safe-top border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:grid place-items-center w-8 h-8 rounded-lg hover:bg-muted">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <Logo size={36} className="rounded-xl bg-white p-1 shadow-md shadow-black/10" />
            <div className="leading-none">
              <div className="font-display font-extrabold tracking-tight text-[15px]">S-QUAD SUN</div>
              <div className="text-[10px] text-muted-foreground">Engineer Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminNotificationsBell />
            <span className="hidden sm:block text-xs text-muted-foreground">{user?.full_name || user?.email || 'Engineer'}</span>
            <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"><Eye className="w-4 h-4" /> <span className="hidden lg:inline">Portal</span></Link>
            <button onClick={() => logout()} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"><LogOut className="w-4 h-4" /> <span className="hidden lg:inline">Logout</span></button>
          </div>
        </div>
      </header>
      <aside className={`hidden md:block fixed left-0 top-14 bottom-0 z-30 ${sidebarOpen ? 'w-56' : 'w-0'} shrink-0 border-r border-border/30 bg-background/80 backdrop-blur-md overflow-hidden transition-all duration-200`}>
        <nav className="space-y-0.5 overflow-y-auto h-full p-3">
          {nav.map((item) => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${isActive(item) ? 'bg-solar text-ink' : 'text-muted-foreground hover:bg-muted'}`}>
              <item.icon className="w-4 h-4 shrink-0" /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={`${sidebarOpen ? 'md:ml-56' : 'md:ml-0'} transition-all duration-200`}>
        <div className="p-4 md:p-6 max-w-5xl mx-auto w-full pb-28 md:pb-6 min-h-[calc(100dvh-3.5rem)]">
          <AnimatedOutlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border/30 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNav.map((item) => (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold ${isActive(item) ? 'text-solar' : 'text-muted-foreground'}`}>
              <item.icon className="w-5 h-5" />
              <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
          <button onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground">
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <MoreNavSheet open={moreOpen} onOpenChange={setMoreOpen} groups={[{ label: 'Engineer Pages', items: nav }]} />
      <AppNotificationBanner />
    </div>
  );
}