import { MapPin, Zap } from 'lucide-react';

const PORTAL_LABELS = {
  deye: 'Deye',
  solis: 'Solis',
  sunways: 'Sunways',
  dyness: 'Dyness',
  skyworth: 'Skyworth',
};

export default function SetupSelector({ projects, selectedId, onSelect }) {
  if (!projects || projects.length <= 1) return null;
  return (
    <div className="mb-4">
      <h3 className="font-display font-semibold text-sm mb-2 px-1">My Solar Setups</h3>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {projects.map((p, i) => {
          const isSelected = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition active:scale-95 ${
                isSelected ? 'border-solar bg-solar/10 shadow-sm' : 'border-border bg-card'
              }`}
            >
              <span className={`w-6 h-6 rounded-full grid place-items-center ${isSelected ? 'bg-solar text-ink' : 'bg-muted text-muted-foreground'}`}>
                <Zap className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold leading-none">
                {p.system_name || `Solar ${i + 1}`}
              </span>
              {p.address && (
                <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground max-w-[8rem] truncate">
                  <MapPin className="w-3 h-3 shrink-0" /> {p.address}
                </span>
              )}
              {p.portal && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {PORTAL_LABELS[p.portal] || p.portal}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}