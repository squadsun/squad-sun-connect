import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, Badge } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plug, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const PORTAL_LABELS = { sunways: 'Sunways', deye: 'Deye' };

export default function SolarMonitoringSetup({ project }) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [portal, setPortal] = useState('sunways');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stationId, setStationId] = useState('');
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!project?.customer_id) return;
      const list = await base44.entities.Customer.filter({ id: project.customer_id });
      const c = list?.[0];
      if (!c) return;
      setCustomer(c);
      setPortal(c.solar_portal || 'sunways');
      setEmail(c.solar_email || '');
      setPassword(c.solar_password || '');
      setStationId(c.solar_station_id || '');
      setConnected(!!(c.solar_email && c.solar_password));
    })().catch(() => {});
  }, [project?.customer_id]);

  const testAndConnect = async () => {
    setTesting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('solarMonitoring', {
        portal, email, password, stationId: stationId || undefined,
      });
      const data = res.data;
      if (data?.error) { setError(data.error); setConnected(false); return; }
      const update = { solar_portal: portal, solar_email: email, solar_password: password };
      if (data.station_id) update.solar_station_id = data.station_id;
      await base44.entities.Customer.update(customer.id, update);
      if (data.station_id) setStationId(data.station_id);
      setConnected(true);
      toast({ title: `${PORTAL_LABELS[portal]} connected`, description: 'Live solar data is now available to the customer.' });
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Connection failed');
      setConnected(false);
    } finally {
      setTesting(false);
    }
  };

  if (!customer) return null;

  return (
    <Card className="p-4 mb-4 border-solar/50 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="w-4 h-4 text-solar" />
        <h3 className="font-display font-bold text-sm">Solar Monitoring Setup</h3>
        {connected ? (
          <Badge variant="success" className="ml-auto"><CheckCircle2 className="w-3 h-3" /> Connected</Badge>
        ) : (
          <Badge variant="warning" className="ml-auto">Pending</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Project reached Testing & Commissioning. Nominate the inverter brand and enter the monitoring portal credentials to enable live solar performance for this customer.
      </p>
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold">Inverter Brand</Label>
          <Select value={portal} onValueChange={setPortal}>
            <SelectTrigger className="mt-1 w-full h-10 rounded-lg text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PORTAL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label className="text-xs font-semibold">{PORTAL_LABELS[portal]} Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10 rounded-lg text-sm" placeholder="Monitoring login" />
          </div>
          <div>
            <Label className="text-xs font-semibold">{PORTAL_LABELS[portal]} Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-10 rounded-lg text-sm" placeholder="••••••••" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Station ID <span className="text-muted-foreground/60">(optional)</span></Label>
            <Input value={stationId} onChange={(e) => setStationId(e.target.value)} className="mt-1 h-10 rounded-lg text-sm" placeholder="Auto-detected if blank" />
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <Button onClick={testAndConnect} disabled={testing || !email || !password} className="w-full h-10 rounded-xl bg-solar text-ink hover:bg-solar/90">
          {testing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing connection…</> : <><Zap className="w-4 h-4 mr-2" /> Test & Connect</>}
        </Button>
      </div>
    </Card>
  );
}