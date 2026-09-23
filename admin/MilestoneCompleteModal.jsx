import { useState } from 'react';
import { Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Upload, X } from 'lucide-react';

export default function MilestoneCompleteModal({ milestone, onClose, onSubmit, uploading }) {
  const [date, setDate] = useState(milestone.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(milestone.time || '');
  const [endTime, setEndTime] = useState(milestone.end_time || '');
  const [amount, setAmount] = useState('');
  const [files, setFiles] = useState([]);

  const isPayment = milestone.stage === 'full_payment';
  const isCsr = milestone.assigned_role === 'csr';

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = (e) => {
    e.preventDefault();
    if (!files.length) return;
    onSubmit({ date, time: startTime, end_time: endTime, amount: isPayment ? Number(amount) || 0 : undefined }, files);
  };

  return (
    <Modal open onClose={onClose} title={`Submit: ${milestone.stage_label}`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="text-xs font-semibold">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-11 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-semibold">Start time</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 h-11 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs font-semibold">End time</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 h-11 rounded-xl" />
          </div>
        </div>
        {isPayment && (
          <div>
            <Label className="text-xs font-semibold">Payment amount (₱)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 h-11 rounded-xl" />
          </div>
        )}
        <div>
          <Label className="text-xs font-semibold">Attach file(s) — picture, video, or document *</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">Max 25MB per file</p>
          <div className="mt-2">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-6 cursor-pointer hover:border-solar/50 transition">
              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs font-semibold text-muted-foreground">Click to select files</span>
              <input type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx" onChange={handleFiles} className="hidden" />
            </label>
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/60 rounded-lg px-2.5 py-1.5">
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-muted-foreground ml-2 shrink-0">{f.type?.split('/')[0] || 'file'} · {(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button type="button" onClick={() => removeFile(i)} className="ml-2 text-rose-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" disabled={uploading || !files.length} className="w-full h-11 rounded-xl bg-solar text-ink hover:bg-solar/90">
          {uploading ? 'Uploading…' : 'Submit for Approval'}
        </Button>
      </form>
    </Modal>
  );
}