import { Outlet, useParams } from 'react-router-dom';
import InboxList from './InboxList';
import InboxProfileSidebar from './InboxProfileSidebar';

export default function InboxLayout({ basePath = '/admin/inbox' }) {
  const { ticketId } = useParams();

  return (
    <div className="h-full flex bg-background/40 backdrop-blur-md">
      {/* Left column — conversation list */}
      <div className={`${ticketId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 shrink-0 border-r border-border flex-col h-full`}>
        <InboxList activeTicketId={ticketId} basePath={basePath} />
      </div>

      {/* Center column — conversation or empty state */}
      <div className={`${ticketId ? 'flex' : 'hidden md:flex'} flex-1 h-full flex-col min-w-0`}>
        <Outlet />
      </div>

      {/* Right column — profile sidebar (desktop only) */}
      {ticketId && (
        <div className="hidden lg:flex w-80 shrink-0 border-l border-border flex-col h-full">
          <InboxProfileSidebar ticketId={ticketId} />
        </div>
      )}
    </div>
  );
}