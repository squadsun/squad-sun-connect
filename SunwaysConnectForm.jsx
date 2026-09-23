import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Link2, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

const PORTAL_LABELS = { sunways: 'Sunways', deye: 'Deye' };
const PORTAL_URLS = {
  sunways: 'https://www.sunways-portal.com',
  deye: 'https://www.deyecloud.com',
};

export default function SunwaysConnectForm({ customer, project, portal, onConnected }) {
  const brand = PORTAL_LABELS[portal] || 'Sunways';
  const portalUrl = PORTAL_URLS[portal] || '#';
  const [email, setEmail] = useState(project?.solar_email || customer?.solar_email || customer?.sunways_email || customer?.email || '');
  const [password, setPassword] = useState(project?.solar_password || customer?.solar_password || customer?.sunways_password || '');
  const [stationId, setStationId] = useState(project?.solar_station_id || customer?.solar_station_id || customer?.sunways_station_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('solarMonitoring', {
        portal: portal || 'sunways',
        email: email || undefined, password: password || undefined, stationId: stationId || undefined,
        project_id: project?.id,
      });
      const data = res.data;
      if (data.error) { setError(data.error); return; }
      if (project) {
        await base44.entities.Project.update(project.id, {
          portal: portal || 'sunways',
          solar_email: email || '',
          solar_password: password || '',
          solar_station_id: data.station_id || stationId || '',
        });
      } else {
        const update = { solar_email: email || '', solar_password: password || '', solar_portal: portal || 'sunways' };
        if (data.station_id) update.solar_station_id = data.station_id;
        await base44.entities.Customer.update(customer.id, update);
      }
      onConnected(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || `Failed to connect to ${brand}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-5 h-5 text-solar" />
        <h3 className="font-display font-bold text-sm">Connect Your {brand} Account</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Enter your {brand} Portal credentials to view live solar performance data.
      </p>
      <div className="space-y-3">
        <>
          <div>
            <Label className="text-xs font-semibold">{brand} Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 rounded-xl" placeholder="your@email.com" />
          </div>
          <div>
            <Label className="text-xs font-semibold">{brand} Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 rounded-xl" placeholder="••••••••" />
          </div>
        </>
        <div>
          <Label className="text-xs font-semibold">Station ID <span className="text-muted-foreground/60">(optional)</span></Label>
          <Input value={stationId} onChange={(e) => setStationId(e.target.value)} className="mt-1 h-11 rounded-xl" placeholder="Auto-detected if left blank" />
        </div>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <Button onClick={connect} disabled={loading || !email || !password} className="w-full h-11 rounded-xl bg-solar text-ink hover:bg-solar/90">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…</> : 'Connect & Sync'}
        </Button>
        {portalUrl !== '#' && (
          <a href={portalUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-solar">
            <ExternalLink className="w-3 h-3" /> Open {brand} Portal
          </a>
        )}
      </div>
    </Card>
  );
}