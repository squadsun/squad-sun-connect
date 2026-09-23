import { useState, useRef, useEffect, useCallback } from 'react';
import { Receipt, Camera, TrendingDown, TrendingUp, Plus, Loader2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCustomerData } from '@/lib/customerDataContext';
import { Card, Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { formatPeso as formatCurrency } from '@/lib/format';

const MERALCO_URL = 'https://www.meralco.com.ph/';

export default function MeralcoBillCard() {
  const { customer } = useCustomerData();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const loadBills = useCallback(async () => {
    if (!customer?.id) { setLoading(false); return; }
    try {
      const list = await base44.entities.MeralcoBill.filter(
        { customer_id: customer.id },
        '-created_date',
        10
      );
      setBills(list || []);
    } catch (e) {
      console.error('Failed to load Meralco bills', e);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => { loadBills(); }, [loadBills]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !customer?.id) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.InvokeLLM({
        prompt:
          "This is a photo of a Meralco electricity bill from the Philippines. " +
          "Extract the total amount due in PHP (the final payable amount), the billing period (e.g. 'Jul 2026' or the date range), and the due date. " +
          "Return only JSON.",
        response_json_schema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            bill_period: { type: 'string' },
            due_date: { type: 'string' }
          }
        },
        file_urls: [file_url]
      });
      const amount = Number(extracted?.amount);
      if (!amount || isNaN(amount)) {
        setError("Couldn't read the amount on that bill. Please use a clearer photo.");
        return;
      }
      await base44.entities.MeralcoBill.create({
        customer_id: customer.id,
        user_id: customer.user_id,
        amount,
        bill_period: extracted?.bill_period || '',
        due_date: extracted?.due_date || '',
        photo_url: file_url
      });
      setModalOpen(false);
      await loadBills();
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const latest = bills[0];
  const previous = bills[1];
  const diff = latest && previous ? latest.amount - previous.amount : null;

  return (
    <>
      <Card className="overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-xl bg-[#FF6600]/15 grid place-items-center">
              <Receipt className="w-5 h-5 text-[#FF6600]" />
            </span>
            <div className="flex-1">
              <h3 className="font-display font-semibold leading-tight">Meralco Bill</h3>
              <p className="text-xs text-muted-foreground">Track your electricity bill vs solar savings</p>
            </div>
            <a href={MERALCO_URL} target="_blank" rel="noreferrer" className="text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !latest ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No bills logged yet. Snap your Meralco bill to start tracking.</p>
              <Button onClick={() => setModalOpen(true)} className="bg-[#FF6600] text-white hover:bg-[#FF6600]/90 rounded-full">
                <Camera className="w-4 h-4" /> Log your bill
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Latest bill</p>
                  <p className="font-display font-extrabold text-lg mt-0.5">{formatCurrency(latest.amount)}</p>
                  {latest.bill_period && <p className="text-[11px] text-muted-foreground mt-0.5">{latest.bill_period}</p>}
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Previous bill</p>
                  <p className="font-display font-extrabold text-lg mt-0.5">
                    {previous ? formatCurrency(previous.amount) : '—'}
                  </p>
                  {previous?.bill_period && <p className="text-[11px] text-muted-foreground mt-0.5">{previous.bill_period}</p>}
                </div>
              </div>

              {diff != null && (
                <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                  diff < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {diff < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {diff < 0
                    ? `Down ${formatCurrency(Math.abs(diff))} from last bill`
                    : `Up ${formatCurrency(diff)} from last bill`}
                </div>
              )}

              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#FF6600]/40 text-[#FF6600] text-sm font-semibold active:scale-[0.99] transition"
              >
                <Plus className="w-4 h-4" /> Log new bill
              </button>
            </>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => !uploading && setModalOpen(false)} title="Log Meralco Bill">
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6600]/15 grid place-items-center mx-auto mb-3">
            {uploading ? <Loader2 className="w-8 h-8 text-[#FF6600] animate-spin" /> : <Camera className="w-8 h-8 text-[#FF6600]" />}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {uploading
              ? 'Reading your bill…'
              : 'Take a clear photo of your Meralco bill. We’ll read the amount automatically.'}
          </p>
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
          {!uploading && (
            <Button onClick={() => fileRef.current?.click()} className="bg-[#FF6600] text-white hover:bg-[#FF6600]/90 rounded-full">
              <Camera className="w-4 h-4" /> Capture bill
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}