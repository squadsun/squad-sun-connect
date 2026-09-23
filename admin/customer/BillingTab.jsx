import { useState, useEffect } from 'react';
import { Receipt, Trash2, CheckCircle2, XCircle, Eye, Loader2, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { useToast } from '@/components/ui/use-toast';
import { Badge, Spinner } from '@/components/customer/ui';

export default function BillingTab({ customer }) {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ date: '', payment_type: 'cash', payment_option: 'down_payment', installment_month: '', installment_year: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState({});
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    const list = await base44.entities.Invoice.filter({ customer_id: customer.id }, '-date', 200);
    setItems(list || []);
  };
  useEffect(() => { load().catch(() => setItems([])); }, [customer.id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.date || !form.amount) { toast({ title: 'Date and amount are required' }); return; }
    if (form.payment_type === 'installment' && (!form.installment_month || !form.installment_year)) {
      toast({ title: 'Month and year are required for installment' }); return;
    }
    setSaving(true);
    try {
      const docNum = `BILL-${Date.now().toString().slice(-6)}`;
      const amount = Number(form.amount) || 0;
      await base44.entities.Invoice.create({
        document_number: docNum,
        customer_id: customer.id,
        user_id: customer.user_id || '',
        customer_name: customer.full_name,
        document_type: 'billing_statement',
        amount,
        date: form.date,
        payment_type: form.payment_type,
        payment_option: form.payment_type === 'installment' ? 'partial_payment' : form.payment_option,
        installment_month: form.payment_type === 'installment' ? form.installment_month : '',
        installment_year: form.payment_type === 'installment' ? form.installment_year : '',
        status: 'sent',
      });
      await base44.entities.AppNotification.create({
        user_id: customer.user_id || '',
        customer_id: customer.id,
        title: 'Payment Reminder',
        body: `Your payment of ₱${amount.toLocaleString()} is due on ${form.date}. Please settle before the due date.`,
        type: 'reminder',
        read: false,
        link: '/billing',
      }).catch(() => {});
      await base44.integrations.Core.SendEmail({
        to: customer.email,
        subject: 'Payment Reminder from S-Quad Sun',
        body: `Hello ${customer.full_name},\n\nYour payment of ₱${amount.toLocaleString()} is due on ${form.date}. Please settle your balance before the due date through your customer portal under Billing.\n\nThank you,\nS-Quad Sun`,
      }).catch(() => {});
      setForm({ date: '', payment_type: 'cash', payment_option: 'down_payment', installment_month: '', installment_year: '', amount: '' });
      toast({ title: 'Billing record added', description: 'Customer notified of due payment.' });
      load();
    } catch {
      toast({ title: 'Failed to add billing record' });
    } finally {
      setSaving(false);
    }
  };

  const approve = async (inv) => {
    if (!receiptFile[inv.id]) { toast({ title: 'Attach a receipt file to approve' }); return; }
    setProcessing(inv.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: receiptFile[inv.id] });
      const today = new Date().toISOString().split('T')[0];
      await base44.entities.Invoice.update(inv.id, { status: 'paid', paid_date: today, receipt_url: file_url });
      await base44.entities.Document.create({
        customer_id: customer.id,
        user_id: customer.user_id || '',
        title: 'Receipts',
        category: 'invoice',
        file_url,
        date: today,
      }).catch(() => {});
      await base44.entities.AppNotification.create({
        user_id: customer.user_id || '',
        customer_id: customer.id,
        title: 'Payment Received',
        body: `Your payment of ₱${Number(inv.amount || 0).toLocaleString()} has been confirmed. A receipt has been added to your documents.`,
        type: 'announcement',
        read: false,
        link: '/billing',
      }).catch(() => {});
      setReceiptFile((f) => ({ ...f, [inv.id]: null }));
      toast({ title: 'Payment approved', description: 'Receipt uploaded to documents.' });
      load();
    } catch {
      toast({ title: 'Failed to approve payment' });
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (inv) => {
    setProcessing(inv.id);
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'sent', proof_of_payment_url: '' });
      await base44.entities.AppNotification.create({
        user_id: customer.user_id || '',
        customer_id: customer.id,
        title: 'Payment Rejected',
        body: `Your proof of payment for ₱${Number(inv.amount || 0).toLocaleString()} could not be verified. Please re-upload a valid proof.`,
        type: 'reminder',
        read: false,
        link: '/billing',
      }).catch(() => {});
      toast({ title: 'Payment rejected', description: 'Customer asked to re-upload proof.' });
      load();
    } catch {
      toast({ title: 'Failed to reject payment' });
    } finally {
      setProcessing(null);
    }
  };

  const remove = async (id) => {
    await base44.entities.Invoice.delete(id);
    toast({ title: 'Record deleted' });
    load();
  };

  if (!items) return <Spinner label="Loading billing…" />;

  const statusVariant = { draft: 'muted', sent: 'solar', paid: 'success', partial: 'warning', overdue: 'danger', cancelled: 'muted', proof_submitted: 'warning' };
  const statusLabel = { sent: 'For Payment', proof_submitted: 'Pending Verification', paid: 'Paid', partial: 'Partial', overdue: 'Overdue', draft: 'Draft', cancelled: 'Cancelled' };
  const optionLabel = { down_payment: 'Down payment', full_payment: 'Full payment', partial_payment: 'Partial payment' };

  return (
    <div className="space-y-4">
      <div className="space-y-3 p-3 rounded-xl bg-muted/50">
        <div>
          <Label className="text-xs font-semibold">Settle date *</Label>
          <Input type="date" value={form.date} onChange={set('date')} className="mt-1 h-11 rounded-xl" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Payment type</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button type="button" onClick={() => setVal('payment_type')('cash')} className={`h-11 rounded-xl text-sm font-semibold border transition ${form.payment_type === 'cash' ? 'bg-solar text-ink border-solar' : 'bg-background border-border text-muted-foreground'}`}>Cash</button>
            <button type="button" onClick={() => setVal('payment_type')('installment')} className={`h-11 rounded-xl text-sm font-semibold border transition ${form.payment_type === 'installment' ? 'bg-solar text-ink border-solar' : 'bg-background border-border text-muted-foreground'}`}>Installment</button>
          </div>
        </div>
        {form.payment_type === 'installment' ? (
          <>
            <div>
              <Label className="text-xs font-semibold">Payment option</Label>
              <div className="h-11 rounded-xl mt-1 flex items-center px-3 bg-solar/10 text-solar text-sm font-semibold border border-solar/30">Partial payment</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Month</Label><Input value={form.installment_month} onChange={set('installment_month')} className="mt-1 h-11 rounded-xl" placeholder="e.g. June" /></div>
              <div><Label className="text-xs font-semibold">Year</Label><Input type="number" value={form.installment_year} onChange={set('installment_year')} className="mt-1 h-11 rounded-xl" placeholder="e.g. 2026" /></div>
            </div>
          </>
        ) : (
          <div>
            <Label className="text-xs font-semibold">Payment option</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={() => setVal('payment_option')('down_payment')} className={`h-11 rounded-xl text-sm font-semibold border transition ${form.payment_option === 'down_payment' ? 'bg-solar text-ink border-solar' : 'bg-background border-border text-muted-foreground'}`}>Down payment</button>
              <button type="button" onClick={() => setVal('payment_option')('full_payment')} className={`h-11 rounded-xl text-sm font-semibold border transition ${form.payment_option === 'full_payment' ? 'bg-solar text-ink border-solar' : 'bg-background border-border text-muted-foreground'}`}>Full payment</button>
            </div>
          </div>
        )}
        <div><Label className="text-xs font-semibold">Amount *</Label><Input type="number" value={form.amount} onChange={set('amount')} className="mt-1 h-11 rounded-xl" /></div>
        <Button onClick={submit} disabled={saving} className="w-full h-11 rounded-xl bg-solar text-ink hover:bg-solar/90">
          {saving ? 'Saving…' : 'Add Billing Record'}
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No billing records yet.</p>}
        {items.map((inv) => (
          <div key={inv.id} className="p-3 rounded-xl border border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Receipt className="w-4 h-4 text-solar shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.document_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.date}{inv.payment_type ? ` · ${inv.payment_type}` : ''}</p>
                </div>
              </div>
              <Badge variant={statusVariant[inv.status] || 'muted'}>{statusLabel[inv.status] || inv.status}</Badge>
            </div>
            {inv.amount > 0 && <p className="mt-1 text-sm font-semibold">₱{inv.amount.toLocaleString()}</p>}
            {inv.payment_option && <p className="text-xs text-muted-foreground">{optionLabel[inv.payment_option] || inv.payment_option}{inv.installment_month ? ` · ${inv.installment_month} ${inv.installment_year}` : ''}</p>}

            {inv.status === 'proof_submitted' && inv.proof_of_payment_url && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-amber-700">Proof of payment submitted</p>
                  <a href={inv.proof_of_payment_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-solar flex items-center gap-1"><Eye className="w-4 h-4" /> View proof</a>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="cursor-pointer flex-1 min-w-0">
                    <input type="file" className="hidden" onChange={(e) => setReceiptFile((f) => ({ ...f, [inv.id]: e.target.files?.[0] || null }))} />
                    <span className="inline-flex w-full items-center justify-center gap-1.5 px-3 h-9 rounded-lg bg-muted text-xs font-semibold truncate">
                      {receiptFile[inv.id] ? receiptFile[inv.id].name : 'Attach receipt'}
                    </span>
                  </label>
                  <Button size="sm" onClick={() => approve(inv)} disabled={processing === inv.id} className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg h-9">
                    {processing === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                  </Button>
                  <button onClick={() => reject(inv)} disabled={processing === inv.id} className="h-9 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {inv.status === 'paid' && inv.receipt_url && (
              <a href={inv.receipt_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-solar"><FileText className="w-4 h-4" /> View receipt</a>
            )}

            <div className="mt-2 flex items-center">
              <button onClick={() => remove(inv.id)} className="text-muted-foreground hover:text-destructive ml-auto"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}