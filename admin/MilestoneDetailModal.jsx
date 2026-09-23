import { useState } from 'react';
import { Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Textarea } from '@/components/ui/textarea';
import { milestoneStatus } from '@/lib/format';
import { CheckCircle, X, Clock, Paperclip, Upload, Trash2, AlertCircle, FileText as FileIcon } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function getFileTypeLabel(file) {
  const type = file.type || '';
  if (type.startsWith('image/')) return 'Image';
  if (type.startsWith('video/')) return 'Video';
  if (type === 'application/pdf') return 'PDF';
  return 'Document';
}

function getUrlFileType(url) {
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'Video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'Image';
  if (['pdf'].includes(ext)) return 'PDF';
  return 'Document';
}

function getFileIcon(file) {
  return <FileIcon className="w-4 h-4 text-amber-500 shrink-0" />;
}

function getUrlFileIcon(url) {
  return <FileIcon className="w-4 h-4 text-amber-500 shrink-0" />;
}

export default function MilestoneDetailModal({ milestone, role, isEngineer, isCsr, isAdmin, canReviewEngineer, canApproveCsr, onClose, onStartWork, onSubmit, onApprove, onReject, uploading }) {
  const m = milestone;
  const [date, setDate] = useState(m.date || '');
  const [startTime, setStartTime] = useState(m.time || '');
  const [endTime, setEndTime] = useState(m.end_time || '');
  const [newFiles, setNewFiles] = useState([]);
  const [keptAttachments, setKeptAttachments] = useState(
    m.attachment_url ? m.attachment_url.split(',').filter(Boolean) : []
  );
  const [rejectReason, setRejectReason] = useState('');
  const [amount, setAmount] = useState('');

  if (!m) return null;

  const status = milestoneStatus[m.status] || milestoneStatus.scheduled;
  const isCsrMilestone = m.assigned_role === 'csr';
  const isEngineerMilestone = !isCsrMilestone;
  const isCompleted = m.status === 'completed';
  const isPending = m.status === 'waiting';
  const isRevision = m.status === 'revision_required';
  const isInProgress = m.status === 'in_progress';
  const isUpcoming = m.status === 'scheduled';

  const canEngineerEdit = (isEngineer || isAdmin) && isEngineerMilestone && !isCompleted && !isPending;
  const canCsrEdit = (isCsr || isAdmin) && isCsrMilestone && !isCompleted && !isPending;
  const canEdit = canEngineerEdit || canCsrEdit;
  const canReview = isPending && ((isEngineerMilestone && canReviewEngineer) || (isCsrMilestone && canApproveCsr));
  const isCrossRoleView = (isEngineer && isCsrMilestone) || (isCsr && isEngineerMilestone);

  const isPayment = m.stage === 'full_payment';
  const roleLabel = isCsrMilestone ? 'CSR' : 'Engineer';
  const statusLabel = isPending ? 'Pending Approval' : status.label;

  const statusBadgeClass = isPending
    ? 'bg-[#FFF4D6] text-[#D69E2E]'
    : isCompleted
    ? 'bg-emerald-100 text-emerald-700'
    : isRevision
    ? 'bg-rose-100 text-rose-700'
    : 'bg-[#F3F3F3] text-[#616161]';

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    const remaining = 3 - keptAttachments.length - newFiles.length;
    if (remaining <= 0) {
      alert('Maximum 3 files allowed. Remove an existing file to add more.');
      return;
    }
    const oversized = selected.filter((f) => f.size > 25 * 1024 * 1024);
    if (oversized.length > 0) {
      alert(`${oversized.map((f) => f.name).join(', ')} exceed(s) the 25MB limit`);
    }
    const valid = selected.filter((f) => f.size <= 25 * 1024 * 1024);
    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) {
      alert(`Only ${remaining} more file(s) can be added (max 3 total).`);
    }
    setNewFiles((prev) => [...prev, ...toAdd]);
  };

  const removeNewFile = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeExistingAttachment = (idx) => setKeptAttachments((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!date) { alert('Please set a scheduled date'); return; }
    onSubmit(m, { date, time: startTime, end_time: endTime, amount: isPayment ? Number(amount) || 0 : undefined }, newFiles, keptAttachments);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { alert('Please provide a reason for rejection'); return; }
    onReject(m, rejectReason.trim());
  };

  const showFiles = canReview || (!canEdit && keptAttachments.length > 0);

  return (
    <Modal open onClose={onClose} title={m.stage_label}>
      <div className="space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F3F3] text-[#616161]">{roleLabel}</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass}`}>
            {isPending && <Clock className="w-3 h-3" />}
            {statusLabel}
          </span>
        </div>

        {/* Description */}
        {m.description && (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">{m.description}</p>
        )}

        {/* Date / Time Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-semibold text-[#616161]">Scheduled Date</Label>
            {canEdit && !isPending ? (
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-10 rounded-lg text-sm" />
            ) : (
              <p className="text-base mt-1 text-[#212121] font-bold">{m.date || 'Not scheduled'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#616161]">Start Time</Label>
            {canEdit && !isPending ? (
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 h-10 rounded-lg text-sm" />
            ) : (
              <p className="text-base mt-1 text-[#212121] font-bold">{m.time || '—'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#616161]">End Time</Label>
            {canEdit && !isPending ? (
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 h-10 rounded-lg text-sm" />
            ) : (
              <p className="text-base mt-1 text-[#212121] font-bold">{m.end_time || '—'}</p>
            )}
          </div>
        </div>

        {/* Revision notes */}
        {isRevision && m.notes && (
          <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-lg p-2.5">
            <span className="font-semibold flex items-center gap-1 mb-1"><AlertCircle className="w-3.5 h-3.5" /> Rejection reason: </span>
            {m.notes}
          </div>
        )}

        {/* Payment amount */}
        {canEdit && !isPending && isPayment && (
          <div>
            <Label className="text-xs font-semibold text-[#616161]">Payment amount (₱)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 h-10 rounded-lg" />
          </div>
        )}

        {/* File upload (edit mode) */}
        {canEdit && !isPending && (
          <div>
            <Label className="text-xs font-semibold text-[#616161]">Upload Proof / Completion Files</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">Max 3 files · 25MB each · Images, videos, or documents</p>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E0E0E0] rounded-xl py-5 cursor-pointer hover:border-solar/50 transition">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs font-semibold text-muted-foreground">Click to select files</span>
                <input type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx" onChange={handleFiles} className="hidden" />
              </label>
            </div>

            {keptAttachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {keptAttachments.map((url, i) => (
                  <div key={`existing-${i}`} className="flex items-center gap-2 text-xs bg-card rounded-lg px-2.5 py-2 border border-[#E0E0E0]">
                    {getUrlFileIcon(url)}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-[#333333]">Attachment {i + 1}</p>
                      <p className="text-[#999999]">{getUrlFileType(url)}</p>
                    </div>
                    <a href={url} target="_blank" rel="noreferrer" className="text-solar shrink-0"><Paperclip className="w-3.5 h-3.5" /></a>
                    <button type="button" onClick={() => removeExistingAttachment(i)} className="text-rose-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            {newFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {newFiles.map((f, i) => (
                  <div key={`new-${i}`} className="flex items-center gap-2 text-xs bg-card rounded-lg px-2.5 py-2 border border-[#E0E0E0]">
                    {getFileIcon(f)}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-[#333333]">{f.name}</p>
                      <p className="text-[#999999]">{getFileTypeLabel(f)} · {formatFileSize(f.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeNewFile(i)} className="text-rose-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submitted files (review / view-only) */}
        {showFiles && (
          <div>
            <p className="text-xs font-bold text-[#333333] mb-1.5">Submitted Files</p>
            <div className="space-y-1.5">
              {keptAttachments.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-card rounded-lg px-2.5 py-2 border border-[#E0E0E0]">
                  {getUrlFileIcon(url)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-[#333333]">Attachment {i + 1}</p>
                    <p className="text-[#999999]">{getUrlFileType(url)}</p>
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" className="text-solar shrink-0"><Paperclip className="w-3.5 h-3.5" /></a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission metadata */}
        {m.completed_by && (
          <p className="text-xs text-[#999999]">
            Submitted by {m.completed_by}{m.completed_date ? ` on ${m.completed_date}` : ''}
          </p>
        )}

        {/* Review info */}
        {m.reviewed_by && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Reviewed by {m.reviewed_by}{m.reviewed_date ? ` on ${m.reviewed_date}` : ''}
          </p>
        )}

        {/* Review section (CSR / admin on pending task) */}
        {canReview && (
          <div className="space-y-2 border-t border-[#E0E0E0] pt-3">
            <Label className="text-xs font-bold text-[#333333]">Rejection Reason (required to reject)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Provide reason for revision request..." className="rounded-xl" />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-full bg-[#008A5B] text-white hover:bg-[#008A5B]/90" onClick={() => onApprove(m)}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" className="flex-1 rounded-full bg-[#F58C96] text-white hover:bg-[#F58C96]/90" onClick={handleReject}>
                <X className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}

        {/* Edit actions */}
        {canEdit && !isPending && !canReview && (
          <div className="flex items-center gap-2 pt-3 border-t border-[#E0E0E0]">
            <Button size="sm" className="flex-1 rounded-full bg-solar text-ink hover:bg-solar/90" onClick={handleSubmit} disabled={uploading}>
              <FileIcon className="w-3.5 h-3.5 mr-1" /> {uploading ? 'Uploading…' : isAdmin ? 'Mark as Complete' : 'Submit for Approval'}
            </Button>
          </div>
        )}

        {/* Awaiting review (submitter viewing own pending task) */}
        {isPending && !canReview && (
          <p className="text-xs font-semibold text-[#E65100] flex items-center gap-1 pt-3 border-t border-[#E0E0E0]">
            <Clock className="w-3.5 h-3.5" /> Awaiting review
          </p>
        )}

        {/* Completed */}
        {isCompleted && (
          <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 pt-3 border-t border-[#E0E0E0]">
            <CheckCircle className="w-4 h-4" /> Completed
          </p>
        )}

        {/* Cross-role view-only */}
        {isCrossRoleView && !isCompleted && !isPending && (
          <p className="text-xs text-muted-foreground pt-3 border-t border-[#E0E0E0]">View only — not your assigned task</p>
        )}
      </div>
    </Modal>
  );
}