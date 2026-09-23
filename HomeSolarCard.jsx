import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Battery, Wallet, Zap } from 'lucide-react';
import { Card } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { useCustomerData } from '@/lib/customerDataContext';
import { base44 } from '@/api/base44Client';

export default function HomeSolarCard() {
  const { customer } = useCustomerData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const solarPortal = customer?.solar_portal || 'sunways';
  const solarEmail = customer?.solar_email || customer?.sunways_email;
  const solarPassword = customer?.solar_password || customer?.sunways_password;
  const solarStationId = customer?.solar_station_id || customer?.sunways_station_id;
  const hasCredentials = solarEmail && solarPassword;

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
        });
        if (active && res.data && !res.data.error) setData(res.data);
      } catch {
        /* silent — card stays in empty state */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [hasCredentials, solarPortal, solarEmail, solarPassword, solarStationId]);

  const fmt = (v, u) => (v != null ? `${Number(v).toFixed(2)}${u ? ' ' + u : ''}` : '—');

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-solar" />
        <h3 className="font-display font-semibold">Solar Performance</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/60 p-3">
          <Sun className="w-4 h-4 mx-auto text-solar mb-1" />
          <p className="text-lg font-bold">{data ? fmt(data.daily_generation, data.daily_generation_unit) : '—'}</p>
          <p className="text-[11px] text-muted-foreground">Today's Solar</p>
        </div>
        <div className="rounded-xl bg-muted/60 p-3">
          <Battery className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-lg font-bold">{data ? fmt(data.load_power, data.load_power_unit) : '—'}</p>
          <p className="text-[11px] text-muted-foreground">Battery</p>
        </div>
        <div className="rounded-xl bg-muted/60 p-3">
          <Wallet className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-lg font-bold">{data ? fmt(data.total_generation, data.total_generation_unit) : '—'}</p>
          <p className="text-[11px] text-muted-foreground">Savings</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {hasCredentials
          ? loading && !data
            ? 'Loading live performance…'
            : `Live data from your ${solarPortal === 'dyeness' ? 'Dyness' : solarPortal.charAt(0).toUpperCase() + solarPortal.slice(1)} monitoring system.`
          : 'Connect your solar monitoring system to view live performance.'}
      </p>
      <Link to="/my-solar"><Button variant="outline" className="w-full mt-3 rounded-xl">View Solar System</Button></Link>
    </Card>
  );
}