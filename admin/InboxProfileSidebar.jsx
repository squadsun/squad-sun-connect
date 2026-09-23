import { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Phone, MapPin, Briefcase, Tag, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Spinner, Badge } from '@/components/customer/ui';
import CustomerAvatar from '@/components/customer/CustomerAvatar';
import { ticketStatus } from '@/lib/format';

export default function InboxProfileSidebar({ ticketId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    setData(null);
    Promise.all([
      base44.entities.SupportTicket.get(ticketId),
      base44.entities.Customer.list('-created_date', 300),
      base44.entities.Project.list('-created_date', 300),
    ]).then(([t, customers, projects]) => {
      const cmap = {};
      (customers || []).forEach((c) => { cmap[c.id] = c; });
      const pmap = {};
      (projects || []).forEach((p) => { pmap[p.id] = p; });
      const customer = cmap[t.customer_id];
      const project = t.project_id ? pmap[t.project_id] : (projects || []).find((p) => p.customer_id === t.customer_id);
      setData({ ticket: t, customer, project });
    }).catch(() => setData(null));
  }, [ticketId]);

  if (!data) return <div className="flex-1 flex items-center justify-center"><Spinner label="Loading profile…" /></div>;
  const { ticket, customer, project } = data;

  const DetailRow = ({ icon: Icon, children }) => (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Profile header */}
      <div className="shrink-0 flex flex-col items-center pt-6 pb-4 px-4 border-b border-border">
        <CustomerAvatar customer={customer} size={80} showStatus={false} />
        <h2 className="font-display font-bold text-lg mt-3 text-center">{customer?.full_name || 'Customer'}</h2>
        {customer?.customer_code && <p className="text-xs text-muted-foreground">{customer.customer_code}</p>}
        <div className="flex items-center gap-1.5 mt-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Secure conversation</span>
        </div>
      </div>

      {/* Customer details */}
      <div className="p-4 space-y-3 border-b border-border">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Customer Info</h3>
        {customer?.email && <DetailRow icon={Mail}>{customer.email}</DetailRow>}
        {customer?.mobile && <DetailRow icon={Phone}>{customer.mobile}</DetailRow>}
        {customer?.property_address && (
          <DetailRow icon={MapPin}>
            {customer.property_address}{customer.city ? `, ${customer.city}` : ''}{customer.province ? `, ${customer.province}` : ''}
          </DetailRow>
        )}
        {customer?.solar_package && <DetailRow icon={Briefcase}>{customer.solar_package}</DetailRow>}
      </div>

      {/* Ticket details */}
      <div className="p-4 space-y-3 border-b border-border">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Ticket Info</h3>
        <DetailRow icon={Tag}>{ticket.ticket_number}</DetailRow>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={ticketStatus[ticket.status] || 'muted'}>{(ticket.status || '').replace(/_/g, ' ')}</Badge>
          {ticket.category && <Badge variant="muted">{ticket.category.replace(/_/g, ' ')}</Badge>}
          <Badge variant={ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'muted'}>{ticket.priority}</Badge>
        </div>
        {ticket.description && <p className="text-sm text-muted-foreground bg-muted/60 rounded-lg p-2.5">{ticket.description}</p>}
      </div>

      {/* Project info */}
      {project && (
        <div className="p-4 space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Project</h3>
          <DetailRow icon={Wrench}>{project.system_name || project.project_id}</DetailRow>
          {project.system_capacity_kw && (
            <p className="text-sm text-muted-foreground pl-6">{project.system_capacity_kw} kW system</p>
          )}
          {project.address && <DetailRow icon={MapPin}>{project.address}</DetailRow>}
        </div>
      )}
    </div>
  );
}