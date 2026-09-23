import { milestoneStatus, projectStatusLabel, formatDate } from '@/lib/format';

const DAY = 86400000;

export default function GanttChart({ milestones }) {
  const withDates = (milestones || []).filter((m) => m.date);
  if (withDates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No scheduled milestones to chart. Add dates to milestones to visualize the timeline.
      </p>
    );
  }

  const sorted = [...withDates].sort((a, b) => new Date(a.date) - new Date(b.date));
  const rows = sorted.map((m, i) => {
    const start = new Date(m.date).getTime();
    const end = i < sorted.length - 1 ? new Date(sorted[i + 1].date).getTime() : start + 7 * DAY;
    return { m, start, end };
  });

  let min = Math.min(...rows.map((r) => r.start));
  let max = Math.max(...rows.map((r) => r.end));
  const pad = Math.max((max - min) * 0.08, DAY);
  min -= pad;
  max += pad;
  const range = Math.max(max - min, DAY);
  const ticks = [0, 1, 2, 3, 4].map((i) => min + (range * i) / 4);

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="min-w-[480px]">
        <div className="flex justify-between text-[10px] text-muted-foreground px-1 mb-2">
          {ticks.map((t, i) => <span key={i}>{formatDate(new Date(t), { month: 'short', day: 'numeric' })}</span>)}
        </div>
        <div className="space-y-2">
          {rows.map(({ m, start, end }) => {
            const left = ((start - min) / range) * 100;
            const width = Math.max(((end - start) / range) * 100, 1.5);
            const ms = milestoneStatus[m.status] || milestoneStatus.scheduled;
            return (
              <div key={m.id} className="flex items-center gap-2">
                <div className="w-28 shrink-0 truncate text-[11px] font-semibold text-foreground">
                  {m.stage_label || projectStatusLabel[m.stage] || m.stage}
                </div>
                <div className="relative flex-1 h-6 bg-muted/50 rounded-md">
                  <div
                    className={`absolute top-0 h-full rounded-md ${ms.dot} opacity-90 flex items-center px-1.5`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="text-[9px] font-bold text-white truncate">{formatDate(m.date, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}