import { Link } from 'react-router-dom';
import { Card, Badge } from '@/components/customer/ui';
import { ArrowRight } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, to, color = 'bg-solar/10 text-solar', className = '' }) {
  return (
    <Link to={to} className={className}>
      <Card className="p-4 h-full hover:shadow-md transition">
        <span className={`w-10 h-10 rounded-xl grid place-items-center mb-2 ${color}`}>
          <Icon className="w-5 h-5" />
        </span>
        <p className="text-2xl font-display font-extrabold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </Card>
    </Link>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="font-display font-bold text-lg leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    new: 'muted', open: 'muted', draft: 'muted', assigned: 'solar',
    accepted: 'solar', scheduled: 'solar', sent: 'solar', signed: 'solar',
    on_the_way: 'warning', on_site: 'warning', in_progress: 'warning',
    active: 'success', completed: 'success', resolved: 'success', closed: 'muted',
    paid: 'success', partial: 'warning', overdue: 'danger',
    cancelled: 'danger', rejected: 'danger', delayed: 'danger',
    report_submitted: 'solar',
  };
  return <Badge variant={map[status] || 'muted'}>{(status || '').replace(/_/g, ' ')}</Badge>;
}

export function PriorityBadge({ priority }) {
  const map = { low: 'muted', normal: 'solar', high: 'warning', urgent: 'danger' };
  return <Badge variant={map[priority] || 'muted'}>{priority}</Badge>;
}

export function ListItem({ to, title, subtitle, right, onClick }) {
  const content = (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
  if (to) return <Link to={to} className="block">{content}</Link>;
  return <div onClick={onClick} className="block cursor-pointer">{content}</div>;
}

export function DataTable({ columns, rows, onRowClick, emptyText = 'No records found.' }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {columns.map((col) => (
              <th key={col.key} className="py-2 px-3 font-semibold text-muted-foreground whitespace-nowrap text-xs uppercase tracking-wide">{col.label}</th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer">
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">{col.render ? col.render(row) : row[col.key]}</td>
              ))}
              <td className="py-2.5 px-3"><ArrowRight className="w-4 h-4 text-muted-foreground" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}