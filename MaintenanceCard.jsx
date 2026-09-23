import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CalendarDays, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/customer/ui';
import { formatDate } from '@/lib/format';

export default function MaintenanceCard({ customer, warrantyStatus }) {
  const [lastMaintenance, setLastMaintenance] = useState(null);
  const [lastCleaning, setLastCleaning] = useState(null);

  useEffect(() => {
    if (!customer?.id) return;
    const load = async () => {
      try {
        const maint = await base44.entities.MaintenanceRequest.filter(
          { customer_id: customer.id, status: 'completed' }, '-updated_date', 1
        );
        setLastMaintenance(maint?.[0] || null);
        const clean = await base44.entities.CleaningRequest.filter(
          { customer_id: customer.id, status: 'completed' }, '-updated_date', 1
        );
        setLastCleaning(clean?.[0] || null);
      } catch {
        setLastMaintenance(null);
        setLastCleaning(null);
      }
    };
    load();
  }, [customer?.id]);

  const stats = [
    { label: 'Last maintenance', value: lastMaintenance?.scheduled_date ? formatDate(lastMaintenance.scheduled_date) : '—', icon: Wrench },
    { label: 'Last cleaning', value: lastCleaning?.cleaning_date ? formatDate(lastCleaning.cleaning_date) : '—', icon: CalendarDays },
    { label: 'System health', value: 'Healthy', icon: Activity },
    { label: 'Warranty status', value: warrantyStatus || '—', icon: ShieldCheck },
  ];

  return (
    <Card className="overflow-hidden mb-4">
      <div className="p-4 flex items-center gap-2 border-b border-border/50">
        <span className="w-9 h-9 rounded-xl bg-solar/10 grid place-items-center">
          <Wrench className="w-5 h-5 text-solar" />
        </span>
        <h3 className="font-display font-bold">My Maintenance</h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display font-bold text-sm mt-0.5 flex items-center gap-1.5">
              <s.icon className="w-3.5 h-3.5 text-solar" />
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <Link to="/booking" className="block mx-3 mb-3 p-3 rounded-xl bg-solar/10 border border-solar/20 active:scale-[0.98] transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-sm text-solar">View Calendar</p>
            <p className="text-xs text-muted-foreground">See scheduled maintenance & visits</p>
          </div>
          <ChevronRight className="w-5 h-5 text-solar" />
        </div>
      </Link>
    </Card>
  );
}