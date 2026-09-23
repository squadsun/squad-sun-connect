import { Card } from '@/components/customer/ui';
import { Sun, Zap } from 'lucide-react';

const PORTALS = [
  { key: 'sunways', name: 'Sunways', desc: 'Sunways Portal monitoring', icon: Sun, color: 'text-amber-500' },
  { key: 'deye', name: 'Deye', desc: 'Deye Cloud monitoring', icon: Zap, color: 'text-blue-500' },
];

export default function SolarPortalPicker({ onSelect }) {
  return (
    <Card className="p-5 mb-4">
      <h3 className="font-display font-bold text-sm mb-1">Select Your Solar Portal</h3>
      <p className="text-xs text-muted-foreground mb-4">Choose your inverter monitoring platform to connect.</p>
      <div className="space-y-2">
        {PORTALS.map((p) => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-solar hover:bg-solar/5 transition text-left"
          >
            <span className="w-10 h-10 rounded-xl bg-muted grid place-items-center shrink-0">
              <p.icon className={`w-5 h-5 ${p.color}`} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}