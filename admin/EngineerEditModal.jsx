import { useState, useEffect } from 'react';
import { Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

const SKIP_FIELDS = [
  'id', 'created_date', 'updated_date', 'created_by_id',
  'customer_id', 'user_id', 'project_id', 'assigned_engineer_id', 'assigned_engineer',
  'ticket_number', 'request_number', 'appointment_id',
  'customer_name', 'project_name', 'address', 'system_info', 'system_size',
  'source_ticket_id',
];

export default function EngineerEditModal({ entityName, record, onClose, onSubmitted }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities[entityName].schema().then(setSchema).catch(() => setSchema(null));
  }, [entityName]);

  useEffect(() => {
    if (record) {
      const editable = {};
      Object.keys(record).forEach((k) => {
        if (!SKIP_FIELDS.includes(k)) editable[k] = record[k] ?? '';
      });
      setValues(editable);
    }
  }, [record]);

  const submit = async () => {
    setSaving(true);
    try {
      const changes = {};
      Object.keys(values).forEach((k) => {
        if (String(values[k] ?? '') !== String(record[k] ?? '')) changes[k] = values[k];
      });
      if (Object.keys(changes).length === 0) {
        toast({ title: 'No changes to submit' });
        onClose();
        return;
      }
      const label = record.ticket_number || record.request_number || record.appointment_id || record.technician || entityName;
      await base44.entities.PendingEdit.create({
        entity_type: entityName,
        entity_id: record.id,
        entity_label: label,
        changes: JSON.stringify(changes),
        submitted_by_id: user.id,
        submitted_by_name: user.full_name || 'Engineer',
        status: 'pending',
      });
      await base44.functions.invoke('notifyStaff', {
        title: 'Pending edit requires approval',
        body: `${user.full_name || 'Engineer'} submitted an edit to ${label}. Please review and approve.`,
        type: 'announcement',
        link: '/admin/pending-edits',
        roles: ['admin', 'super_admin'],
      }).catch(() => {});
      toast({ title: 'Edit submitted for approval', description: 'An admin will review your changes.' });
      onSubmitted?.();
      onClose();
    } catch {
      toast({ title: 'Submission failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!schema) return null;

  const fields = Object.entries(schema.properties || {})
    .filter(([k]) => !SKIP_FIELDS.includes(k))
    .filter(([k]) => Object.keys(values).includes(k));

  return (
    <Modal open onClose={onClose} title={`Edit: ${record.ticket_number || record.request_number || record.appointment_id || entityName}`}>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        <p className="text-xs text-amber-600 font-semibold bg-amber-50 rounded-lg p-2 border border-amber-200">
          All changes are subject to admin approval before they take effect.
        </p>
        {fields.map(([key, def]) => {
          const isEnum = def.enum;
          const isDate = def.format === 'date';
          const isNumber = def.type === 'number';
          const isBool = def.type === 'boolean';
          const isRequired = (schema.required || []).includes(key);
          const label = key.replace(/_/g, ' ');

          return (
            <div key={key}>
              <Label className="text-xs font-semibold capitalize">{label} {isRequired && '*'}</Label>
              {isEnum ? (
                <select
                  value={values[key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  {def.enum.map((opt) => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                </select>
              ) : isDate ? (
                <Input type="date" value={values[key] || ''} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} className="mt-1 h-11 rounded-xl" />
              ) : isNumber ? (
                <Input type="number" value={values[key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value ? Number(e.target.value) : '' }))} className="mt-1 h-11 rounded-xl" />
              ) : isBool ? (
                <select
                  value={values[key] === true ? 'true' : values[key] === false ? 'false' : ''}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value === 'true' }))}
                  className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <textarea
                  value={values[key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  rows={1}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 bg-solar text-ink hover:bg-solar/90" disabled={saving} onClick={submit}>
          {saving ? 'Submitting…' : 'Submit for Approval'}
        </Button>
      </div>
    </Modal>
  );
}