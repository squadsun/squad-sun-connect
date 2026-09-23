import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare, ShieldCheck, LogOut, Eye,
  CalendarDays, CalendarCheck, Ticket, UserPlus, Inbox as InboxIcon, Wrench, Settings2, Sparkles,
  FileText, FileSignature, Receipt, UserCog, History, PanelLeftClose, PanelLeft,
  PhoneCall, ClipboardCheck,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/AuthContext';
import AdminBottomNav from '@/components/admin/AdminBottomNav';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import ChatNotificationBanner from '@/components/ChatNotificationBanner';
import AppNotificationBanner from '@/components/AppNotificationBanner';
import AdminNotificationsBell from '@/components/admin/AdminNotificationsBell';
import PortalBackground from '@/components/PortalBackground';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export const navGroups = [
  { label: 'Overview', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ]},
  { label: 'Customers & Projects', items: [
    { to: '/admin/enroll', label: 'Enroll Customer', icon: UserPlus },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/projects', label: 'Projects', icon: ClipboardList },
    { to: '/admin/schedule', label: 'Installations', icon: CalendarDays },
    { to: '/admin/calendar', label: 'Calendar', icon: CalendarCheck },
  ]},
  { label: 'Operations', items: [
    { to: '/admin/technical-tickets', label: 'Technical Tickets', icon: Wrench },
    { to: '/admin/maintenance', label: 'Maintenance', icon: Settings2 },
    { to: '/admin/cleaning', label: 'Cleaning', icon: Sparkles },
    { to: '/admin/pending-edits', label: 'Pending Edits', icon: ClipboardCheck },
  ]},
  { label: 'Customer Service', items: [
    { to: '/admin/inbox', label: 'Inbox', icon: InboxIcon },
    { to: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare },
    { to: '/admin/warranties', label: 'Warranties', icon: ShieldCheck },
    { to: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
  ]},
  { label: 'Finance & Docs', items: [
    { to: '/admin/documents', label: 'Documents', icon: FileText },
    { to: '/admin/contracts', label: 'Contracts', icon: FileSignature },
    { to: '/admin/billing', label: 'Billing', icon: Receipt },
  ]},
  { label: 'Administration', items: [
    { to: '/admin/users', label: 'Users', icon: UserCog },
    { to: '/admin/call-logs', label: 'Call Logs', icon: PhoneCall },
    { to: '/admin/audit-log', label: 'Audit Log', icon: History },
  ]},
];

export default function AdminLayout() {
  return <AdminLayoutInner />;
}

function AdminLayoutInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isActive = (item) => (item.end ? pathname === item.to : pathname.startsWith(item.to));
  const isInbox = pathname.startsWith('/admin/inbox');
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
              <div className="text-[10px] text-muted-foreground">Internal Portal · {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminNotificationsBell />
            <button onClick={() => navigate('/admin/enroll-staff')} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-solar text-ink dark:bg-yellow-400 dark:text-black text-xs font-bold hover:bg-solar/90 dark:hover:bg-yellow-500 transition">
              <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Enroll Staff</span>
            </button>
            <span className="hidden sm:block text-xs text-muted-foreground">{user?.full_name || user?.email || 'Admin'}</span>
            <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"><Eye className="w-4 h-4" /> <span className="hidden lg:inline">Customer Portal</span></Link>
            <button onClick={() => logout()} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"><LogOut className="w-4 h-4" /> <span className="hidden lg:inline">Logout</span></button>
          </div>
        </div>
      </header>
      <aside className={`hidden md:block fixed left-0 top-14 bottom-0 z-30 ${sidebarOpen ? 'w-60' : 'w-0'} shrink-0 border-r border-border/30 bg-background/80 backdrop-blur-md overflow-hidden transition-all duration-200`}>
        <nav className="p-3 space-y-4 overflow-y-auto h-full">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link key={item.to} to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${isActive(item) ? 'bg-solar text-ink' : 'text-muted-foreground hover:bg-muted'}`}>
                    <item.icon className="w-4 h-4 shrink-0" /> {item.label}
                    {item.to === '/admin/inbox' && unread > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">{unread > 9 ? '9+' : unread}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className={`${sidebarOpen ? 'md:ml-60' : 'md:ml-0'} flex-1 min-h-0 transition-all duration-200 ${isInbox ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'}`}>
        <div className={isInbox
          ? 'h-[calc(100%-3.5rem-env(safe-area-inset-bottom))] md:h-full'
          : 'p-4 md:p-6 max-w-6xl mx-auto w-full pb-28 md:pb-6 min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top))]'}>
          {isInbox ? <Outlet /> : <AnimatedOutlet />}
        </div>
      </main>

      <AdminBottomNav />
      <ChatNotificationBanner side="staff" inboxBase="/admin/inbox" />
      <AppNotificationBanner />
    </div>
  );
}