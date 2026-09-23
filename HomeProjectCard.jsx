import { Link } from 'react-router-dom';
import { ChevronRight, Layers, MapPin } from 'lucide-react';
import { Card } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { projectStatusLabel } from '@/lib/format';

const SOLAR_IMG =
  'https://media.base44.com/images/public/6a7c03ede0a9277673980b84/3cd069c52_image.png';

export default function HomeProjectCard({ project, projects, customer }) {
  const multi = projects && projects.length > 1;
  const progress = project?.progress_percent || 0;
  const statusLabel = projectStatusLabel[project?.status] || '—';
  const systemName = project?.system_name || customer?.system_capacity || 'Solar System';
  const projectId = project?.project_id || '—';

  if (multi) {
    return (
      <Card className="overflow-hidden mb-4 shadow-lg shadow-black/5">
        <div className="relative h-32">
          <Image src={SOLAR_IMG} alt="Solar installation" fittingType="fill" className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative h-full p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-solar">YOUR SOLAR SETUPS</span>
              <span className="text-xs font-semibold text-solar">{statusLabel}</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white leading-tight">{projects.length} Solar Installations</h3>
              <p className="text-sm text-gray-300 mt-0.5">Tap to view each setup</p>
            </div>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {projects.slice(0, 3).map((p, i) => (
            <Link key={p.id} to="/project" className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition">
              <span className="w-8 h-8 rounded-lg bg-solar/15 grid place-items-center shrink-0">
                <span className="text-xs font-bold text-solar">{i + 1}</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.system_name || `Setup ${i + 1}`}</p>
                {p.address && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {p.address}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold">{p.progress_percent || 0}%</p>
                <p className="text-[10px] text-muted-foreground">{projectStatusLabel[p.status] || '—'}</p>
              </div>
            </Link>
          ))}
          {projects.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">+ {projects.length - 3} more setup{projects.length - 3 > 1 ? 's' : ''}</p>
          )}
          <Link to="/project" className="block">
            <Button className="w-full rounded-xl bg-solar text-ink hover:bg-solar/90 mt-1">
              <Layers className="w-4 h-4" /> View All Setups <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden mb-4 shadow-lg shadow-black/5">
      {/* Image header */}
      <div className="relative h-40">
        <Image src={SOLAR_IMG} alt="Solar installation" fittingType="fill" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-solar">YOUR SOLAR PROJECT</span>
            <span className="text-xs font-semibold text-solar">{statusLabel}</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-white leading-tight">My Solar Installation</h3>
            <p className="text-sm text-gray-300 mt-0.5">{systemName}</p>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Project progress</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-solar transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Project ID</p>
            <p className="font-semibold">{projectId}</p>
          </div>
          <Link to="/project">
            <Button className="rounded-full bg-solar text-ink hover:bg-solar/90">
              Track Project <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}