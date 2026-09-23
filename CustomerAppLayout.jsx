import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, CalendarDays, Sparkles, Bell, BatteryCharging, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import DraggableChatHead from '@/components/customer/DraggableChatHead';
import PortalBackground from '@/components/PortalBackground';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import ChatNotificationBanner from '@/components/ChatNotificationBanner';
import AppNotificationBanner from '@/components/AppNotificationBanner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';


const TAB_ROOTS = ['/', '/project', '/booking', '/services', '/add-ons'];

const items = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/project', label: 'Project', icon: ClipboardList },
  { to: '/add-ons', label: 'Store', icon: Store, center: true },
  { to: '/booking', label: 'Booking', icon: CalendarDays },
  { to: '/services', label: 'Services', icon: Sparkles },
];

const SUB_ROUTE_TO_TAB = {
  '/support': '/',
  '/vouchers': '/',
  '/warranty': '/',
  '/documents': '/',
  '/my-solar': '/',
  '/notifications': '/',
  '/profile': '/',
};

function getTabForPath(pathname) {
  if (TAB_ROOTS.includes(pathname)) return pathname;
  for (const root of TAB_ROOTS) {
    if (root !== '/' && pathname.startsWith(root + '/')) return root;
  }
  for (const [route, tab] of Object.entries(SUB_ROUTE_TO_TAB)) {
    if (pathname === route || pathname.startsWith(route + '/')) return tab;
  }
  return '/';
}

export default function CustomerAppLayout() {
  return <CustomerAppLayoutInner />;
}

function CustomerAppLayoutInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentTab = getTabForPath(pathname);
  const [unread, setUnread] = useState(0);

  const scrollPositions = useRef({});
  const mainRef = useRef(null);
  const lastPaths = useRef({});
  const [sparkle, setSparkle] = useState(false);

  useEffect(() => {
    const triggerSparkle = () => {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 3500);
    };
    const initialTimer = setTimeout(triggerSparkle, 800);
    const fiveMinTimer = setTimeout(triggerSparkle, 5 * 60 * 1000);
    return () => { clearTimeout(initialTimer); clearTimeout(fiveMinTimer); };
  }, []);

  useEffect(() => {
    lastPaths.current[currentTab] = pathname;
  }, [pathname, currentTab]);

  useEffect(() => {
    if (!user?.id) return;
    const loadUnread = async () => {
      try {
        const list = await base44.entities.AppNotification.filter({ read: false, user_id: user.id }, '-created_date', 50);
        setUnread((list || []).length);
      } catch { setUnread(0); }
    };
    loadUnread();
    const unsub = base44.entities.AppNotification.subscribe(() => loadUnread());
    return () => unsub?.();
  }, [user?.id]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const saved = scrollPositions.current[pathname] ?? 0;
    const t = setTimeout(() => el.scrollTo(0, saved), 50);
    const onScroll = () => { scrollPositions.current[pathname] = el.scrollTop; };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      el.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  const handleTabClick = (to) => {
    if (to === currentTab) {
      navigate(to);
    } else {
      navigate(lastPaths.current[to] || to);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden relative">
      <PortalBackground />
      <div className="mx-auto w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-[100dvh] flex flex-col relative">
        <header className="shrink-0 z-40 bg-background/70 backdrop-blur-md text-foreground safe-top border-b border-border/30">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2.5">
              <Link to="/" className="flex items-center gap-2.5">
                <Logo size={36} className="rounded-xl bg-white p-1 shadow-md shadow-black/10" />
                <div className="leading-none">
                  <div className="font-display font-extrabold tracking-tight text-[15px]">S-QUAD SUN</div>
                  <div className="text-[10px] text-muted-foreground tracking-wide">Start Owning Your Power</div>
                </div>
              </Link>
            </div>
            <Link to="/notifications" className="relative grid place-items-center w-10 h-10 rounded-full hover:bg-muted transition">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-solar text-ink text-[10px] font-bold grid place-items-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main ref={mainRef}
          className={`flex-1 min-h-0 overscroll-y-contain pb-24 ${
          pathname.startsWith('/support/')
          ? 'overflow-hidden'
          : 'overflow-y-auto'
          }`}
        >
          <AnimatedOutlet />
        </main>

        {!pathname.startsWith('/support/') && <DraggableChatHead />}

        {!pathname.startsWith('/support/') && <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur safe-bottom">
          <div className="mx-auto w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl grid grid-cols-5">
            {items.map(({ to, label, icon: Icon, iconOnly }) => {
              const active = currentTab === to;
              const isStore = to === '/add-ons';
              return (
                <button
                  key={to}
                  onClick={() => handleTabClick(to)}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2.5 transition ${active || isStore ? 'text-solar' : 'text-muted-foreground'}`}
                >
                  {isStore && (
                    <motion.span
                      className="absolute inset-0 rounded-2xl bg-solar/15"
                      animate={{ opacity: [0, 0.7, 0], scale: [0.7, 1.05, 0.7] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                  {isStore && (
                    <>
                      <motion.span className="absolute top-1 left-1" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Sparkles className="w-3 h-3 text-solar" fill="currentColor" />
                      </motion.span>
                      <motion.span className="absolute top-0.5 right-1" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>
                        <Sparkles className="w-2.5 h-2.5 text-solar" fill="currentColor" />
                      </motion.span>
                    </>
                  )}
                  <motion.div animate={isStore ? { scale: [1, 1.2, 1] } : {}} transition={isStore ? { duration: 0.8, repeat: Infinity } : {}}>
                    <Icon className="w-5 h-5 relative" strokeWidth={active ? 2.5 : 2} />
                  </motion.div>
                  {!iconOnly && <span className="text-[11px] font-semibold relative">{label}</span>}
                </button>
              );
            })}
          </div>
        </nav>}
        <ChatNotificationBanner side="customer" inboxBase="/support" />
        <AppNotificationBanner />
      </div>
    </div>
  );
}