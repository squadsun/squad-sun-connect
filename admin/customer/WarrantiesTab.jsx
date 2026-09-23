import { useState, useEffect } from 'react';
import { ShieldCheck, Ticket, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Badge, Spinner } from '@/components/customer/ui';

const STANDARD = [
  { component: 'Battery', years: 5 },
  { component: 'Solar Panel', years: 15 },
  { component: 'Inverter', years: 5 },
];

function addYears(dateStr, years) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

function computeStatus(start, expiration) {
  if (!start || !expiration) return 'pending';
  const now = new Date();
  const exp = new Date(expiration);
  if (now > exp) return 'expired';
  const days = (exp - now) / 86400000;
  if (days <= 90) return 'expiring_soon';
  return 'active';
}

export default function WarrantiesTab({ customer }) {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [claiming, setClaiming] = useState(null);

  const load = async () => {
    const [list, projects] = await Promise.all([
      base44.entities.WarrantyRecord.filter({ customer_id: customer.id }, '-created_date', 200).catch(() => []),
      base44.entities.Project.filter({ customer_id: customer.id }, '-created_date', 50).catch(() => []),
    ]);
    const proj = (projects || [])[0];
    const start = proj?.installation_date || '';
    let existing = list || [];
    for (const s of STANDARD) {
      const exists = existing.find((w) => (w.component || '').toLowerCase() === s.component.toLowerCase());
      if (!exists) {
        const created = await base44.entities.WarrantyRecord.create({
          customer_id: customer.id,
          user_id: customer.user_id || '',
          project_id: proj?.id || '',
          component: s.component,
          warranty_years: s.years,
          start_date: start || undefined,
          expiration_date: start ? addYears(start, s.years) : undefined,
          coverage: `${s.years} years`,
          status: 'active',
        }).catch(() => null);
        if (created) existing.push(created);
      }
    }
    setItems(existing);
  };

  useEffect(() => { load().catch(() => setItems([])); }, [customer.id]);

  const claimVoucher = async (w) => {
    setClaiming(w.id);
    try {
      await base44.entities.Voucher.create({
        voucher_id: `WARR-${Date.now().toString().slice(-6)}`,
        customer_id: customer.id,
        user_id: customer.user_id || '',
        service: `Warranty Claim — ${w.component}`,
        value: w.coverage || `${w.warranty_years} years`,
        valid_until: w.expiration_date || undefined,
        description: `Warranty claim voucher for ${w.component} (${w.warranty_years} years).`,
        status: 'available',
      });
      toast({ title: 'Warranty voucher created', description: 'The customer can now claim it in their Vouchers page.' });
    } catch {
      toast({ title: 'Failed to create voucher' });
    } finally {
      setClaiming(null);
    }
  };

  if (!items) return <Spinner label="Loading warranties…" />;

  const statusVariant = { active: 'success', expiring_soon: 'warning', expired: 'muted', claimed: 'solar', pending: 'muted' };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Standard warranties are auto-generated and start after the installation date.</p>
      {items.map((w) => {
        const status = computeStatus(w.start_date, w.expiration_date);
        return (
          <div key={w.id} className="p-3 rounded-xl border border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-solar shrink-0" />
                <p className="text-sm font-medium truncate">{w.component}</p>
              </div>
              <Badge variant={statusVariant[status] || 'muted'}>{status.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
              <p>{w.warranty_years} years warranty</p>
              {w.start_date ? (
                <p>{w.start_date} → {w.expiration_date}</p>
              ) : (
                <p className="text-amber-600">Starts after installation date</p>
              )}
            </div>
            <button
              onClick={() => claimVoucher(w)}
              disabled={claiming === w.id || !w.start_date}
              className="mt-2 w-full h-9 rounded-lg bg-solar/10 text-solar text-xs font-semibold hover:bg-solar/20 border border-solar/30 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {claiming === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
              {claiming === w.id ? 'Creating…' : 'Claim Warranty Voucher'}
            </button>
          </div>
        );
      })}
    </div>
  );
}