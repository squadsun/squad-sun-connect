import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const STATUSES = {
  Appointment: ['requested', 'confirmed', 'rescheduled', 'on_the_way', 'in_progress', 'completed', 'cancelled'],
  MaintenanceRequest: ['open', 'assigned', 'scheduled', 'on_the_way', 'in_progress', 'completed', 'closed'],
  CleaningRequest: ['open', 'assigned', 'scheduled', 'on_the_way', 'in_progress', 'completed', 'closed'],
  TechnicalTicket: ['new', 'assigned', 'accepted', 'scheduled', 'on_the_way', 'on_site', 'in_progress', 'completed', 'report_submitted', 'closed'],
};

const KIND_LABELS = { appointment: 'Appointment', maintenance: 'Maintenance', cleaning: 'Cleaning', ticket: 'Technical Ticket' };

export default function CalendarTaskEditor({ item, defaultDate, customers, engineers, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!item;
  const entityName = item?._entity;
  const kind = item?._kind;

  const dateStr = (d) => d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0] : '';

  const [form, setForm] = useState({
    type: kind || 'appointment',
    customer_id: item?.customer_id || '',
    date: (isEdit && item._date) ? dateStr(new Date(item._date)) : dateStr(defaultDate),
    time: (isEdit && item._timeField && item[item._timeField]) ? item[item._timeField] : '',
    assigned_engineer_id: item?.assigned_engineer_id || '',
    status: item?.status || '',
    reason: item?.reason || item?.subject || item?.customer_name || '',
    notes: item?.notes || '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);
  const reqNum = `CAL-${Date.now().toString().slice(-6)}`;

  const save = async () => {
    setSaving(true);
    try {
      const eng = engineers.find((e) => e.id === form.assigned_engineer_id);
      const engName = eng?.full_name || '';
      const custName = selectedCustomer?.full_name || '';

      if (isEdit) {
        const update = { status: form.status };
        if (item._dateField) update[item._dateField] = form.date || undefined;
        if (item._timeField) update[item._timeField] = form.time || undefined;
        if (form.assigned_engineer_id) { update.assigned_engineer_id = form.assigned_engineer_id; update.assigned_engineer = engName; }
        if (kind === 'appointment') { update.reason = form.reason; update.assigned_technician = engName; }
        await base44.entities[entityName].update(item.id, update);
        toast({ title: 'Task updated' });
      } else {
        if (form.type === 'appointment') {
          await base44.entities.Appointment.create({
            customer_id: form.customer_id, type: 'technical_visit', reason: form.reason || 'Scheduled visit',
            date: form.date, time: form.time, assigned_technician: engName,
            status: 'confirmed', notes: form.notes, address: selectedCustomer?.property_address || '',
          });
        } else if (form.type === 'maintenance') {
          await base44.entities.MaintenanceRequest.create({
            request_number: reqNum, customer_id: form.customer_id, customer_name: custName,
            address: selectedCustomer?.property_address || '', request_date: new Date().toISOString().split('T')[0],
            preferred_date: form.date, scheduled_date: form.date, scheduled_time: form.time,
            assigned_engineer: engName, assigned_engineer_id: form.assigned_engineer_id,
            status: form.assigned_engineer_id ? 'assigned' : 'open',
          });
        } else if (form.type === 'cleaning') {
          await base44.entities.CleaningRequest.create({
            request_number: reqNum, customer_id: form.customer_id, customer_name: custName,
            address: selectedCustomer?.property_address || '', request_date: new Date().toISOString().split('T')[0],
            preferred_date: form.date, cleaning_date: form.date,
            assigned_engineer: engName, assigned_engineer_id: form.assigned_engineer_id,
            status: form.assigned_engineer_id ? 'assigned' : 'open',
          });
        }
        toast({ title: 'Task created' });
      }
      onSaved();
    } catch {
      toast({ title: 'Failed to save task' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit ${KIND_LABELS[kind] || 'Task'}` : 'Add Task'}>
      <div className="space-y-3">
        {!isEdit && (
          <div>
            <Label className="text-xs font-semibold">Type</Label>
            <Select value={form.type} onValueChange={setVal('type')}>
              <SelectTrigger className="mt-1 w-full h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment">Appointment (Admin)</SelectItem>
                <SelectItem value="maintenance">Maintenance (Engineer)</SelectItem>
                <SelectItem value="cleaning">Cleaning (Engineer)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-xs font-semibold">Customer</Label>
          <Select value={form.customer_id} onValueChange={setVal('customer_id')}>
            <SelectTrigger className="mt-1 w-full h-11 rounded-xl text-sm"><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs font-semibold">Date</Label><Input type="date" value={form.date} onChange={set('date')} className="mt-1 h-11 rounded-xl" /></div>
          <div><Label className="text-xs font-semibold">Time</Label><Input type="time" value={form.time} onChange={set('time')} className="mt-1 h-11 rounded-xl" /></div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Assign to</Label>
          <Select value={form.assigned_engineer_id} onValueChange={setVal('assigned_engineer_id')}>
            <SelectTrigger className="mt-1 w-full h-11 rounded-xl text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              {engineers.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isEdit && item.status !== undefined && (
          <div>
            <Label className="text-xs font-semibold">Status</Label>
            <Select value={form.status} onValueChange={setVal('status')}>
              <SelectTrigger className="mt-1 w-full h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(STATUSES[entityName] || []).map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {!isEdit && (
          <div><Label className="text-xs font-semibold">Reason / Notes</Label><Input value={form.reason} onChange={set('reason')} className="mt-1 h-11 rounded-xl" placeholder="Visit reason or notes" /></div>
        )}
        <Button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-solar text-ink hover:bg-solar/90">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </Modal>
  );
}