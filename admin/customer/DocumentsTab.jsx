import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Badge, Spinner } from '@/components/customer/ui';

const REQUIRED = [
  { key: 'Reservation Contract', category: 'contract' },
  { key: 'Memorandum of Agreement', category: 'contract' },
  { key: 'Customer Information (Signed)', category: 'contract' },
  { key: 'Receipts', category: 'invoice' },
  { key: 'Service Reports', category: 'service_report' },
];

export default function DocumentsTab({ customer }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);

  const load = async () => {
    const list = await base44.entities.Document.filter({ customer_id: customer.id }, '-date', 200);
    setDocs(list || []);
  };
  useEffect(() => { load().catch(() => setDocs([])); }, [customer.id]);

  const findDoc = (key) => (docs || []).find((d) => d.title === key);

  const upload = async (key, category, file) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const existing = findDoc(key);
      if (existing) {
        await base44.entities.Document.update(existing.id, { file_url, date: new Date().toISOString().split('T')[0] });
      } else {
        await base44.entities.Document.create({
          customer_id: customer.id,
          user_id: customer.user_id || '',
          title: key,
          category,
          file_url,
          date: new Date().toISOString().split('T')[0],
        });
      }
      toast({ title: `${key} uploaded` });
      load();
    } catch {
      toast({ title: 'Upload failed' });
    } finally {
      setUploadingKey(null);
    }
  };

  if (!docs) return <Spinner label="Loading documents…" />;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-1">Upload each required document for this customer.</p>
      {REQUIRED.map((r) => {
        const doc = findDoc(r.key);
        const uploaded = !!doc;
        return (
          <div key={r.key} className="p-3 rounded-xl border border-border flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${uploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
              {uploaded ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.key}</p>
              {uploaded ? (
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-solar font-semibold">View uploaded</a>
              ) : (
                <p className="text-xs text-muted-foreground">Pending</p>
              )}
            </div>
            <Badge variant={uploaded ? 'success' : 'muted'}>{uploaded ? 'Uploaded' : 'Pending'}</Badge>
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={(e) => upload(r.key, r.category, e.target.files?.[0])} />
              <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-solar/10 text-solar text-xs font-semibold hover:bg-solar/20 transition">
                {uploadingKey === r.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploaded ? 'Replace' : 'Upload'}
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
}