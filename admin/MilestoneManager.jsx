import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, Spinner, Badge } from '@/components/customer/ui';
import { useToast } from '@/components/ui/use-toast';
import { projectStatusLabel } from '@/lib/format';
import { ArrowLeft, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ensureMilestones, calcProgress, createMilestoneDocument } from '@/lib/milestoneTemplate';
import { logMilestoneAction } from '@/lib/auditLog';
import GanttChart from '@/components/admin/GanttChart';
import SolarMonitoringSetup from '@/components/admin/SolarMonitoringSetup';
import MilestoneCard from '@/components/admin/MilestoneCard';
import MilestoneDetailModal from '@/components/admin/MilestoneDetailModal';

export default function MilestoneManager({ project, onBack, portalMode = 'admin' }) {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const [milestones, setMilestones] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // All milestones are approved by admin only.
  //  - Engineer portal: submit only.
  //  - CSR portal: submit only.
  //  - Admin portal: admin approves everything.
  const canReviewEngineer = portalMode === 'admin';
  const canApproveCsr = portalMode === 'admin';
  const isEngineer = portalMode === 'engineer';
  const isCsr = portalMode === 'csr';
  const isAdmin = portalMode === 'admin';

  const load = async () => {
    const list = await ensureMilestones(project, role);
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setMilestones(list || []);
    return list || [];
  };
  useEffect(() => { load().catch(() => setMilestones([])); }, [project.id]);

  const progress = calcProgress(milestones);

  const uploadFiles = async (files) => {
    const urls = [];
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 25MB.`, variant: 'destructive' });
        return null;
      }
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      urls.push(file_url);
    }
    return urls;
  };

  const startWork = async (m, formData) => {
    try {
      const prev = m.status;
      await base44.entities.ProjectMilestone.update(m.id, {
        status: 'in_progress',
        date: formData.date, time: formData.time, end_time: formData.end_time,
      });
      await logMilestoneAction({ action: 'milestone_started', milestone: m, project, user, previousStatus: prev, newStatus: 'in_progress' });
      toast({ title: 'Work started', description: m.stage_label });
      setDetailModal(null);
      load();
    } catch {
      toast({ title: 'Failed to start work', variant: 'destructive' });
    }
  };

  const submitMilestone = async (m, formData, files, keptAttachments) => {
    setUploading(true);
    try {
      const newUrls = files.length > 0 ? await uploadFiles(files) : [];
      if (newUrls === null) return;
      const allUrls = [...(keptAttachments || []), ...newUrls];
      const isCsrMilestone = m.assigned_role === 'csr';
      const prev = m.status;

      if (isAdmin) {
        // Admin: save data then auto-approve (mark as complete)
        await base44.entities.ProjectMilestone.update(m.id, {
          status: 'waiting', review_status: 'pending_review',
          attachment_url: allUrls.join(','),
          date: formData.date, time: formData.time, end_time: formData.end_time,
          completed_by: user?.full_name || 'Admin', completed_date: formData.date,
          submitted_by_id: user.id,
        });
        await logMilestoneAction({ action: 'milestone_submitted', milestone: m, project, user, previousStatus: prev, newStatus: 'waiting' });
        if (isCsrMilestone) {
          await createMilestoneDocument({ ...m, date: formData.date }, project, allUrls, formData.amount);
        }
        await base44.functions.invoke('reviewMilestone', {
          milestone_id: m.id,
          action: 'approve',
        });
        toast({ title: 'Milestone completed' });
      } else {
        await base44.entities.ProjectMilestone.update(m.id, {
          status: 'waiting', review_status: 'pending_review',
          attachment_url: allUrls.join(','),
          date: formData.date, time: formData.time, end_time: formData.end_time,
          completed_by: user?.full_name || (isCsrMilestone ? 'CSR' : 'Engineer'), completed_date: formData.date,
          submitted_by_id: user.id,
        });
        await logMilestoneAction({ action: 'milestone_submitted', milestone: m, project, user, previousStatus: prev, newStatus: 'waiting' });
        if (isCsrMilestone) {
          await createMilestoneDocument({ ...m, date: formData.date }, project, allUrls, formData.amount);
          await base44.functions.invoke('notifyMilestoneSubmitted', { milestone_id: m.id });
          toast({ title: 'Submitted for admin review' });
        } else {
          await base44.functions.invoke('notifyMilestoneSubmitted', { milestone_id: m.id });
          toast({ title: 'Submitted for admin review' });
        }
      }
      setDetailModal(null);
      load();
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const approveMilestone = async (m) => {
    try {
      await base44.functions.invoke('reviewMilestone', {
        milestone_id: m.id,
        action: 'approve',
      });
      toast({ title: 'Milestone approved' });
      setDetailModal(null);
      load();
    } catch {
      toast({ title: 'Failed to approve milestone', variant: 'destructive' });
    }
  };

  const rejectMilestone = async (m, reason) => {
    if (!reason) return;
    try {
      await base44.functions.invoke('reviewMilestone', {
        milestone_id: m.id,
        action: 'reject',
        reason,
      });
      toast({ title: 'Sent back for revision' });
      setDetailModal(null);
      load();
    } catch {
      toast({ title: 'Failed to reject milestone', variant: 'destructive' });
    }
  };

  if (!milestones) return <Spinner label="Loading milestones…" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </button>
        {isAdmin && (
          <Link to={`/admin/audit-log?project_id=${project.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-solar hover:underline">
            <History className="w-3.5 h-3.5" /> View Activity Log
          </Link>
        )}
      </div>

      <Card className="p-4 mb-4">
        <h2 className="font-display font-bold text-lg">{project.system_name || 'Project'}</h2>
        <p className="text-sm text-muted-foreground">{project.project_id}</p>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Progress</span>
            <span className="text-xs font-bold text-solar">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-solar rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="mt-3"><Badge variant="muted">{projectStatusLabel[project.status] || project.status}</Badge></div>
      </Card>

      <Card className="p-4 mb-4">
        <h3 className="font-display font-semibold mb-3">Project Timeline</h3>
        <GanttChart milestones={milestones} />
      </Card>

      <h3 className="font-display font-semibold mb-3">Milestones</h3>
      <div className="space-y-2.5">
        {milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            m={m}
            role={role}
            isEngineer={isEngineer}
            isCsr={isCsr}
            isAdmin={isAdmin}
            onView={() => setDetailModal(m)}
          />
        ))}
      </div>

      {isAdmin && ['testing_commissioning', 'turnover', 'activation', 'project_completed'].includes(project.status) && (
        <div className="mt-4">
          <SolarMonitoringSetup project={project} />
        </div>
      )}

      {detailModal && (
        <MilestoneDetailModal
          milestone={detailModal}
          role={role}
          isEngineer={isEngineer}
          isCsr={isCsr}
          isAdmin={isAdmin}
          canReviewEngineer={canReviewEngineer}
          canApproveCsr={canApproveCsr}
          uploading={uploading}
          onClose={() => setDetailModal(null)}
          onStartWork={startWork}
          onSubmit={submitMilestone}
          onApprove={approveMilestone}
          onReject={rejectMilestone}
        />
      )}
    </div>
  );
}