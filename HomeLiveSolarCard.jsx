import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Clock, ChevronRight, Sun, Hammer, CalendarClock } from 'lucide-react';
import { Card } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { useCustomerData } from '@/lib/customerDataContext';
import { base44 } from '@/api/base44Client';
import { solarFlow } from '@/components/customer/solar/solarFlow';
import HouseScene from '@/components/customer/solar/HouseScene';
import LiveStatusBar from '@/components/customer/solar/LiveStatusBar';
import useSolarWeather from '@/components/customer/solar/useSolarWeather';

const STAGE_MESSAGES = {
  reservation_confirmed: { icon: Sun, title: 'Solar Journey Started', text: 'Your reservation is confirmed. Site survey and system design come next.' },
  site_survey: { icon: Sun, title: 'Site Survey Phase', text: 'Our team is assessing your property for the optimal solar setup.' },
  system_design: { icon: Sun, title: 'Designing Your System', text: 'We are engineering your custom solar solution.' },
  contract_documentation: { icon: Sun, title: 'Finalizing Contracts', text: 'Documentation is underway before equipment preparation.' },
  equipment_preparation: { icon: Hammer, title: 'Preparing Equipment', text: 'Your panels, inverter, and battery are being prepared.' },
  installation_scheduled: { icon: CalendarClock, title: 'Installation Scheduled', text: 'Your installation date has been set. Live monitoring activates after install.' },
  installation_in_progress: { icon: Hammer, title: 'Installation In Progress', text: 'Your solar system is being installed today.' },
  testing_commissioning: { icon: Hammer, title: 'Testing & Commissioning', text: 'We are testing your system before handover.' },
  turnover: { icon: Hammer, title: 'Almost Ready', text: 'Your system is being turned over. Live monitoring will be available soon.' },
  activation: { icon: Sun, title: 'Activating Monitoring', text: 'Your system is being activated. Live data will appear shortly.' },
  delayed: { icon: CalendarClock, title: 'Project Delayed', text: 'Your project is experiencing a delay. Our team will update you soon.' },
  waiting: { icon: CalendarClock, title: 'Waiting for Installation', text: 'Your solar system is not yet installed. Live monitoring will appear here once activated.' },
};

export default function HomeLiveSolarCard() {
  const { customer, projects, project } = useCustomerData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Prefer the first project that has solar credentials, fall back to customer-level
  const activeProject = (projects || []).find(p => p.solar_email && p.solar_password) || project;
  const solarPortal = activeProject?.portal || customer?.solar_portal || 'sunways';
  const solarEmail = activeProject?.solar_email || customer?.solar_email || customer?.sunways_email;
  const solarPassword = activeProject?.solar_password || customer?.solar_password || customer?.sunways_password;
  const solarStationId = activeProject?.solar_station_id || customer?.solar_station_id || customer?.sunways_station_id;
  const hasCredentials = !!(solarEmail && solarPassword);

  useEffect(() => {
    if (!hasCredentials) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('solarMonitoring', {
          portal: solarPortal,
          email: solarEmail,
          password: solarPassword,
          stationId: solarStationId,
          project_id: activeProject?.id,
        });
        if (active && res.data && !res.data.error) {
          setData(res.data);
          setLastUpdated(Date.now());
        }
      } catch {
        /* silent — card falls back to waiting state */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [hasCredentials, solarPortal, solarEmail, solarPassword, solarStationId, activeProject?.id]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Weather query must run unconditionally (rules of hooks). No-ops when no data yet.
  const stationLocation = data ? { lat: data.station_lat, lon: data.station_lon, location: data.station_location } : null;
  const weatherQuery = useSolarWeather(customer?.id, activeProject?.id, stationLocation);

  // --- Waiting for installation state ---
  if (!hasCredentials) {
    const statusKey = activeProject?.status || 'waiting';
    const stage = STAGE_MESSAGES[statusKey] || STAGE_MESSAGES.waiting;
    const StageIcon = stage.icon;
    return (
      <Card className="overflow-hidden mb-4">
        <div className="p-4 border-b border-border bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold font-display">Solar Performance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{activeProject?.system_name || 'My Solar System'}</p>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              Not Connected
            </span>
          </div>
        </div>
        <div className="relative aspect-[3/2] bg-gradient-to-br from-solar/10 via-amber-50 to-sky-50 dark:from-solar/10 dark:to-ink/20 grid place-items-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 grid place-items-center">
            <Sun className="w-32 h-32 text-solar" strokeWidth={1} />
          </div>
          <div className="relative text-center px-6 z-10">
            <div className="w-14 h-14 rounded-2xl bg-solar/20 grid place-items-center mx-auto mb-3">
              <StageIcon className="w-7 h-7 text-solar" />
            </div>
            <h3 className="font-display font-bold text-base">{stage.title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-[16rem] mx-auto leading-relaxed">{stage.text}</p>
          </div>
        </div>
        <div className="p-3 border-t border-border">
          <Link to="/my-solar">
            <Button variant="outline" className="w-full rounded-xl text-sm">
              View My Solar <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // --- Loading state ---
  if (loading && !data) {
    return (
      <Card className="overflow-hidden mb-4">
        <div className="p-4 border-b border-border bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold font-display">Solar Performance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{activeProject?.system_name || 'My Solar System'}</p>
            </div>
            <Loader2 className="w-4 h-4 animate-spin text-solar" />
          </div>
        </div>
        <div className="aspect-[3/2] grid place-items-center bg-muted/30">
          <div className="text-center">
            <Loader2 className="w-7 h-7 animate-spin text-solar mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading live data…</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  // --- Live view ---
  const stale = !!lastUpdated && now - lastUpdated > 120000;
  const flow = solarFlow(data, stale);
  const systemLabel = activeProject?.system_name || data.station_name || `Station #${data.station_id}`;

  return (
    <Card className="overflow-hidden mb-4">
      <div className="p-4 border-b border-border bg-card/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold font-display">Solar Performance</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{systemLabel} · {data.portal_name}</p>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
            {stale ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-muted-foreground' : 'bg-solar animate-pulse'}`} />}
            {stale ? 'Delayed' : data.connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      <LiveStatusBar data={data} stale={stale} lastUpdated={lastUpdated} />

      <HouseScene data={data} flow={flow} weather={weatherQuery.data} now={now} />

      <div className="p-3 border-t border-border">
        <Link to="/my-solar">
          <Button className="w-full rounded-xl text-sm bg-solar text-ink hover:bg-solar/90">
            View Detailed Performance <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}