import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, Spinner, PageTitle, Modal, Badge } from '@/components/customer/ui';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { StatusBadge } from '@/components/admin/AdminUI';
import CalendarTaskEditor from '@/components/admin/CalendarTaskEditor';

const DOT = { blue: 'bg-blue-500', orange: 'bg-orange-500' };
const STRIPE = { blue: 'border-l-blue-500', orange: 'border-l-orange-500' };
const TEXT_BG = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
};

const META = {
  maintenance: { color: 'blue', label: 'Maintenance', entity: 'MaintenanceRequest', dateField: 'scheduled_date', dateField2: 'preferred_date', timeField: 'scheduled_time' },
  cleaning: { color: 'blue', label: 'Cleaning', entity: 'CleaningRequest', dateField: 'cleaning_date', dateField2: 'preferred_date', timeField: null },
  appointment: { color: 'orange', label: 'Appointment', entity: 'Appointment', dateField: 'date', dateField2: null, timeField: 'time' },
  ticket: { color: 'blue', label: 'Technical', entity: 'TechnicalTicket', dateField: 'scheduled_date', dateField2: null, timeField: 'scheduled_time' },
  milestone: { color: null, label: 'Milestone', entity: 'ProjectMilestone', dateField: 'date', dateField2: null, timeField: 'time' },
};

function buildItem(raw, kind) {
  const meta = META[kind];
  const dateVal = raw[meta.dateField] || raw[meta.dateField2];
  const color = meta.color || (raw.assigned_role === 'csr' ? 'orange' : 'blue');
  return {
    ...raw, _kind: kind, _color: color, _entity: meta.entity,
    _dateField: meta.dateField, _timeField: meta.timeField,
    _date: dateVal, _label: raw.subject || raw.reason || raw.customer_name || raw.stage_label || meta.label,
  };
}

export default function SharedCalendar({ scope = 'admin' }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    (async () => {
      let appts, maint, cleaning, tickets, milestones, customers, engineers;
      if (scope === 'engineer') {
        const ef = { assigned_engineer_id: user.id };
        [appts, maint, cleaning, tickets, milestones, customers, engineers] = await Promise.all([
          base44.entities.Appointment.filter({ assigned_technician: user.full_name || user.email }, '-created_date', 500).catch(() => []),
          base44.entities.MaintenanceRequest.filter(ef, '-created_date', 500).catch(() => []),
          base44.entities.CleaningRequest.filter(ef, '-created_date', 500).catch(() => []),
          base44.entities.TechnicalTicket.filter(ef, '-created_date', 500).catch(() => []),
          base44.entities.ProjectMilestone.filter(ef, '-created_date', 500).catch(() => []),
          base44.entities.Customer.list('-created_date', 500).catch(() => []),
          base44.entities.User.list('-created_date', 500).catch(() => []),
        ]);
      } else {
        [appts, maint, cleaning, tickets, milestones, customers, engineers] = await Promise.all([
          base44.entities.Appointment.list('-created_date', 500).catch(() => []),
          base44.entities.MaintenanceRequest.list('-created_date', 500).catch(() => []),
          base44.entities.CleaningRequest.list('-created_date', 500).catch(() => []),
          base44.entities.TechnicalTicket.list('-created_date', 500).catch(() => []),
          base44.entities.ProjectMilestone.list('-created_date', 500).catch(() => []),
          base44.entities.Customer.list('-created_date', 500).catch(() => []),
          base44.entities.User.list('-created_date', 500).catch(() => []),
        ]);
      }
      setData({
        appts: appts || [], maint: maint || [], cleaning: cleaning || [],
        tickets: tickets || [], milestones: milestones || [],
        customers: customers || [],
        engineers: (engineers || []).filter((u) => u.role === 'engineer' || u.role === 'admin'),
      });
    })().catch(() => setData({ appts: [], maint: [], cleaning: [], tickets: [], milestones: [], customers: [], engineers: [] }));
  }, [scope, user?.id, user?.full_name, user?.email]);

  if (!data) return <Spinner label="Loading calendar…" />;

  const allItems = [
    ...data.tickets.map((t) => buildItem(t, 'ticket')),
    ...data.maint.map((m) => buildItem(m, 'maintenance')),
    ...data.cleaning.map((c) => buildItem(c, 'cleaning')),
    ...data.appts.map((a) => buildItem(a, 'appointment')),
    ...data.milestones.map((m) => buildItem(m, 'milestone')),
  ].filter((i) => i._date);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const itemsForDate = (dayNum) => {
    const ds = new Date(year, month, dayNum).toDateString();
    return allItems.filter((i) => new Date(i._date).toDateString() === ds);
  };

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayItems = selectedDay ? itemsForDate(selectedDay) : [];
  const upcoming = allItems
    .filter((i) => new Date(i._date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a._date) - new Date(b._date))
    .slice(0, 15);

  return (
    <div>
      <PageTitle title="Calendar" subtitle={scope === 'engineer' ? 'Your assigned tasks' : 'All scheduled bookings & tasks'} />

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="font-display font-bold">{cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Engineer</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> CSR</span>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[80px] rounded-lg bg-muted/30" />;
            const items = itemsForDate(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <button key={i} onClick={() => setSelectedDay(day)}
                className={`min-h-[80px] rounded-lg border p-1 text-left transition hover:border-solar ${isToday ? 'border-solar bg-solar/5' : 'border-border'}`}>
                <span className={`text-xs font-bold ${isToday ? 'text-solar' : 'text-muted-foreground'}`}>{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className={`text-[9px] leading-tight truncate px-1 rounded ${TEXT_BG[item._color]}`} title={item._label}>
                      {item._label}
                    </div>
                  ))}
                  {items.length > 3 && <span className="text-[8px] text-muted-foreground">+{items.length - 3} more</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 mt-4">
        <h3 className="font-display font-bold text-sm mb-3">Upcoming</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming items.</p>
        ) : (
          <div className="space-y-1">
            {upcoming.map((item) => (
              <button key={item.id} onClick={() => setEditor({ item, date: null })}
                className={`w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 border-l-2 ${STRIPE[item._color]} text-left`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item._label}</p>
                  <p className="text-xs text-muted-foreground">{META[item._kind].label} · {new Date(item._date).toLocaleDateString()}{item._timeField && item[item._timeField] ? ` · ${item[item._timeField]}` : ''}</p>
                </div>
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!selectedDay} onClose={() => setSelectedDay(null)} title={selectedDay ? `${new Date(year, month, selectedDay).toLocaleDateString('default', { month: 'short', day: 'numeric' })}` : ''}>
        <div className="space-y-2 mb-3">
          {dayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items for this day.</p>
          ) : (
            dayItems.map((item) => (
              <button key={item.id} onClick={() => { setEditor({ item, date: null }); setSelectedDay(null); }}
                className={`w-full flex items-start gap-2 p-3 rounded-xl border-l-2 ${STRIPE[item._color]} border border-border text-left hover:bg-muted/50`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item._label}</p>
                  <p className="text-xs text-muted-foreground">{META[item._kind].label}{item._timeField && item[item._timeField] ? ` · ${item[item._timeField]}` : ''}{item.assigned_engineer ? ` · ${item.assigned_engineer}` : ''}</p>
                </div>
                <StatusBadge status={item.status} />
              </button>
            ))
          )}
        </div>
        <button onClick={() => { const d = selectedDay; setSelectedDay(null); setEditor({ item: null, date: new Date(year, month, d) }); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-solar text-ink text-sm font-bold">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </Modal>

      {editor && (
        <CalendarTaskEditor
          item={editor.item}
          defaultDate={editor.date}
          customers={data.customers}
          engineers={data.engineers}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}