import { useState, useRef } from 'react';
import { Camera, Loader2, Upload, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';

// Parse various date formats to ISO YYYY-MM-DD
function parseDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  // Try "Month Year" format (e.g. "Jul 2026") → default to 1st
  const d2 = new Date(str + ' 1');
  if (!isNaN(d2)) return d2.toISOString().split('T')[0];
  return '';
}

export default function AddBillModal({ open, onClose, onSaved, customer }) {
  const [stage, setStage] = useState('upload'); // upload → extracting → confirm
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [form, setForm] = useState({
    amount: '',
    bill_period: '',
    kwh_consumption: '',
    bill_date: '',
    due_date: '',
    electricity_rate: '',
  });
  const fileRef = useRef(null);

  const reset = () => {
    setStage('upload');
    setError('');
    setFileUrl('');
    setForm({ amount: '', bill_period: '', kwh_consumption: '', bill_date: '', due_date: '', electricity_rate: '' });
  };

  const handleClose = () => {
    if (stage === 'extracting') return;
    reset();
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !customer?.id) return;
    setStage('extracting');
    setError('');
    try {
      const upload = await base44.integrations.Core.UploadPublicFile({ file });
      const url = upload.file_url;
      setFileUrl(url);

      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt:
          "This is a photo or PDF of a Meralco electricity bill from the Philippines. " +
          "Extract the following fields:\n" +
          "1. amount — Total amount due in PHP (the final payable amount)\n" +
          "2. bill_period — Billing period (e.g. 'Jul 2026' or a date range)\n" +
          "3. kwh_consumption — Total kWh consumed during the billing period\n" +
          "4. bill_date — Date the bill was issued (ISO format if possible)\n" +
          "5. due_date — Payment due date (ISO format if possible)\n" +
          "6. electricity_rate — Electricity rate in PHP per kWh if shown on the bill\n" +
          "Return only valid JSON. Use null for any field you cannot read clearly.",
        response_json_schema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            bill_period: { type: 'string' },
            kwh_consumption: { type: 'number' },
            bill_date: { type: 'string' },
            due_date: { type: 'string' },
            electricity_rate: { type: 'number' },
          },
        },
        file_urls: [url],
      });

      setForm({
        amount: extracted?.amount ?? '',
        bill_period: extracted?.bill_period ?? '',
        kwh_consumption: extracted?.kwh_consumption ?? '',
        bill_date: parseDate(extracted?.bill_date),
        due_date: parseDate(extracted?.due_date),
        electricity_rate: extracted?.electricity_rate ?? '',
      });
      setStage('confirm');
    } catch (e) {
      console.error(e);
      setError('Could not read the bill. Please try a clearer photo or enter details manually.');
      setStage('confirm');
    }
  };

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid bill amount.');
      return;
    }
    setStage('saving');
    try {
      await base44.entities.MeralcoBill.create({
        customer_id: customer.id,
        user_id: customer.user_id,
        amount,
        bill_period: form.bill_period || '',
        kwh_consumption: form.kwh_consumption ? Number(form.kwh_consumption) : undefined,
        bill_date: form.bill_date || undefined,
        due_date: form.due_date || undefined,
        electricity_rate: form.electricity_rate ? Number(form.electricity_rate) : undefined,
        photo_url: fileUrl || undefined,
      });
      reset();
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to save bill. Please try again.');
      setStage('confirm');
    }
  };

  const isBusy = stage === 'extracting' || stage === 'saving';

  return (
    <Modal open={open} onClose={handleClose} title="Add New Bill">
      <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile} className="hidden" />

      {stage === 'upload' && (
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6600]/15 grid place-items-center mx-auto mb-3">
            <Camera className="w-8 h-8 text-[#FF6600]" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload or capture a photo of your Meralco bill. We'll read the details automatically — you can review and edit before saving.
          </p>
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <Button onClick={() => fileRef.current?.click()} className="bg-[#FF6600] text-white hover:bg-[#FF6600]/90 rounded-full w-full">
            <Camera className="w-4 h-4" /> Capture / Upload Bill
          </Button>
        </div>
      )}

      {stage === 'extracting' && (
        <div className="text-center py-6">
          <Loader2 className="w-10 h-10 text-[#FF6600] animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Reading your bill…</p>
        </div>
      )}

      {stage === 'confirm' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4" /> Review extracted details
          </div>
          {error && (
            <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount Due (₱)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" />
            <Field label="kWh Consumption" value={form.kwh_consumption} onChange={(v) => setForm({ ...form, kwh_consumption: v })} type="number" />
            <Field label="Bill Period" value={form.bill_period} onChange={(v) => setForm({ ...form, bill_period: v })} placeholder="e.g. Jul 2026" />
            <Field label="Electricity Rate (₱/kWh)" value={form.electricity_rate} onChange={(v) => setForm({ ...form, electricity_rate: v })} type="number" />
            <Field label="Bill Date" value={form.bill_date} onChange={(v) => setForm({ ...form, bill_date: v })} type="date" />
            <Field label="Due Date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} type="date" />
          </div>

          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <FileText className="w-3.5 h-3.5" /> View uploaded bill
            </a>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={reset} className="flex-1 rounded-full" disabled={isBusy}>
              Re-upload
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#FF6600] text-white hover:bg-[#FF6600]/90 rounded-full" disabled={isBusy}>
              {stage === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Bill'}
            </Button>
          </div>
        </div>
      )}

      {stage === 'saving' && (
        <div className="text-center py-6">
          <Loader2 className="w-10 h-10 text-[#FF6600] animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Saving bill…</p>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-solar/40"
      />
    </div>
  );
}