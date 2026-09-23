import { Badge } from '@/components/customer/ui';
import { milestoneStatus } from '@/lib/format';
import { Paperclip, AlertCircle, ChevronRight, CheckCircle2, Clock, Edit3 } from 'lucide-react';

export default function MilestoneCard({ m, role, isEngineer, isCsr, isAdmin, onView }) {
  const status = milestoneStatus[m.status] || milestoneStatus.scheduled;
  const isCsrMilestone = m.assigned_role === 'csr';
  const isEngineerMilestone = !isCsrMilestone;
  const isCompleted = m.status === 'completed';
  const isPending = m.status === 'waiting';
  const isRevision = m.status === 'revision_required';
  const isInProgress = m.status === 'in_progress';
  const isUpcoming = m.status === 'scheduled';
  const attachments = m.attachment_url ? m.attachment_url.split(',').filter(Boolean) : [];

  // Engineers can only act on engineer-assigned milestones
  const canEngineerAct = (isEngineer || isAdmin) && isEngineerMilestone && !isCompleted && !isPending;
  const canCsrAct = (isCsr || isAdmin) && isCsrMilestone && !isCompleted && !isPending;
  const canReview = isAdmin && isPending;

  // Determine the right-side action button
  let actionLabel = status.label;
  let actionIcon = null;
  let actionClass = 'bg-muted text-muted-foreground';

  if (isCompleted) {
    actionLabel = 'Completed';
    actionIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
    actionClass = 'bg-emerald-100 text-emerald-700';
  } else if (isPending) {
    actionLabel = 'Pending Approval';
    actionIcon = <Clock className="w-3.5 h-3.5" />;
    actionClass = 'bg-amber-100 text-amber-700';
  } else if (isRevision) {
    actionLabel = 'Revision Required';
    actionIcon = <AlertCircle className="w-3.5 h-3.5" />;
    actionClass = 'bg-rose-100 text-rose-700';
  } else if (canEngineerAct || canCsrAct) {
    if (isUpcoming) {
      actionLabel = 'View / Update';
      actionIcon = <Edit3 className="w-3.5 h-3.5" />;
      actionClass = 'bg-solar/15 text-solar';
    } else if (isInProgress) {
      actionLabel = 'View / Update';
      actionIcon = <Edit3 className="w-3.5 h-3.5" />;
      actionClass = 'bg-solar/15 text-solar';
    }
  }

  // Engineers viewing CSR milestones - read only
  const isReadOnly = isEngineer && isCsrMilestone;

  return (
    <div
      onClick={onView}
      className={`rounded-2xl border p-3.5 cursor-pointer hover:border-solar/50 hover:shadow-sm transition active:scale-[0.99] ${
        isCompleted ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'
        : isPending ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20'
        : isRevision ? 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20'
        : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{m.stage_label}</span>
            <Badge variant={isCsrMilestone ? 'solar' : 'muted'} className="text-[10px]">{isCsrMilestone ? 'CSR' : 'Engineer'}</Badge>
          </div>
          {m.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
          )}
          {m.date && (
            <p className="text-xs text-muted-foreground mt-1">
              {m.date}{m.time ? ` · ${m.time}` : ''}{m.end_time ? ` – ${m.end_time}` : ''}
            </p>
          )}
          {isRevision && m.notes && (
            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 truncate">
              <AlertCircle className="w-3 h-3 shrink-0" /> {m.notes}
            </p>
          )}
          {attachments.length > 0 && (
            <p className="text-[11px] text-solar mt-0.5 flex items-center gap-1">
              <Paperclip className="w-3 h-3" /> {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${actionClass}`}>
            {actionIcon}
            {actionLabel}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}